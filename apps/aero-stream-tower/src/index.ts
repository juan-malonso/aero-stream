import { Hono, Context } from 'hono';
import { upgradeWebSocket } from 'hono/cloudflare-workers';

import { ResourceController, SyncController } from './application';
import { GeneratePresignedUrlUseCase } from './domain';
import { R2StorageAdapter, InMemorySecurityAdapter } from './infrastructure';
import { ORIGINS } from './constants';

type Bindings = {
  R2_BUCKET: any; // Se inyectará el Bucket de R2 desde Cloudflare env
};

type Variables = {
  secretToken: string;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();
const generatePresignedUrlUseCase = new GeneratePresignedUrlUseCase();
const securityAdapter = new InMemorySecurityAdapter(ORIGINS);

// 1. Middleware de Evaluación de Origen
app.use('*', async (c: Context, next: () => Promise<void>) => {
  const origin = c.req.header('Origin');

  if (origin) {
    const originContext = await securityAdapter.validateOrigin(origin);
    if (originContext) {
      c.set('secretToken', originContext.token);
    }
  }

  await next();
});

// 2. Middleware de Validación de CORS
app.use('*', async (c: Context, next: () => Promise<void>) => {
  const secretToken = c.get('secretToken');
  const origin = c.req.header('Origin');

  if (origin) {
    if (!secretToken) {
      return c.text('Forbidden: Origin not allowed', 403);
    }
    await next();
    // Adjuntamos headers CORS de éxito
    c.res.headers.set('Access-Control-Allow-Origin', origin);
    c.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  } else {
    await next();
  }
});

// Endpoint to get a pre-signed URL for a resource
app.get('/resources/:sessionId/:resourceId', (c: Context) => {
  const storageAdapter = new R2StorageAdapter(c.env.R2_BUCKET);
  const resourceController = new ResourceController(generatePresignedUrlUseCase, storageAdapter);
  return resourceController.getPresignedUrl(c);
});

// Endpoint unificado de WebSocket para toda la sincronización de la Tower (App Sync)
app.get('/app/sync', upgradeWebSocket((c: Context) => {
  const storageAdapter = new R2StorageAdapter(c.env.R2_BUCKET);
  const syncController = new SyncController(storageAdapter);
  return syncController.handleWebSocket(c);
}));

export default app;

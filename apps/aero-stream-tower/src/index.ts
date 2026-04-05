import { ResourceController, SyncController } from './application';
import { ORIGINS } from './constants';
import { type AppContext, AppRouter, GeneratePresignedUrlUseCase } from './domain';
import { InMemorySecurityAdapter, R2StorageAdapter } from './infrastructure';

import { upgradeWebSocket } from 'hono/cloudflare-workers';

const app = new AppRouter();
const generatePresignedUrlUseCase = new GeneratePresignedUrlUseCase();
const securityAdapter = new InMemorySecurityAdapter(ORIGINS);

// 1. Origin Evaluation Middleware
app.use('*', async (c: AppContext, next: () => Promise<void>) => {
  const origin = c.req.header('Origin');

  if (origin) {
    const originContext = await securityAdapter.validateOrigin(origin);
    if (originContext?.token) {
      c.set('secretToken', originContext.token);
    }
  }

  await next();
});

// 2. CORS Validation Middleware
app.use('*', async (c: AppContext, next: () => Promise<void>) => {
  const secretToken = c.get('secretToken');
  const origin = c.req.header('Origin');

  if (origin) {
    if (!secretToken) {
      return c.text('Forbidden: Origin not allowed', 403);
    }
    await next();
    // Attach success CORS headers
    c.res.headers.set('Access-Control-Allow-Origin', origin);
    c.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  } else {
    await next();
  }
});

// Endpoint to get a pre-signed URL for a resource
app.get('/resources/:sessionId/:resourceId{.*}', (c: AppContext) => {
  const env = c.env;
  const storageAdapter = new R2StorageAdapter(env.MEDIA_BUCKET);
  const resourceController = new ResourceController(generatePresignedUrlUseCase, storageAdapter);
  return resourceController.getPresignedUrl(c);
});

// Endpoint for local development to download a resource
app.get('/download/:sessionId/:resourceId{.*}', (c: AppContext) => {
  const env = c.env;
  const storageAdapter = new R2StorageAdapter(env.MEDIA_BUCKET);
  const resourceController = new ResourceController(generatePresignedUrlUseCase, storageAdapter);
  return resourceController.downloadResource(c);
});

// Unified WebSocket endpoint for all Tower synchronization (App Sync)
app.get('/app/sync', upgradeWebSocket((c: AppContext) => {
  const env = c.env;
  const storageAdapter = new R2StorageAdapter(env.MEDIA_BUCKET);
  const syncController = new SyncController(storageAdapter);
  return syncController.handleWebSocket(c);
}));

export default app;

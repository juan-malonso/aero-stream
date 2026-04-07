import { ResourceController, SyncController } from './application';
import { ORIGINS } from './constants';
import { type AppContext, AppRouter, GeneratePresignedUrlUseCase } from './domain';
import { InMemoryWorkflowAdapter, R2StorageAdapter } from './infrastructure';
import { Logger } from './utils';

import { upgradeWebSocket } from 'hono/cloudflare-workers';
import { cors } from 'hono/cors';

const app = new AppRouter();
const logger = new Logger('AppRouter');
const generatePresignedUrlUseCase = new GeneratePresignedUrlUseCase();
const securityAdapter = new InMemoryWorkflowAdapter(ORIGINS);

// Global CORS Middleware
app.use('*', cors());

// Middleware de Autenticación
app.use('/app/sync', async (c: AppContext, next: () => Promise<void>) => {
  const origin = c.req.header('Origin');
  if (!origin) {
    logger.warn('WebSocket connection attempt without Origin header');
    return c.text('Forbidden: Origin header missing', 403);
  }

  const wsProtocol = c.req.header('sec-websocket-protocol');
  const workflowId = wsProtocol ? wsProtocol.split(',')[0].trim() : null;
  if (!workflowId) {
    logger.warn('WebSocket connection attempt without workflowId', { origin });
    return c.text('Forbidden: Workflow ID missing', 403);
  }

  const workflowContext = await securityAdapter.getWorkflow(workflowId);
  if (!workflowContext?.connection.origins.includes(origin)) {
    logger.warn('WebSocket connection attempt from unauthorized origin', { origin, workflowId });
    return c.text('Forbidden: Not Allowed', 403);
  }

  c.set('secretToken', workflowContext.connection.encription.symetric);
  c.set('workflowId', workflowId);
  
  await next();
  c.res.headers.set('Sec-WebSocket-Protocol', workflowId);
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

export { StateMachineInstance, StepProcessorWorkflow } from './domain';
export default app;

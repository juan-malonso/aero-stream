import { Hono } from 'hono';
import { upgradeWebSocket } from 'hono/cloudflare-workers';

type Bindings = {
  ALLOWED_ORIGINS: string;
  SECRET_TOKEN_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Middleware de Seguridad
app.use('*', async (c, next) => {
  const allowedOrigins = (c.env.ALLOWED_ORIGINS || '').split(',');
  const origin = c.req.header('Origin');
  if (origin && !allowedOrigins.includes(origin)) {
    return c.text('Forbidden', 403);
  }
  await next();
});

// Endpoint para solicitar acceso al túnel (Pilot)
app.get('/request-flight', async (c) => {
  const timestamp = Date.now();
  const encoder = new TextEncoder();
  const data = encoder.encode(`${timestamp}-${c.env.SECRET_TOKEN_KEY}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const ticket = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return c.json({
    ticket,
    expires: timestamp + 60000,
    pilot_url: 'wss://aero-stream-pilot.tu-subdominio.workers.dev',
  });
});

// Endpoint WebSocket para la conexión con el Pilot
app.get(
  '/tower-stream',
  upgradeWebSocket((c) => {
    return {
      onMessage(event, ws) {
        const message =
          typeof event.data === 'string'
            ? event.data
            : new TextDecoder().decode(event.data as ArrayBuffer);

        console.log(`Tower recibió: ${message}`);

        // Interacción documentada: Pilot -> Tower -> Pilot
        if (message.includes('pilot aproaching')) {
          console.log('Tower: Autorizando aterrizaje...');
          ws.send('authorize landing');
        }
      },
      onOpen(_evt, _ws) {
        console.log('Tower: Conexión establecida con el Pilot.');
      },
      onClose(_evt, _ws) {
        console.log('Tower: Conexión cerrada.');
      },
    };
  })
);

export default app;

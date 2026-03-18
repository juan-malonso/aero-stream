import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { upgradeWebSocket } from 'hono/cloudflare-workers';
import nacl from 'tweetnacl';
import { v4 as uuidv4 } from 'uuid';

type Bindings = {
  ALLOWED_ORIGINS: string;
  SECRET_TOKEN_KEY: string;
  TICKET_CACHE: Map<string, number>;
};

const app = new Hono<{ Bindings: Bindings }>();

// Middleware de inicialización del caché
app.use('*', async (c, next) => {
  if (!c.env.TICKET_CACHE) {
    c.env.TICKET_CACHE = new Map<string, number>();
  }
  await next();
});

// Middleware de CORS
app.use('*', cors({
  origin: (origin, c) => {
    // Permitir explícitamente el origen de Next.js para desarrollo local
    if (origin === 'http://localhost:3000') {
      return origin;
    }
    
    // Mantener tu lógica de seguridad con variables de entorno para producción
    const allowedOrigins = (c.env?.ALLOWED_ORIGINS || '').split(',');
    if (origin && allowedOrigins.includes(origin)) {
      return origin;
    }
    
    return null; // Bloquear si no coincide
  },
  allowMethods: ['GET', 'POST', 'OPTIONS'],
}));

// Endpoint para solicitar acceso al túnel (Pilot)
app.get('/request-flight', async (c) => {
  const timestamp = Date.now();
  const nonce = uuidv4();
  const encoder = new TextEncoder();
  const data = encoder.encode(`${timestamp}-${nonce}-${c.env.SECRET_TOKEN_KEY}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const ticket = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Añadir al caché con expiración
  c.env.TICKET_CACHE.set(ticket, timestamp);

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
    let isFirstMessage = true;
    let sessionPublicKey: Uint8Array | null = null;
    let sessionPrivateKey: Uint8Array | null = null;
    let sessionId: string | null = null;

    return {
      async onMessage(event, ws) {
        if (isFirstMessage) {
          try {
            const message = JSON.parse(event.data as string);
            const ticket = message.ticket;

            if (!ticket || !c.env.TICKET_CACHE.has(ticket)) {
              throw new Error('Invalid or missing ticket');
            }

            const ticketTimestamp = c.env.TICKET_CACHE.get(ticket)!;
            if (Date.now() - ticketTimestamp > 60000) {
              c.env.TICKET_CACHE.delete(ticket);
              throw new Error('Ticket expired');
            }

            c.env.TICKET_CACHE.delete(ticket); // El ticket es de un solo uso

            const nonce = new Uint8Array(24); // Assuming a fixed or derived nonce
            const secretBytes = new TextEncoder().encode(ticket);
            const secretKey = new Uint8Array(32);
            secretKey.set(secretBytes.slice(0, 32));
            const decrypted = nacl.secretbox.open(new Uint8Array(Object.values(message.payload)), nonce, secretKey);

            if (!decrypted) {
              throw new Error('Failed to decrypt first message');
            }

            const pilotPublicKey = new Uint8Array(Object.values(JSON.parse(new TextDecoder().decode(decrypted)).publicKey));

            const newKeyPair = nacl.box.keyPair();
            sessionPublicKey = newKeyPair.publicKey;
            sessionPrivateKey = newKeyPair.secretKey;
            sessionId = uuidv4();

            const response = {
              id: sessionId,
              key: Array.from(sessionPublicKey),
            };

            const responseNonce = nacl.randomBytes(nacl.box.nonceLength);
            const encryptedResponse = nacl.box(
              new TextEncoder().encode(JSON.stringify(response)),
              responseNonce,
              pilotPublicKey,
              sessionPrivateKey
            );

            ws.send(JSON.stringify({ payload: Array.from(encryptedResponse), nonce: Array.from(responseNonce), key: Array.from(sessionPublicKey) }));
            console.log(`New session started with ID: ${sessionId}`);
            isFirstMessage = false;
          } catch (error) {
            console.error('Error handling first message:', error);
            ws.close();
          }
        } else {
          // Handle subsequent messages
          // Decrypt with session keys
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

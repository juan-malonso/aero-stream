import { Context } from 'hono';
import nacl from 'tweetnacl';
import { v4 as uuidv4 } from 'uuid';
import { StoragePort, VideoService, WebSocketDispatcherUseCase } from '../../domain';
import {
  MAX_CONNECTION_TIME_MS,
  INACTIVITY_TIMEOUT_MS,
} from '@/constants';

export class SyncController {
  constructor(private readonly storageAdapter: StoragePort) {}

  handleWebSocket(c: Context) {
    const storageAdapter = this.storageAdapter;
    const videoService = new VideoService(storageAdapter);
    const dispatcher = new WebSocketDispatcherUseCase(videoService);

    let isHandshakeComplete = false;
    let sessionPublicKey: Uint8Array | null = null;
    let sessionPrivateKey: Uint8Array | null = null;
    let sessionId: string | null = null;

    let maxTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let inactivityTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let warningTimeoutIds: ReturnType<typeof setTimeout>[] = [];

    const clearTimers = () => {
      if (maxTimeoutId) clearTimeout(maxTimeoutId);
      if (inactivityTimeoutId) clearTimeout(inactivityTimeoutId);
      warningTimeoutIds.forEach((id) => clearTimeout(id));
      warningTimeoutIds = [];
    };

    const resetInactivityTimers = (ws: WebSocket) => {
      if (inactivityTimeoutId) clearTimeout(inactivityTimeoutId);
      warningTimeoutIds.forEach((id) => clearTimeout(id));
      warningTimeoutIds = [];

      warningTimeoutIds.push(setTimeout(() => {
        try { ws.send(JSON.stringify({ type: 'warning', message: 'Connection will close in 15s due to inactivity' })); } catch (e) {}
      }, 5000));
      warningTimeoutIds.push(setTimeout(() => {
        try { ws.send(JSON.stringify({ type: 'warning', message: 'Connection will close in 10s due to inactivity' })); } catch (e) {}
      }, 10000));
      warningTimeoutIds.push(setTimeout(() => {
        try { ws.send(JSON.stringify({ type: 'warning', message: 'Connection will close in 5s due to inactivity' })); } catch (e) {}
      }, 15000));

      inactivityTimeoutId = setTimeout(() => {
        try {
          ws.send(JSON.stringify({ type: 'error', message: `Connection closed due to ${INACTIVITY_TIMEOUT_MS / 1000}s of inactivity` }));
          ws.close();
        } catch (e) {}
      }, INACTIVITY_TIMEOUT_MS);
    };

    const decryptMessage = (data: string | ArrayBuffer): string | ArrayBuffer => {
      // TODO: Usar sessionPrivateKey y sessionPublicKey para desencriptar
      return data;
    };

    return {
      async onMessage(event: MessageEvent, ws: WebSocket) {
        try {
          if (!isHandshakeComplete) {
            const message = JSON.parse(event.data as string);
            const expectedToken = c.get('secretToken');
            
            if (!expectedToken) {
              throw new Error('Invalid or missing authorization token');
            }

            // 1. Desencriptar pilotKey de forma simétrica usando el token configurado
            const nonce = new Uint8Array(message.nonce);
            const encryptedPayload = new Uint8Array(message.payload);

            const secretBytes = new TextEncoder().encode(expectedToken);
            const secretKey = new Uint8Array(32);
            secretKey.set(secretBytes.slice(0, 32));
            
            const decrypted = nacl.secretbox.open(encryptedPayload, nonce, secretKey);
            if (!decrypted) throw new Error('Failed to decrypt handshake message');
            
            const pilotPublicKey = new Uint8Array(JSON.parse(new TextDecoder().decode(decrypted)).pilotKey);

            // 2. Generar las claves de la Tower
            const newKeyPair = nacl.box.keyPair();
            sessionPublicKey = newKeyPair.publicKey;
            sessionPrivateKey = newKeyPair.secretKey;
            sessionId = uuidv4();

            // 3. Encriptar la towerKey y sessionId usando la pilotKey (Asimétrico)
            const responsePayload = JSON.stringify({ 
              towerKey: Array.from(sessionPublicKey), 
              sessionId 
            });
            const responseNonce = nacl.randomBytes(nacl.box.nonceLength);
            const encryptedResponse = nacl.box(
              new TextEncoder().encode(responsePayload), 
              responseNonce, 
              pilotPublicKey, 
              sessionPrivateKey
            );

            // 4. Responder al Pilot entregando el paquete y la llave pública de la Torre en claro
            ws.send(JSON.stringify({ 
              type: 'HANDSHAKE_ACK',
              payload: Array.from(encryptedResponse), 
              nonce: Array.from(responseNonce), 
              towerKey: Array.from(sessionPublicKey) 
            }));
            
            console.log(`New session started with ID: ${sessionId}`);
            
            // Log asíncrono en R2 de nueva conexión
            await storageAdapter.upload(`flights/${sessionId}.txt`, `Flight connected at: ${new Date().toISOString()}`);
            
            isHandshakeComplete = true;
            resetInactivityTimers(ws);
            return;
          }

          resetInactivityTimers(ws);
          const decryptedData = decryptMessage(event.data);
          const decryptedEvent = { ...event, data: decryptedData } as MessageEvent;
          await dispatcher.dispatch(decryptedEvent, ws);
        } catch (error) {
          console.error('Error procesando el mensaje en SyncController:', error);
          if (!isHandshakeComplete) ws.close(1008, 'Policy Violation: Handshake fallido o no autorizado');
        }
      },
      
      onOpen(_evt: Event, ws: WebSocket) {
        console.log('Tower: Connection established with the Pilot.');
        maxTimeoutId = setTimeout(() => {
          try { ws.send(JSON.stringify({ type: 'error', message: `Connection closed due to reaching the maximum time of ${MAX_CONNECTION_TIME_MS / 1000}s` })); ws.close(); } catch (e) {}
        }, MAX_CONNECTION_TIME_MS);
        resetInactivityTimers(ws);
      },

      async onClose(_event: CloseEvent, ws: WebSocket) {
        console.log('Tower: Connection closed.');
        clearTimers();
        await dispatcher.handleDisconnect();
      },
    };
  }
}
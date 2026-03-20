
import nacl from 'tweetnacl';
import { v4 as uuidv4 } from 'uuid';

import { 
  Context, 
  Events, 
  Payload, 
  StoragePort, 
  VideoService, 
  WebSocketDispatcherUseCase
} from '@/domain';
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

    // Encryption keys for the current session
    let pilotPublicKey: Uint8Array | null = null;
    let towerPublicKey: Uint8Array | null = null;
    let towerPrivateKey: Uint8Array | null = null;

    let sessionId: string | null = null;

    // Timeouts timers
    let maxTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let inactivityTimeoutId: ReturnType<typeof setTimeout> | null = null;

    // ====================================================== HELPER FUNCTIONS =

    // decrypt message
    const decryptMessage = (event: { data: Uint8Array, nonce: Uint8Array }): Payload<Events> => {
      const decrypted = nacl.box.open(
        event.data, 
        event.nonce, 
        pilotPublicKey, 
        towerPrivateKey
      );
      const message = new TextDecoder().decode(decrypted);
      return JSON.parse(message);
    };

    // encrypt message
    const encryptMessage = (data: object): string => {
      const message = JSON.stringify(data);
      const nonce = nacl.randomBytes(nacl.box.nonceLength);
      const encrypted = nacl.box(
        new TextEncoder().encode(message),
        nonce,
        pilotPublicKey,
        towerPrivateKey
      );
      return JSON.stringify({ data: Array.from(encrypted), nonce: Array.from(nonce) });
    }

    // ==================================================== TIMEOUT MANAGEMENT =
    
    // Clears all timers
    const clearTimers = () => {
      if (maxTimeoutId) clearTimeout(maxTimeoutId);
      if (inactivityTimeoutId) clearTimeout(inactivityTimeoutId);
    };

    // Set/Reset the inactivity timer
    const resetInactivityTimers = (ws: WebSocket) => {
      if (inactivityTimeoutId) clearTimeout(inactivityTimeoutId);
      inactivityTimeoutId = setTimeout(() => {
        try {
          console.log(`Tower: Connection closed due to ${INACTIVITY_TIMEOUT_MS / 1000}s of inactivity.`);
          ws.send(encryptMessage({ 
            type: Events.CLOSED, 
            message: `Connection closed due to ${INACTIVITY_TIMEOUT_MS / 1000}s of inactivity.` }));
          ws.close();
        } catch (e) {}
      }, INACTIVITY_TIMEOUT_MS);
    };

    // Set the maximum connection time timer
    const resetMaxConnectionTimer = (ws: WebSocket) => {
      if (maxTimeoutId) clearTimeout(maxTimeoutId);
      maxTimeoutId = setTimeout(() => {
        try { 
          console.log(`Tower: Connection closed due to ${MAX_CONNECTION_TIME_MS / 1000}s maximum connection time.`);
          ws.send(encryptMessage({
            type: Events.CLOSED,
            message: `Connection closed due to ${MAX_CONNECTION_TIME_MS / 1000}s maximum connection time.`
          }));
          ws.close(); 
        } catch (e) {}
      }, MAX_CONNECTION_TIME_MS);
    };

    // ============================================================== HANDLERS =

    // Handles the initial handshake and key exchange
    const handshakeMessage = async (event: { data: Uint8Array, nonce: Uint8Array }, ws: WebSocket) => {
      const secretBytes = new TextEncoder().encode(c.get('secretToken'));
      const secretKey = new Uint8Array(32);
      secretKey.set(secretBytes.slice(0, 32));
      
      const decrypted = nacl.secretbox.open(
        event.data,
        event.nonce,
        secretKey
      );
      if (!decrypted) throw new Error('Failed to decrypt handshake message');

      const data = JSON.parse(new TextDecoder().decode(decrypted))
      pilotPublicKey = new Uint8Array(data.pilotKey);

      const newKeyPair = nacl.box.keyPair();
      towerPublicKey = newKeyPair.publicKey;
      towerPrivateKey = newKeyPair.secretKey;
      sessionId = uuidv4();

      const responsePayload = JSON.stringify({ 
        towerKey: Array.from(towerPublicKey), 
        sessionId 
      });

      const responseNonce = nacl.randomBytes(nacl.box.nonceLength);
      const responseEncrypted = nacl.secretbox(
        new TextEncoder().encode(responsePayload), 
        responseNonce, 
        secretKey,
      );

      ws.send(JSON.stringify({ 
        data: Array.from(responseEncrypted), 
        nonce: Array.from(responseNonce)
      }));
      
      console.log(`New session started with ID: ${sessionId}`);
      
      await storageAdapter.upload(`${sessionId}/general`, JSON.stringify({ createAt: new Date().toISOString() }));
      resetInactivityTimers(ws);
    }

    // ============================================== WEBSOCKET EVENT HANDLERS =
    return {
      // Connection message handler
      async onMessage(event: MessageEvent, ws: WebSocket) {
        try {
          const message = JSON.parse(event.data);
          const payload = {
            data: new Uint8Array(message.data),
            nonce: new Uint8Array(message.nonce)
          }

          if (sessionId === null) {
            await handshakeMessage(payload, ws);
          } else {
            await dispatcher.dispatch(decryptMessage(payload), ws);
          }
          
          resetInactivityTimers(ws);    
        } catch (error) {
          console.error('Error processing message in SyncController:', error);
          
          if (sessionId === null) {
            ws.close(1008, 'Policy Violation: Handshake failed or unauthorized');
          }
        }
      },
      
      // Connection oppen handler
      onOpen(_evt: Event, ws: WebSocket) {
        console.log('Tower: Connection established with the Pilot.');
        resetMaxConnectionTimer(ws);
        resetInactivityTimers(ws);
      },

      // Connection closed handler
      async onClose(_event: CloseEvent, ws: WebSocket) {
        console.log('Tower: Connection closed.');
        clearTimers();
        await dispatcher.handleDisconnect();
      },
    };
  }
}
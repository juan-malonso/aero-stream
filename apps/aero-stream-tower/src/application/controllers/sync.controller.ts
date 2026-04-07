import { INACTIVITY_TIMEOUT_MS, MAX_CONNECTION_TIME_MS } from '@/constants';
import { 
  type AppContext,
  Events,
  type Payload,
  type StoragePort,
  VideoService,
  WebSocketDispatcherUseCase,
  type WsConnection } from '@/domain';
import { Logger } from '@/utils';

import nacl from 'tweetnacl';
import { v4 as uuidv4 } from 'uuid';
import { SessionController } from './session.controller';

export interface EncryptedPayload {
  data: Iterable<number>;
  nonce: Iterable<number>;
}

export class SyncController {
  private readonly logger = new Logger('SyncController');

  constructor(private readonly storageAdapter: StoragePort) {}

  handleWebSocket(c: AppContext) {
    // Initialize services
    const storageAdapter = this.storageAdapter;
    const videoService = new VideoService(storageAdapter);

    // Encryption keys for the current session
    let connected = false;
    let pilotPublicKey: Uint8Array | null = null;
    const sessionId: string = uuidv4();

    // Initialize dispatcher
    const sessionController = new SessionController(c);
    const dispatcher = new WebSocketDispatcherUseCase(videoService, {
      submitStep: (payload) => sessionController.submitStep(sessionId, payload),
      rejectStep: (payload) => sessionController.rejectStep(sessionId, payload),
      encryptMessage: (data) => encryptMessage(data)
    });

    const keyPair = nacl.box.keyPair();
    const towerPublicKey = keyPair.publicKey;
    const towerPrivateKey = keyPair.secretKey;

    // Timeouts timers
    let maxTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let inactivityTimeoutId: ReturnType<typeof setTimeout> | null = null;

    // ====================================================== HELPER FUNCTIONS =

    // decrypt message
    const decryptMessage = (event: { data: Uint8Array, nonce: Uint8Array }): Payload<Events> => {
      if (!pilotPublicKey) throw new Error('Pilot public key not found');
      const decrypted = nacl.box.open(
        event.data, 
        event.nonce, 
        pilotPublicKey, 
        towerPrivateKey
      );

      if (!decrypted) throw new Error('Failed to decrypt message');
      const message = new TextDecoder().decode(decrypted);

      return JSON.parse(message) as Payload<Events>;
    };

    // encrypt message
    const encryptMessage = (data: object): string => {
      if (!pilotPublicKey) throw new Error('Pilot public key not found');

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
    const resetInactivityTimers = (ws: WsConnection) => {
      if (inactivityTimeoutId) clearTimeout(inactivityTimeoutId);
      inactivityTimeoutId = setTimeout(() => {
        try {
          this.logger.info(`Connection closed due to inactivity`, { timeoutMs: INACTIVITY_TIMEOUT_MS });
          ws.send(encryptMessage({ 
              type: Events.closed, 
            message: `Connection closed due to ${String(INACTIVITY_TIMEOUT_MS / 1000)}s of inactivity.` }));
          ws.close();
          } catch (error: unknown) {
            this.logger.error('Error closing inactive WebSocket', { error: error instanceof Error ? error : new Error(String(error)) });
        }
      }, INACTIVITY_TIMEOUT_MS);
    };

    // Set the maximum connection time timer
    const resetMaxConnectionTimer = (ws: WsConnection) => {
      if (maxTimeoutId) clearTimeout(maxTimeoutId);
      maxTimeoutId = setTimeout(() => {
        try { 
          this.logger.info(`Connection closed due to maximum connection time`, { timeoutMs: MAX_CONNECTION_TIME_MS });
          ws.send(encryptMessage({
              type: Events.closed,
            message: `Connection closed due to ${String(MAX_CONNECTION_TIME_MS / 1000)}s maximum connection time.`
          }));
          ws.close(); 
          } catch (error: unknown) {
            this.logger.error('Error closing max duration WebSocket', { error: error instanceof Error ? error : new Error(String(error)) });
        }
      }, MAX_CONNECTION_TIME_MS);
    };

    // ============================================================== HANDLERS =

    // Handles the initial handshake and key exchange
    const handshakeMessage = async (event: { data: Uint8Array, nonce: Uint8Array }, ws: WsConnection) => {
      const secretBytes = new TextEncoder().encode(c.get('secretToken'));
      const secretKey = new Uint8Array(32);
      secretKey.set(secretBytes.slice(0, 32));
      
      const decrypted = nacl.secretbox.open(
        event.data,
        event.nonce,
        secretKey
      );
      if (!decrypted) throw new Error('Failed to decrypt handshake message');

      const data = JSON.parse(new TextDecoder().decode(decrypted)) as { pilotKey: Iterable<number> };
      pilotPublicKey = new Uint8Array(data.pilotKey);

      await videoService.initializeStream(sessionId);

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
      
      this.logger.info('New session started', { sessionId });
      
      await storageAdapter.upload(`${sessionId}/general`, JSON.stringify({ createAt: new Date().toISOString() }));

      // Fetch initial step
      const initData = await sessionController.init(sessionId);
      if (initData) {
        ws.send(encryptMessage({ type: Events.stepRender, data: initData as object }));
      }
    }

    // ============================================== WEBSOCKET EVENT HANDLERS =
    return {
      // Connection message handler
      onMessage: async (event: MessageEvent<unknown>, ws: WsConnection) => {
        try {
          const messageData = String(event.data);
          const message = JSON.parse(messageData) as EncryptedPayload;
          const payload = {
            data: new Uint8Array(message.data),
            nonce: new Uint8Array(message.nonce)
          }

          if (!connected) {
            connected = true;
            await handshakeMessage(payload, ws);
          } else {
            await dispatcher.dispatch(decryptMessage(payload), ws);
          }
             
        } catch (error: unknown) {
          this.logger.error('Error processing message', { error: String(error) });
          if (!connected) {
            ws.close(1008, 'Policy Violation: Handshake failed or unauthorized');
          }
        } finally {
          resetInactivityTimers(ws);
        }
      },
      
      // Connection oppen handler
      onOpen: (_evt: Event, ws: WsConnection) => {
        resetInactivityTimers(ws);
        resetMaxConnectionTimer(ws);
        this.logger.info('Connection established with the Pilot.');
      },

      // Connection closed handler
      onClose: (_event: CloseEvent) => {
        this.logger.info('Connection closed, executing safe cleanup.', { sessionId });
        clearTimers();
        
        if (connected) {
          c.executionCtx.waitUntil(
            dispatcher.handleDisconnect().catch((error: unknown) => {
              this.logger.error('Error during disconnect cleanup', { error: String(error) });
            })
          );
        }
      },
    };
  }
}
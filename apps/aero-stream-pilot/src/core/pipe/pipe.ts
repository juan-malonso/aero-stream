import { Logger } from '../../utils/logger.js';

import nacl from 'tweetnacl';

export interface AeroStreamPipeOptions {
    url: string;
    secret: string;
    workflowId: string;
    onMessage: (message: any) => void;
    onClose: () => void;
}

export class AeroStreamPipe {
    private logger = new Logger(AeroStreamPipe.name);

    // connection
    private url: URL;
    private workflowId: string;
    private _handler: (message: any) => void;
    private _close: () => void;

    // communication 
    public isConnected = false;
    private ws: WebSocket | null = null;
    private pilotKey: nacl.BoxKeyPair;
    private towerKey: Uint8Array | null = null;
    private secretKey: Uint8Array = new Uint8Array(32);

    constructor({ url, secret, workflowId, onMessage, onClose }: AeroStreamPipeOptions) {
        // connection url
        this.url = new URL(url);
        if (this.url.protocol === 'http:') this.url.protocol = 'ws:';
        if (this.url.protocol === 'https:') this.url.protocol = 'wss:';

        this.workflowId = workflowId;

        // connection params and handlers
        this.secretKey.set(new TextEncoder().encode(secret).slice(0, 32));
        this._handler = onMessage;
        this._close = onClose;

        // initialize pilot encryption keys
        this.pilotKey = nacl.box.keyPair();
    }

    // connect pipe
    public async connect(): Promise<boolean> {
        this.logger.debug(`Connecting to Aero-Stream Tower`, { url: this.url });

        return await new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(this.url.toString(), [this.workflowId]);
                
                // set listeners
                this.ws.addEventListener('open', () => { this._onOpen(); });
                this.ws.addEventListener('message', (event) => { this._onMessage(event.data, resolve); });
                this.ws.addEventListener('error', (error) => { this._onError(error, reject); });
                this.ws.addEventListener('close', () => { this._onClose(); });
            } catch (error) {
                this.logger.error('Failed to initialize WebSocket', { error });
                this.isConnected = false;
                reject(error);
            }
        });
    }

    private _onOpen() {
        const message = {
            pilotKey: Array.from(this.pilotKey.publicKey) 
        };

        const responseNonce = nacl.randomBytes(nacl.secretbox.nonceLength);
        const responseEncrypted = nacl.secretbox(
            new TextEncoder().encode(JSON.stringify(message)), 
            responseNonce, 
            this.secretKey
        );

        const payload = JSON.stringify({ 
            data: Array.from(responseEncrypted), 
            nonce: Array.from(responseNonce),
        });

        this.ws?.send(payload);
    }

    private _onMessage(data: any, resolve: (value: PromiseLike<boolean> | boolean) => void) {
        let payloadObj: any;

        try {
            payloadObj = JSON.parse(data);
        } catch (error) {
            this.logger.warn('Received non-JSON message', { data });
            return;
        }

        // Si no tiene data ni nonce, es un mensaje no encriptado (ej. Errores desde el backend)
        if (!payloadObj.data || !payloadObj.nonce) {
            this.logger.debug('Received unencrypted message', { payloadObj });
            try { this._handler(payloadObj); } catch (e) { this.logger.error('Error in handler', { e }); }
            return;
        }

        const payload = {
            data: new Uint8Array(payloadObj.data),
            nonce: new Uint8Array(payloadObj.nonce)
        };

        let decryptedMessage: any;

        try {
            if (this.isConnected) {
                decryptedMessage = decrypt(payload, this.towerKey, this.pilotKey.secretKey);
            } else {
                const decrypted = nacl.secretbox.open(
                    payload.data, 
                    payload.nonce, 
                    this.secretKey
                );
                if (!decrypted) throw new Error('Handshake decryption failed. Invalid secret key.');
                const message =  JSON.parse(new TextDecoder().decode(decrypted));
                this.towerKey = new Uint8Array(message.towerKey);
                decryptedMessage = { sessionId: message.sessionId };
                this.isConnected = true;
                resolve(true);
            }
        } catch(error) {
            this.logger.warn('Could not decrypt message, passing raw data.', { error, data });
            decryptedMessage = { error, raw: payloadObj };
        }

        // Se ejecuta el handler fuera del bloque de desencriptación
        if (decryptedMessage) {
            try {
                this._handler(decryptedMessage);
            } catch (error) {
                this.logger.error('Error executing message handler', { error });
            }
        }
    }

    private _onError(error: Event, reject: (reason?: any) => void) {
        this.logger.error('WebSocket connection failed. Check the DevTools Network tab for HTTP status codes (e.g., 403 Forbidden).');
        this.isConnected = false;
        reject(new Error('WebSocket connection failed'));
    }

    private _onClose() {
        this.logger.info('WebSocket connection closed');
        this.isConnected = false;
        this._close();
    }

    public send(data: object) {
        if (!this.isConnected || !this.ws) {
            this.logger.error('Cannot send message, not connected.');
            return;
        }
        const payload = encrypt(data, this.towerKey, this.pilotKey.secretKey);
        this.ws.send(payload);
    }

    public close() {
        if (this.ws) {
            this.ws.close();
        }
        this.isConnected = false;
    }
}


function encrypt(data: any, publicKey: any, secretKey: any) {
    const message = JSON.stringify(data);

    if (!publicKey) {
        throw new Error('Cannot encrypt message, tower key not available.');
    }

    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const encrypted = nacl.box(
        new TextEncoder().encode(message),
        nonce,
        publicKey,
        secretKey
    );

    return JSON.stringify({ data: Array.from(encrypted), nonce: Array.from(nonce) });
}

function decrypt(event: { data: Uint8Array, nonce: Uint8Array }, publicKey: any, secretKey: any) {
    const decrypted = nacl.box.open(
        event.data, 
        event.nonce, 
        publicKey, 
        secretKey
    );
    if (!decrypted) {
        throw new Error('Cannot decrypt message: nacl.box.open returned null.');
    }
    return JSON.parse(new TextDecoder().decode(decrypted));
}
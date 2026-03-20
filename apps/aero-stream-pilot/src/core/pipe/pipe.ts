import nacl from 'tweetnacl';
import { Logger } from '../../utils/logger.js';

export interface AeroStreamPipeOptions {
    url: string;
    secret: string;
    onMessage: (message: any) => void;
    onClose: () => void;
}

export class AeroStreamPipe {
    private logger = new Logger(AeroStreamPipe.name);

    // connection
    private url: string;
    private _handler: (message: any) => void;
    private _close: () => void;

    // communication 
    public isConnected: boolean = false;
    private ws: WebSocket | null = null;
    private pilotKey: nacl.BoxKeyPair;
    private towerKey: Uint8Array | null = null;
    private secretKey: Uint8Array = new Uint8Array(32);

    constructor({ url, secret, onMessage, onClose }: AeroStreamPipeOptions) {
        // connection values
        this.url = url;
        this.secretKey.set(new TextEncoder().encode(secret).slice(0, 32));
        this._handler = onMessage;
        this._close = onClose;

        // initialize pilot encryption keys
        this.pilotKey = nacl.box.keyPair();
    }

    // connect pipe
    public async connect(): Promise<boolean> {
        this.logger.debug(`Connecting to Aero-Stream Tower`, { url: this.url });

        return new Promise((resolve, reject) => {
            try {
                // create web socket
                const wsUrl = new URL(this.url);
                if (wsUrl.protocol === 'http:') wsUrl.protocol = 'ws:';
                if (wsUrl.protocol === 'https:') wsUrl.protocol = 'wss:';
                this.ws = new WebSocket(wsUrl.toString());
                
                // set listeners
                this.ws.addEventListener('open', () => this._onOpen());
                this.ws.addEventListener('message', (event) => this._onMessage(event, resolve));
                this.ws.addEventListener('error', (error) => this._onError(error, reject));
                this.ws.addEventListener('close', () => this._onClose());
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

    private _onMessage(data: any, resolve: (value: boolean | PromiseLike<boolean>) => void) {
        try {
            const message = JSON.parse(data);
            const payload = {
                data: new Uint8Array(message.data),
                nonce: new Uint8Array(message.nonce)
            }

            if (this.isConnected) {
                this._handler(decrypt(payload, this.towerKey, this.pilotKey.secretKey));
            } else {
                const decrypted = nacl.secretbox.open(
                    payload.data, 
                    payload.nonce, 
                    this.secretKey
                );
                const message =  JSON.parse(new TextDecoder().decode(decrypted));
                this.towerKey = new Uint8Array(message.towerKey);
                this._handler({ sessionId: message.sessionId })
                this.isConnected = true;
            }

            resolve(true);
        } catch(error) {
            this.logger.warn('Could not decrypt message, passing raw data.', { error, data });
            this._handler({ error });
        }
    }

    private _onError(error: Event, reject: (reason?: any) => void) {
        this.logger.error('WebSocket error', { error });
        this.isConnected = false;
        reject(error);
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

    return JSON.stringify({ payload: Array.from(encrypted), nonce: Array.from(nonce) });
}

function decrypt(event: { data: Uint8Array, nonce: Uint8Array }, publicKey: any, secretKey: any) {
    const decrypted = nacl.box.open(
        event.data, 
        event.nonce, 
        publicKey, 
        secretKey
    );
    return JSON.parse(new TextDecoder().decode(decrypted));
}
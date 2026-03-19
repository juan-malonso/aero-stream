import nacl from 'tweetnacl';
import { Logger } from '../../utils/logger.js';

export interface AeroStreamPipeOptions {
    url: string;
    onMessage: (message: any) => void;
}

export class AeroStreamPipe {
    private logger = new Logger(AeroStreamPipe.name);

    // connection
    private url: string;
    private handler: (message: any) => void;

    // comunication 
    public isConnected: boolean = false;
    public ws: WebSocket | null = null;
    private pilotKey: nacl.BoxKeyPair;
    private towerKey: Uint8Array | null = null;

    constructor({ url, onMessage }: AeroStreamPipeOptions) {
        // connection values
        this.url = url;
        this.handler = onMessage;

        // initialize pilot encryption keys
        this.pilotKey = nacl.box.keyPair();
    }

    // connect pipe
    public async connect(secret: string): Promise<boolean> {
        this.logger.debug(`Connecting to Aero-Stream Tower`, { url: this.url });

        return new Promise((resolve, reject) => {
            try {
                // create web socket
                const wsUrl = new URL(this.url);
                if (wsUrl.protocol === 'http:') wsUrl.protocol = 'ws:';
                if (wsUrl.protocol === 'https:') wsUrl.protocol = 'wss:';
                this.ws = new WebSocket(wsUrl.toString());
                
                // set listeners
                this.ws.addEventListener('open', () => this._onOpen(secret));
                this.ws.addEventListener('message', (event) => this._onMessage(event.data, resolve));
                this.ws.addEventListener('error', (error) => this._onError(error, reject));
                this.ws.addEventListener('close', () => this._onClose());
            } catch (error) {
                this.logger.error('Failed to initialize WebSocket', { error });
                this.isConnected = false;
                reject(error);
            }
        });
    }

    private _onOpen(secret: string) {
        const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
        const secretKey = new Uint8Array(32);
        secretKey.set(new TextEncoder().encode(secret).slice(0, 32));

        const message = JSON.stringify({ pilotKey: Array.from(this.pilotKey.publicKey) });
        const encrypted = nacl.secretbox(
            new TextEncoder().encode(message), 
            nonce, 
            secretKey
        );

        const payload = JSON.stringify({ 
            type: 'HANDSHAKE',
            payload: Array.from(encrypted), 
            nonce: Array.from(nonce),
            token: secret 
        });

        this.ws?.send(payload);
        this.logger.info('Performed handshake step 1');
    }

    private _onMessage(data: any, resolve: (value: boolean | PromiseLike<boolean>) => void) {
        try {
            if (this.isConnected) {
                this.handler(decrypt(data, this.towerKey, this.pilotKey.secretKey));
            } else {
                const parsed = JSON.parse(data);
                if (parsed.towerKey) {
                    this.towerKey = new Uint8Array(parsed.towerKey);
                }
                const message = decrypt(data, this.towerKey, this.pilotKey.secretKey);
                this.isConnected = true;
                this.handler({ sessionId: message.sessionId })
            }
            resolve(true);
        } catch(error) {
            this.logger.warn('Could not decrypt message, passing raw data.', { error });
            this.handler({ error });
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
    }

    public send(message: any) {
        if (!this.isConnected || !this.ws) {
            this.logger.error('Cannot send message, not connected.');
            return;
        }

        const payload = encrypt(message, this.towerKey, this.pilotKey.secretKey);
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

function decrypt(data: any, publicKey: any, secretKey: any) {
    const message = JSON.parse(data);

    if (!message.payload || !message.nonce || !publicKey) {
        throw new Error('Invalid encrypted message format');
    }
    
    const nonce = new Uint8Array(message.nonce);
    const decrypted = nacl.box.open(
        new Uint8Array(Object.values(message.payload)), 
        nonce, 
        publicKey, 
        secretKey
    );

    return JSON.parse(new TextDecoder().decode(decrypted));
}
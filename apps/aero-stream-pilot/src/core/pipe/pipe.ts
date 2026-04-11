import { Logger } from '../../utils/logger.js';

import initWasm, { SecurePipeCore } from 'aero-stream-pilot-core';

export interface AeroStreamPipeOptions {
    url: string;
    secret: string;
    workflowId: string;
    onMessage: (message: unknown) => void;
    onClose: () => void;
}

export class AeroStreamPipe {
    private logger = new Logger(AeroStreamPipe.name);

    private url: URL;
    private workflowId: string;
    private ws: WebSocket | null = null;
    public isConnected = false;

    private _handler: (message: unknown) => void;
    private _close: () => void;
    
    private cryptoCore: SecurePipeCore;
    private corePromise: Promise<SecurePipeCore>;


    constructor({ url, secret, workflowId, onMessage, onClose }: AeroStreamPipeOptions) {
        this.url = new URL(url);
        if (this.url.protocol === 'http:') this.url.protocol = 'ws:';
        if (this.url.protocol === 'https:') this.url.protocol = 'wss:';

        this.workflowId = workflowId;
        this._handler = onMessage;
        this._close = onClose;

        this.cryptoCore = {} as SecurePipeCore;
        this.corePromise = this.initCore(secret);
    }

    public async initCore(secret: string) {
        await initWasm();
        return new SecurePipeCore(secret);
    }

    public async connect(): Promise<boolean> {
        this.logger.debug(`Connecting to Aero-Stream Tower`, { url: this.url });
        
        this.cryptoCore = await this.corePromise;

        return await new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(this.url.toString(), [this.workflowId]);
                
                this.ws.addEventListener('open', () => { this._onOpen(); });
                this.ws.addEventListener('message', (event) => { this._onMessage(event.data, resolve); });
                this.ws.addEventListener('error', (error) => { this._onError(error, reject); });
                this.ws.addEventListener('close', () => { this._onClose(); });
            } catch (error) {
                this.logger.error('Failed to initialize WebSocket', { error: String(error) });
                this.isConnected = false;
                reject(error as Error);
            }
        });
    }

    private _onOpen() {
        if (!this.ws) {
            this.logger.error('Cannot send message, not connected.');
            return;
        }

        try {
            this.ws.send(this.cryptoCore.generate_handshake_request());
        } catch (error) {
            this.logger.error('Wasm handshake generation failed', { error });
        }
    }

    private _onMessage(data: unknown, resolve: (value: PromiseLike<boolean> | boolean) => void) {
        if (typeof data !== 'string') {
            this.logger.warn('Received non-string message, ignoring.', { data });
            return;
        }

        try {
            this._handler(this.cryptoCore.process_incoming_message(data));
            this.isConnected = this.cryptoCore.is_connected();
            resolve(true);
        } catch(error) {
            this.logger.warn('Could not decrypt message, passing raw data.', { error: String(error), data });
            this._handler({ error });
        }
    }

    private _onError(error: Event, reject: (reason?: Event) => void) {
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

        try {
            this.ws.send(this.cryptoCore.encrypt_outgoing_message(JSON.stringify(data)));
        } catch (error) {
            this.logger.error('Wasm encryption failed', { error });
        }
    }

    public close() {
        if (this.ws) {
            this.ws.close();
        }

        this.isConnected = false;
        this.cryptoCore.free();
    }
}
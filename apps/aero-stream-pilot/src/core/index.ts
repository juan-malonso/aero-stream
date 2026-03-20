import { Logger } from '../utils/logger.js';
import { AeroStreamPipe } from './pipe/pipe.js';

export interface AeroStreamPilotOptions {
    url: string;
    secret: string;
    onMessage?: (message: any) => void;
    onClose?: () => void;
}

export class AeroStreamPilot {
    private pipe: AeroStreamPipe;
    
    constructor({ 
        url, 
        secret, 
        onMessage = () => {}, 
        onClose = () => {},
    }: AeroStreamPilotOptions) {
        this.pipe = new AeroStreamPipe({
            url,
            secret,
            onMessage,
            onClose,
        });
    }

    async connect(): Promise<boolean> {
        return this.pipe.connect();
    }

    public sendMessage(data: object) {
        this.pipe.send(data);
    }

    public disconnect() {
        this.pipe.close();
    }

    public get isConnected(): boolean {
        return this.pipe.isConnected;
    }
}


import { Logger } from '../utils/logger.js';
import { AeroStreamPipe } from './pipe/pipe.js';

export interface AeroStreamPilotOptions {
  url: string;
}

export class AeroStreamPilot {
    private logger = new Logger(AeroStreamPilot.name);

    private pipe: AeroStreamPipe;

    public sessionId: string | null = null;
    
    constructor({ url }: AeroStreamPilotOptions) {
        this.pipe = new AeroStreamPipe({
            url,
            onMessage: this.handleMessage.bind(this),
        });
    }

    async connect(secret: string): Promise<boolean> {
        return this.pipe.connect(secret);
    }

    private handleMessage(message: any) {
        this.logger.debug('Received message:', message);
    }

    public sendMessage(message: any) {
        this.pipe.send(message);
    }

    disconnect() {
        this.pipe.close();
    }
    
    public get ws() {
        return this.pipe.ws;
    }

    public get isConnected(): boolean {
        return this.pipe.isConnected;
    }
}


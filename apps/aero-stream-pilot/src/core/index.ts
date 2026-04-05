import { Logger } from '../utils/logger.js';
import { AeroStreamPipe } from './pipe/pipe.js';
import { AeroStreamVideo } from './video/video.js';

export interface AeroStreamPilotOptions {
    url: string;
    secret: string;
    onMessage?: (message: any) => void;
    onClose?: () => void;
}

export class AeroStreamPilot {
    private pipe: AeroStreamPipe;
    private video: AeroStreamVideo;
    private videoChunkIndex: number = 0;
    
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
        this.video = new AeroStreamVideo(this.pipe);
    }

    async connect(options?: { videoStream?: MediaStream }): Promise<boolean> {
        const connected = await this.pipe.connect();
        if (connected) {

            // setup video stream if provided
            if ( options?.videoStream) {
                await this.video.start(options.videoStream);
            }
        }

        return connected;
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


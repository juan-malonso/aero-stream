import { AeroStreamPipe } from './pipe/pipe.js';
import { AeroStreamVideo } from './video/video.js';

export interface AeroStreamPilotOptions {
    url: string;
    secret: string;
    workflowId: string;
    onMessage?: (message: unknown) => void;
    onClose?: () => void;
}

export class AeroStreamPilot {
    private pipe: AeroStreamPipe;
    private video: AeroStreamVideo;
    
    constructor({ 
        url, 
        secret, 
        workflowId,
        onMessage = () => { /* noop */ }, 
        onClose = () => { /* noop */ },
    }: AeroStreamPilotOptions) {
        this.pipe = new AeroStreamPipe({
            url,
            secret,
            workflowId,
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
                this.video.start(options.videoStream);
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

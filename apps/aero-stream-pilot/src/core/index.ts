import { AeroStreamPipe } from './pipe/pipe.js';
import { AeroStreamVideo } from './video/video.js';


export interface AeroStreamPilotOptions {
    url: string;
    secret: string;
    workflowId: string;
    videoStream: MediaStream;
    onMessage?: (message: unknown) => void;
    onClose?: () => void;
}

export class AeroStreamPilot {
    readonly #pipe: AeroStreamPipe;
    readonly #video: AeroStreamVideo;
    
    constructor({ 
        url, 
        secret, 
        workflowId,
        videoStream,
        onMessage = () => { /* noop */ }, 
        onClose = () => { /* noop */ },
    }: AeroStreamPilotOptions) {
        this.#pipe = new AeroStreamPipe({
            url,
            secret,
            workflowId,
            onMessage,
            onClose,
        });

        this.#video = new AeroStreamVideo(this.#pipe, videoStream);
    }

    async connect(): Promise<boolean> {
        const connected = await this.#pipe.connect();
        if (connected) {
            this.#video.start();
        }

        return connected;
    }

    public send(data: object) {
        this.#pipe.send(data);
    }

    public disconnect() {
        this.#video.stop();
        this.#pipe.close();
    }

    public get isConnected(): boolean {
        return this.#pipe.isConnected;
    }

    public stream(): MediaStream {
        return this.#video.getLiveStream();
    }
}

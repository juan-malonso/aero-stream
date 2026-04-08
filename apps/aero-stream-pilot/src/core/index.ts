import { AeroStreamPipe } from './pipe/pipe.js';
import { AeroStreamVideo } from './video/video.js';
import { AeroStreamWorkflow, type StepLibrary } from './workflow/workflow.js';
import { type PipeMessages, PipeMessageType } from './model.js';

export { 
    StepComponent as AeroStreamComponent,
    StepLibrary as AeroStreamLibrary
} from './workflow/workflow.js';

export interface AeroStreamPilotOptions<TComponent = unknown> {
    url: string;
    secret: string;
    workflowId: string;
    videoStream: MediaStream;
    library: StepLibrary<TComponent>;
    renderer: (component: TComponent | null) => void;
    onMessage?: (message: unknown) => void;
    onClose?: () => void;
}

export class AeroStreamPilot<TComponent = unknown> {
    readonly #pipe: AeroStreamPipe;
    readonly #video: AeroStreamVideo;
    readonly #workflow: AeroStreamWorkflow<TComponent>;

    constructor({ 
        url, 
        secret, 
        workflowId,
        videoStream,
        library,
        renderer,
        onMessage = () => { /* noop */ }, 
        onClose = () => { /* noop */ },
    }: AeroStreamPilotOptions<TComponent>) {
        this.#pipe = new AeroStreamPipe({
            url,
            secret,
            workflowId,
            onMessage: (raw: unknown) => {
                const message = raw as PipeMessages;

                switch (message.type) {
                    case PipeMessageType.stepRender:
                        this.#workflow.stepRender(message);
                        onMessage(message);
                        break;
                    default:
                        onMessage(message);
                }
            },
            onClose,
        });

        this.#video = new AeroStreamVideo(this.#pipe, videoStream);
        this.#workflow = new AeroStreamWorkflow<TComponent>(this.#pipe, this.#video, library, renderer);
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

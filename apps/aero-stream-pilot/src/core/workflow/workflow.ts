import { Logger } from "../../utils/logger.js";
import { PipeMessageType, type StepRenderMessage } from "../model.js";
import type { AeroStreamPipe } from "../pipe/pipe.js";
import { AeroStreamVideo } from "../video/video.js";

export interface StepState {
    stepId: string;
    type: string;
    props: Record<string, unknown>;
}

export type StepSubmitFn = (data?: unknown) => void;
export type StepRejectFn = (data?: unknown) => void;

export interface StepComponentParams {
    data: unknown;
    stream: () => MediaStream;
    submit: StepSubmitFn;
    reject: StepRejectFn;
}

export type StepComponent<TComponent = unknown> = 
    (params: StepComponentParams) => TComponent;

export type StepLibrary<TComponent = unknown> = 
    Record<string, StepComponent<TComponent>>;

export class AeroStreamWorkflow<TComponent = unknown> {
    private logger = new Logger(AeroStreamWorkflow.name);
    
    readonly #pipe: AeroStreamPipe;
    readonly #video: AeroStreamVideo;

    public state: StepState | null = null;

    private library: StepLibrary<TComponent>;
    private renderer: (component: TComponent) => void;

    constructor(
        pipe: AeroStreamPipe, 
        video: AeroStreamVideo,
        library: StepLibrary<TComponent> = {},
        renderer: (component: TComponent) => void,
    ) {
        this.#pipe = pipe;
        this.#video = video;
        this.library = library;
        this.renderer = renderer;

        this.logger.debug('Library keys', { keys: Object.keys(this.library) });
    }

    public stepRender(message: StepRenderMessage) {
        this.state = {
            stepId: message.data.stepId,
            type: message.data.type,
            props: message.data.props,
        };
        
        if (!Object.hasOwn(this.library, this.state.type)) {
            console.error(`Component ${this.state.type} [${this.state.stepId}] not found in library`);
            return null;
        }

        const renderFn = this.library[this.state.type];

        this.renderer(
            renderFn({
                data: this.state.props,
                stream: () => this.#video.getLiveStream(),
                submit: (data) => { this.commit(PipeMessageType.stepSubmit, data); },
                reject: (data) => { this.commit(PipeMessageType.stepReject, data); }
            })
        );
    }

    public commit(type: string, data?: unknown) {
        this.#pipe.send({ type, data });
    }
}

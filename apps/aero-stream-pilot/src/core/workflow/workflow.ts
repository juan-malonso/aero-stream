import { Logger } from "../../utils/logger.js";
import { PipeMessageType, type StepRenderMessage } from "../model.js";
import type { AeroStreamPipe } from "../pipe/pipe.js";

export interface StepState {
    stepId: string;
    name: string;
    props: Record<string, unknown>;
}

export type StepSubmitFn = (data?: unknown) => void;
export type StepRejectFn = (data?: unknown) => void;

export type StepComponent<TComponent = unknown> = 
    (config: unknown, submit: StepSubmitFn, reject: StepRejectFn) => TComponent;

export type StepLibrary<TComponent = unknown> = 
    Record<string, StepComponent<TComponent>>;

export class AeroStreamWorkflow<TComponent = unknown> {
    private logger = new Logger(AeroStreamWorkflow.name);
    
    private pipe: AeroStreamPipe;

    public state: StepState | null = null;

    private library: StepLibrary<TComponent>;
    private renderer: (component: TComponent) => void;

    constructor(
        pipe: AeroStreamPipe, 
        library: StepLibrary<TComponent> = {},
        renderer: (component: TComponent) => void
    ) {
        this.pipe = pipe;
        this.library = library;
        this.renderer = renderer;

        this.logger.debug('Library keys', { keys: Object.keys(this.library) });
    }

    public stepRender(message: StepRenderMessage) {
        this.state = {
            stepId: message.data.stepId,
            name: message.data.componentName,
            props: message.data.props,
        };
        
        if (!Object.hasOwn(this.library, this.state.stepId)) {
            console.error(`Component ${this.state.name} [${this.state.stepId}] not found in library`);
            return null;
        }

        const renderFn = this.library[this.state.stepId];

        this.renderer(
            renderFn(
                this.state.props,
                (data) => { this.commit(PipeMessageType.stepSubmit, data); },
                (data) => { this.commit(PipeMessageType.stepReject, data); }
            )
        );
    }

    public commit(type: string, data?: unknown) {
        this.pipe.send({ type, data });
    }
}


interface PipeMessage<Type extends string = string, Data = unknown> {
   type: Type;
   data: Data;
}

export enum PipeMessageType {
  stepReject = 'STEP_REJECT',
  stepRender = 'STEP_RENDER',
  stepSubmit = 'STEP_SUBMIT',
  videoEmit = 'VIDEO',
}

// ============================================================ PIPE MESSAGES ==

// -- STEP_REJECT --------------------------------------------------------------

export type StepRejectMessage = PipeMessage<PipeMessageType.stepReject, object>;

// -- STEP_RENDER --------------------------------------------------------------

export type StepRenderMessage = PipeMessage<PipeMessageType.stepRender, {
  stepId: string;
  componentName: string;
  props: Record<string, unknown>;
}>;

// -- STEP_SUBMIT --------------------------------------------------------------

export type StepSubmitMessage = PipeMessage<PipeMessageType.stepSubmit, object>;

// =============================================================================

export type PipeMessages = StepRejectMessage | StepRenderMessage | StepSubmitMessage;
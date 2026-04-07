export enum Events {
  // Connection events
  handshake = 'HANDSHAKE',
  closed = 'CLOSED',

  // Stream events
  video = 'VIDEO',

  // Metric events
  metric = 'METRIC',

  // Step events
  stepSubmit = 'STEP_SUBMIT',
  stepRender = 'STEP_RENDER',
  stepReject = 'STEP_REJECT',
}

export interface Payload<T extends Events> {
  type: T;
  [key: string]: unknown;
}

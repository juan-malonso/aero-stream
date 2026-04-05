export enum Events {
  // Connection events
  handshake = 'HANDSHAKE',
  closed = 'CLOSED',

  // Stream events
  video = 'VIDEO',

  // Metric events
  metric = 'METRIC',
}

export interface Payload<T extends Events> {
  type: T;
  [key: string]: unknown;
}

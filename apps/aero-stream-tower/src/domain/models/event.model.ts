export enum Events {
  // Connection events
  HANDSHAKE = 'HANDSHAKE',
  CLOSED = 'CLOSED',

  // Stream events
  VIDEO_START = 'VIDEO_START',
  VIDEO_END = 'VIDEO_END',

  // Sync events
  TELEMETRY = 'TELEMETRY',
}

export type Payload<T extends Events> = {
  event: T;
  [any: string]: any;
} 

import { VideoService } from '../services';

export interface VideoStartMessage {
  type: 'VIDEO_START';
  fileName: string;
  mimeType: string;
}

export interface VideoEndMessage {
  type: 'VIDEO_END';
}

export interface FlightSyncMessage {
  type: 'FLIGHT_SYNC';
  payload: any;
}

export interface TelemetryMessage {
  type: 'TELEMETRY';
  payload?: any;
}

export type WebSocketStringMessage = VideoStartMessage | VideoEndMessage | FlightSyncMessage | TelemetryMessage;

export class WebSocketDispatcherUseCase {
  constructor(private readonly videoService: VideoService) {}

  async dispatch(event: MessageEvent, ws: WebSocket): Promise<void> {
    try {
      if (typeof event.data === 'string') {
        const message = JSON.parse(event.data) as WebSocketStringMessage;
        await this.handleJsonMessage(message, ws);
      } else if (event.data instanceof ArrayBuffer) {
        await this.handleBinaryMessage(event.data, ws);
      }
    } catch (error) {
      console.error('Dispatcher error:', error);
      ws.send(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }));
    }
  }

  private async handleJsonMessage(message: WebSocketStringMessage, ws: WebSocket) {
    switch (message.type) {
      case 'VIDEO_START':
        const uploadId = await this.videoService.startUpload(message.fileName, message.mimeType);
        ws.send(JSON.stringify({ type: 'UPLOAD_STARTED', uploadId }));
        break;
      case 'VIDEO_END':
        const key = await this.videoService.completeUpload();
        ws.send(JSON.stringify({ type: 'UPLOAD_COMPLETED', key }));
        break;
      case 'FLIGHT_SYNC':
        console.log('Routing to Flight Service:', message.payload);
        // await this.flightService.syncState(message.payload);
        break;
      case 'TELEMETRY':
        console.log('Routing to Telemetry Service:', message.payload);
        // await this.telemetryService.record(message.payload);
        break;
      default:
        console.warn('Unknown message type received', message);
    }
  }

  private async handleBinaryMessage(data: ArrayBuffer, ws: WebSocket) {
    // Si planeas recibir otros streams binarios (ej. audio), deberías usar el primer
    // byte de 'data' como un "opcode" para saber a qué servicio despachar el ArrayBuffer.
    if (this.videoService.isUploading) {
      const dataView = new DataView(data);
      const partNumber = dataView.getUint32(0, true);
      const chunkData = data.slice(4);
      
      await this.videoService.processChunk(partNumber, chunkData);
      ws.send(JSON.stringify({ type: 'CHUNK_UPLOADED', partNumber }));
    } else {
      ws.send(JSON.stringify({ error: 'Unexpected binary payload.' }));
    }
  }

  async handleDisconnect(): Promise<void> {
    console.log('Dispatcher: WebSocket disconnected, cleaning up...');
    await this.videoService.abortUpload();
  }
}
import { Events, Payload } from '../models';
import { VideoService } from '../services';

export class WebSocketDispatcherUseCase {
  constructor(private readonly videoService: VideoService) {}

  async dispatch(event: Payload<Events>, ws: WebSocket): Promise<void> {
    try {
      await this.handleMessage(event, ws);

    } catch (error) {
      console.error('Dispatcher error:', error);
      ws.send(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }));
    }
  }

  private async handleMessage(message: Payload<Events>, ws: WebSocket) {
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
    // If you plan to receive other binary streams (e.g., audio), you should use the first
    // byte of 'data' as an "opcode" to know which service to dispatch the ArrayBuffer to.
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
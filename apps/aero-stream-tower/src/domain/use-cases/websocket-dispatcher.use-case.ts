import { Logger } from '@/utils';

import { Events, type Payload, type WsConnection } from '../models';
import type { VideoService } from '../services';

export class WebSocketDispatcherUseCase {
  private readonly logger = new Logger('WebSocketDispatcherUseCase');

  constructor(
    private readonly videoService: VideoService,
  ) {}

  async dispatch(event: Payload<Events>, ws: WsConnection): Promise<void> {
    try {
      await this.handleMessage(event, ws);
    } catch (error) {
      this.logger.error('Dispatcher error', { error: String(error) });
      ws.send(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }));
    }
  }

  private async handleMessage(message: Payload<Events>, _ws: WsConnection) {
    switch (message.type) {
      case Events.video: {
        const buffer = Buffer.from(String(message.chunk), 'base64');
        const dataView = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
        
        const partNumber = dataView.getUint32(0, true) + 1;
        const chunkData = new Uint8Array(buffer.buffer, buffer.byteOffset + 4, buffer.byteLength - 4); 
        await this.videoService.uploadPart(partNumber, chunkData);
        break;
      }

      case Events.metric: {
        this.logger.debug('Routing to Metric', { payload: message.payload });
        break;
      }

      default:
        this.logger.warn('Unknown message type received', { message });
    }
  }

  async handleDisconnect(): Promise<void> {
    this.logger.info('WebSocket disconnected, cleaning up...');
    await Promise.all([
      this.videoService.finishUpload(),
    ]);
  }
}
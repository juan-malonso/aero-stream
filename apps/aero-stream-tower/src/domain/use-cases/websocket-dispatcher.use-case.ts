import { Logger } from '@/utils';

import { Events, type Payload, type WsConnection } from '../models';
import type { VideoService } from '../services';

export interface StateMachineContext {
  submitStep: (payload: unknown) => Promise<unknown>;
  rejectStep: (payload: unknown) => Promise<unknown>;
  encryptMessage: (data: object) => string;
}

export class WebSocketDispatcherUseCase {
  private readonly logger = new Logger('WebSocketDispatcherUseCase');

  constructor(
    private readonly videoService: VideoService,
    private readonly smContext: StateMachineContext,
  ) {}

  async dispatch(event: Payload<Events>, ws: WsConnection): Promise<void> {
    try {
      await this.handleMessage(event, ws);
    } catch (error) {
      this.logger.error('Dispatcher error', { error: String(error) });
      ws.send(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }));
    }
  }

  private async handleMessage(message: Payload<Events>, ws: WsConnection) {
    switch (message.type) {
      case Events.stepSubmit:{
        const smResponse = await this.smContext.submitStep(message);
        if (smResponse) {
          ws.send(this.smContext.encryptMessage({ type: (Events as any).step_render || 'STEP_RENDER', data: smResponse as object }));
        }
        break;
      }

      case Events.stepReject: {
        await this.smContext.rejectStep(message);
        this.logger.info('Flow rejected by user, closing connection');
        ws.close(1000, 'Flow ended or rejected');
        break;
      }

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
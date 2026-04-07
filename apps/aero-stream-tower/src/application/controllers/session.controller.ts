import type { AppContext } from '@/domain';
import { Logger } from '@/utils';

export class SessionController {
  private readonly logger = new Logger('SessionController');

  constructor(private readonly c: AppContext) {}

  private getStub(sessionId: string) {
    const id = this.c.env.STATE_MACHINE.idFromName(sessionId);
    return this.c.env.STATE_MACHINE.get(id);
  }

  async init(sessionId: string) {
    try {
      // Cloudflare RPC direct call
      const stub = this.getStub(sessionId) as any;
      return await stub.init();
    } catch (error) {
      this.logger.error('Error during state machine initialization', { error: String(error) });
      return null;
    }
  }

  async submitStep(sessionId: string, payload: unknown) {
    try {
      const stub = this.getStub(sessionId) as any;
      return await stub.submitStep(payload);
    } catch (error) {
      this.logger.error('Error submitting step to state machine', { error: String(error) });
      return null;
    }
  }

  async rejectStep(sessionId: string, payload: unknown) {
    try {
      const stub = this.getStub(sessionId) as any;
      return await stub.rejectStep(payload);
    } catch (error) {
      this.logger.error('Error rejecting step in state machine', { error: String(error) });
      return null;
    }
  }
}
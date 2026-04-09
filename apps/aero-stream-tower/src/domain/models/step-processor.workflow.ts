import { Logger } from '@/utils';
import { WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from 'cloudflare:workers';

export class StepProcessorWorkflow extends WorkflowEntrypoint {
  readonly logger = new Logger(StepProcessorWorkflow.name);

  async run(event: WorkflowEvent<any>, step: WorkflowStep) {
    const payload = event.payload;

    this.logger.debug('Received workflow event', { event, payload });

    await step.do('log-init', async () => {
      this.logger.info(`Starting workflow for step ${payload.stepId} with action ${payload.action}`);
    });

    const result = await step.do('process-action', async () => {
      // e.g., third-party API call, complex validation, etc.
      return { success: true, processedData: payload.data };
    });

    await step.do('finalize', async () => {
      this.logger.info('Workflow finalized', result);
    });

    return result;
  }
}

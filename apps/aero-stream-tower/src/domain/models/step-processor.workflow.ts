import { WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from 'cloudflare:workers';

export class StepProcessorWorkflow extends WorkflowEntrypoint {
  async run(event: WorkflowEvent<any>, step: WorkflowStep) {
    const payload = event.payload;

    await step.do('log-init', async () => {
      console.log(`Starting workflow for step ${payload.stepId} with action ${payload.action}`);
    });

    // Simulate some heavy processing
    const result = await step.do('process-action', async () => {
      // e.g., third-party API call, complex validation, etc.
      return { success: true, processedData: payload.data };
    });

    await step.do('finalize', async () => {
      console.log('Workflow finalized', result);
    });

    return result;
  }
}

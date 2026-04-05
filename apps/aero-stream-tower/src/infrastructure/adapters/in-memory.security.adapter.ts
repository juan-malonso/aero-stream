import type { WorkflowContext, WorkflowPort } from '@/domain';
import { Logger } from '@/utils';

export class InMemoryWorkflowAdapter implements WorkflowPort  {
  private readonly logger = new Logger(InMemoryWorkflowAdapter.name);
  private readonly dictionary: Map<string, WorkflowContext>;

  constructor(config: Record<string, WorkflowContext>) {
    this.dictionary = new Map(Object.entries(config));
    this.logger.info('Initialized with workflows', { count: this.dictionary.size });
  }

  getWorkflow(workflowId: string): Promise<WorkflowContext | null> {
    const context = this.dictionary.get(workflowId) ?? null;
    this.logger.debug('Fetching workflow', { workflowId, found: !!context });
    return Promise.resolve(context);
  }
}

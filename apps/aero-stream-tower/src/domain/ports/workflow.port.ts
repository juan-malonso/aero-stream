
export interface WorkflowContext {
  connection: {
    encription: {
      symetric: string;
    };
    origins: string[];
  };
}

export interface WorkflowPort {
  getWorkflow(workflowId: string): Promise<WorkflowContext | null>;
}
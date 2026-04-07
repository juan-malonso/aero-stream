import { DurableObject } from 'cloudflare:workers';

export interface Env {
  STATE_MACHINE: DurableObjectNamespace;
  DB: D1Database;
  STEP_PROCESSOR: any;
}

interface WorkflowStepRow {
  step_id: string;
  component_name: string;
  base_props: string; // JSON string
  transition_logic: string; // JSON string
  trigger_workflow_name: string | null;
}

export class StateMachineInstance extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  async init() {
    let stepId = await this.ctx.storage.get<string>('stepId');
    
    if (!stepId) {
      const startRow = await this.env.DB.prepare(
        'SELECT * FROM workflow_steps WHERE step_id = ?'
      ).bind('StartComponent').first<WorkflowStepRow>();
      
      if (startRow) {
        const transitionLogic = JSON.parse(startRow.transition_logic);
        stepId = transitionLogic['NEXT'] || 'StartComponent';
        await this.ctx.storage.put('stepId', stepId);
      } else {
        stepId = 'StartComponent';
      }
    }
    
    const stepRow = await this.env.DB.prepare(
      'SELECT * FROM workflow_steps WHERE step_id = ?'
    ).bind(stepId).first<WorkflowStepRow>();
    
    return { 
      stepId,
      componentName: stepRow?.component_name || 'Unknown',
      props: stepRow ? JSON.parse(stepRow.base_props) : {}
    };
  }

  async submitStep(payload: any) {
    const body = payload as { action: string, data?: any };
    
    const stepId = await this.ctx.storage.get<string>('stepId');
    if (!stepId) throw new Error('State machine not initialized');
    
    const stepRow = await this.env.DB.prepare(
      'SELECT * FROM workflow_steps WHERE step_id = ?'
    ).bind(stepId).first<WorkflowStepRow>();
    
    if (!stepRow) throw new Error('Step not found');
    
    const transitionLogic = JSON.parse(stepRow.transition_logic);
    const nextStepId = transitionLogic[body.action];
    
    if (!nextStepId) throw new Error('Invalid action');

    if (stepRow.trigger_workflow_name) {
      await this.env.STEP_PROCESSOR.create({
        id: `${stepId}-${Date.now()}`,
        params: { stepId: stepId, action: body.action, data: body.data }
      });
    }
    
    await this.ctx.storage.put('stepId', nextStepId);
    
    const nextStepRow = await this.env.DB.prepare(
      'SELECT * FROM workflow_steps WHERE step_id = ?'
    ).bind(nextStepId).first<WorkflowStepRow>();
    
    return { 
      stepId: nextStepId,
      componentName: nextStepRow?.component_name || 'Unknown',
      props: nextStepRow ? JSON.parse(nextStepRow.base_props) : {}
    };
  }

  async rejectStep(_payload: any) {
    await this.ctx.storage.delete('stepId');
    return { success: true };
  }
}

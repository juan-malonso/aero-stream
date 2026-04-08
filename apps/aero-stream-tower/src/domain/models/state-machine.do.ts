import { DurableObject } from 'cloudflare:workers';

export interface Env {
  STATE_MACHINE: DurableObjectNamespace;
  DB: D1Database;
  STEP_PROCESSOR: any;
}

interface WorkflowRow {
  id: string;
  name: string;
  version: number;
  steps: string; // JSON string
}

export class StateMachineInstance extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  async init() {
    let workflow = await this.ctx.storage.get<any>('workflow');
    
    if (!workflow) {
      const workflowRow = await this.env.DB.prepare(
        'SELECT * FROM workflows WHERE id = ? ORDER BY version DESC LIMIT 1'
      ).bind('default-workflow-id').first<WorkflowRow>();
      
      if (!workflowRow) {
        throw new Error('Workflow not found in database');
      }

      workflow = {
        id: workflowRow.id,
        name: workflowRow.name,
        version: workflowRow.version,
        steps: JSON.parse(workflowRow.steps)
      };
      
      await this.ctx.storage.put('workflow', workflow);
    }

    let stepId = await this.ctx.storage.get<string>('stepId');

    if (!stepId) {
      // Find the step defined as type: 'Start'
      const steps = workflow.steps;
      const startStepId = Object.keys(steps).find(key => steps[key].type === 'Start');
      
      if (!startStepId) {
        throw new Error('No Start type step found in workflow');
      }
      
      const startDef = steps[startStepId];
      const transitionLogic = startDef.transition || {};
      stepId = transitionLogic['NEXT'] || startStepId;
      await this.ctx.storage.put('stepId', stepId);
    }
    
    const stepDef = workflow.steps[stepId as string];
    
    return { 
      stepId: stepId as string,
      componentName: stepDef?.name || 'Unknown',
      props: stepDef?.props || {}
    };
  }

  async submitStep(payload: any) {
    const data = payload;
    
    const workflow = await this.ctx.storage.get<any>('workflow');
    const stepId = await this.ctx.storage.get<string>('stepId');
    
    if (!workflow || !stepId) throw new Error('State machine not initialized');
    
    const stepDef = workflow.steps[stepId];
    if (!stepDef) throw new Error('Step not found in workflow definition');
    
    const transitionLogic = stepDef.transition || {};
    const availableActions = Object.keys(transitionLogic);

    if (workflow.id) { // trigger_workflow_name is now abstracted, assuming we just pass it to processor
      await this.env.STEP_PROCESSOR.create({
        id: `${stepId}-${Date.now()}`,
        params: { stepId: stepId, action: availableActions[0] || 'FINISH', data: data }
      });
    }

    if (availableActions.length === 0) {
      await this.ctx.storage.deleteAll();
      return { finished: true };
    }

    // Automatically pick the first available action for transition
    const action = availableActions[0];
    const nextStepId = transitionLogic[action];

    await this.ctx.storage.put('stepId', nextStepId);
    
    const nextStepDef = workflow.steps[nextStepId];
    
    return { 
      stepId: nextStepId,
      componentName: nextStepDef?.name || 'Unknown',
      props: nextStepDef?.props || {}
    };
  }

  async rejectStep(_payload: any) {
    await this.ctx.storage.deleteAll();
    return { success: true };
  }
}
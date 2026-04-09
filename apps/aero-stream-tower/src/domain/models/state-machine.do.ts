import { DurableObject } from 'cloudflare:workers';
import dlv from 'dlv';
import jsonLogic from 'json-logic-js';

export interface Env {
  STATE_MACHINE: DurableObjectNamespace;
  DB: D1Database;
  STEP_PROCESSOR: any;
}

interface WorkflowRow {
  id: string;
  name: string;
  version: number;
  start: string;
  steps: string;
  globals: string;
}

enum ExecutionMode {
  FRONT = 'FRONT',
  BACK = 'BACK'
}

interface StepDefinition {
  execution: {
    mode: ExecutionMode;
    type: string;
  };
  name: string;
  config: Record<string, unknown>;
  transitions: Array<{
    condition: any;
    next: string;
  }>;
}

function hydrateConfig(config: any, state: any): any {
  if (typeof config === 'string') {
    return config.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
      const value = dlv(state, path.trim(), '');
      return value;
    });
  }

  if (Array.isArray(config)) {
    return config.map(item => hydrateConfig(item, state));
  }

  if (config !== null && typeof config === 'object') {
    const hydratedObj: any = {};

    for (const key in config) {
      hydratedObj[key] = hydrateConfig(config[key], state);
    }

    return hydratedObj;
  }

  return config;
}

export class StateMachineInstance extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  async init() {
    let workflow = await this.ctx.storage.get<WorkflowRow>('workflow');
    let stepSession = await this.ctx.storage.get<any>('stepSession') || {};
    
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
        start: workflowRow.start,
        steps: JSON.parse(workflowRow.steps),
        globals: workflowRow.globals ? JSON.parse(workflowRow.globals) : {}
      };
      
      await this.ctx.storage.put('workflow', workflow);
    }

    let stepId = await this.ctx.storage.get<string>('stepId');

    if (!stepId) {
      stepId = workflow.start;
      if (!workflow.steps[stepId]) {
        throw new Error('Start step not found in workflow');
      }
      await this.ctx.storage.put('stepId', stepId);
    }
    
    const step: StepDefinition = workflow.steps[stepId];

    const hydrationState = {
      steps: stepSession,
      globals: workflow.globals,
      env: this.env
    };

    return { 
      stepId: stepId as string,
      type: step.execution.type,
      props: hydrateConfig(step.config, hydrationState)
    };
  }

  async submitStep(payload: any) {
    const workflow = await this.ctx.storage.get<any>('workflow');
    const stepId = await this.ctx.storage.get<string>('stepId');
    
    if (!workflow || !stepId) throw new Error('State machine not initialized');

    const hydrationState = {
      steps: await this.ctx.storage.get<any>('stepSession') || {},
      globals: workflow.globals,
      env: this.env
    };
    
    const stepDef = workflow.steps[stepId];
    if (!stepDef) throw new Error('Step not found in workflow definition');
    
    hydrationState.steps[stepId] = payload;
    await this.ctx.storage.put('stepSession', hydrationState.steps);

    const transitions = stepDef.transitions || [];

    if (workflow.id) {
      await this.env.STEP_PROCESSOR.create({
        id: `${stepId}-${Date.now()}`,
        params: { stepId: stepId, action: 'SUBMIT', data: payload }
      });
    }

    if (transitions.length === 0) {
      await this.ctx.storage.deleteAll();
      return { finished: true };
    }

    for (const transition of transitions) {
      if (jsonLogic.apply(transition.condition, hydrationState)) {
        const nextStepId = transition.next;
        const nextStep: StepDefinition = workflow.steps[nextStepId];

        await this.ctx.storage.put('stepId', nextStepId);
        
        return { 
          stepId: nextStepId,
          type: nextStep.execution.type,
          props: hydrateConfig(nextStep.config, hydrationState)
        };
      }
    }

    throw new Error('No valid transition found for the current step');
  }

  async rejectStep(_payload: any) {
    await this.ctx.storage.deleteAll();
    return { success: true };
  }
}
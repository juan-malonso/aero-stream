import { AeroStreamPilot } from '../src/index.js';

import { beforeEach,describe, expect, it } from 'vitest';

describe('AeroStreamPilot', () => {
  let pilot: AeroStreamPilot;
  const mockUrl = 'ws://localhost:8787';
  const mockSecret = 'super-secret-key';
  const mockWorkflowId = 'workflow-123';

  beforeEach(() => {
    pilot = new AeroStreamPilot({ 
        url: mockUrl, 
        secret: mockSecret, 
        workflowId: mockWorkflowId
    });
  });

  it('should initialize with isConnected as false', () => {
    expect(pilot.isConnected).toBe(false);
  });

  it('should set isConnected to false when disconnect is called', () => {
    pilot.disconnect();
    expect(pilot.isConnected).toBe(false);
  });
});

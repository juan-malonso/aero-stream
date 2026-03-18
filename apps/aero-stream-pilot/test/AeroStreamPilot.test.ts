import { describe, it, expect, beforeEach } from 'vitest';
import { AeroStreamPilot } from '../src/index';

describe('AeroStreamPilot', () => {
  let pilot: AeroStreamPilot;
  const mockUrl = 'ws://localhost:8787';

  beforeEach(() => {
    pilot = new AeroStreamPilot({ url: mockUrl });
  });

  it('should initialize with isConnected as false', () => {
    expect(pilot.isConnected).toBe(false);
  });

  it('should have a null sessionId on initialization', () => {
    expect(pilot.getSessionId()).toBe(null);
  });

  it('should have a null ws connection on initialization', () => {
    expect(pilot.ws).toBe(null);
  });

  it('should set isConnected to false when disconnect is called', () => {
    pilot.disconnect();
    expect(pilot.isConnected).toBe(false);
  });
});

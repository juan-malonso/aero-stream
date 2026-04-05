'use client';

import { AeroStreamPilot } from 'aero-stream-pilot';
import { useEffect, useRef, useState } from 'react';

const token = 'my-super-secret-token';
const workflowId = 'default-workflow-id';
const socketUrl = 'ws://localhost:8787/app/sync';

enum ConnectionStatus {
  Disconnected = 'Disconnected',
  Connecting = 'Connecting...',
  Connected = 'Connected',
  ConnectionError = 'Connection Error',
}

interface PilotConnectionProps {
  onSessionId: (id: string | null) => void;
  onStatusChange: (status: string) => void;
  onTimeTick: () => void;
  onTimeReset: () => void;
}

export function PilotConnection({ onSessionId, onStatusChange, onTimeTick, onTimeReset }: PilotConnectionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.Disconnected);

  useEffect(() => {
    onStatusChange(status);
  }, [status, onStatusChange]);

  // Pilot reference
  const pilotRef = useRef<AeroStreamPilot | null>(null);

  const handleConnect = async () => {
    try {
      setStatus(ConnectionStatus.Connecting);
      onSessionId(null);

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

      pilotRef.current = new AeroStreamPilot({ 
        url: socketUrl, 
        secret: token,
        workflowId,
        videoStream: stream,
        onMessage: (message: unknown) => {
          const msgSessionId = (message as { sessionId?: string }).sessionId;
          if (msgSessionId) {
            onSessionId(msgSessionId);
          }
        },
        onClose: () => {
          handleDisconnect();
        },
      });
      
      await pilotRef.current.connect();

      if (videoRef.current) {
        videoRef.current.srcObject = pilotRef.current.getLiveStream();
      }

      if (pilotRef?.current.isConnected) {
        setStatus(ConnectionStatus.Connected);

        onTimeReset();
        timerRef.current = setInterval(() => { onTimeTick(); }, 1000);
      }
    } catch (error: unknown) {
      setStatus(ConnectionStatus.ConnectionError);
      console.error('Connection error:', error);
    }
  };

  const handleDisconnect = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (pilotRef.current?.isConnected) {
        pilotRef.current.disconnect();
        pilotRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus(ConnectionStatus.Disconnected);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (pilotRef.current?.isConnected) {
        pilotRef.current.disconnect();
      }
    };
  }, []);

  return (
    <div style={{ marginTop: 20 }}>
      <h3 style={{ marginTop: 0 }}>Camera Capture:</h3>
      <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', background: '#000', borderRadius: '8px' }} />
      <div style={{ display: 'flex', gap: '10px', marginTop: 15 }}>
        <button onClick={() => { void handleConnect(); }} disabled={status === 'Connected' || status === 'Connecting...'} style={{ padding: '8px 16px', cursor: 'pointer', flex: 1 }}>Connect</button>
        <button onClick={handleDisconnect} disabled={status !== 'Connected'} style={{ padding: '8px 16px', cursor: 'pointer', flex: 1 }}>Disconnect</button>
      </div>
    </div>
  );
}
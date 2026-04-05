'use client';

import { AeroStreamPilot } from 'aero-stream-pilot';
import { useEffect, useRef, useState } from 'react';

const token = 'my-super-secret-token';
const workflowId = 'default-workflow-id';
const socketUrl = 'ws://localhost:8787/app/sync';

interface PilotConnectionProps {
  onSessionId: (id: string | null) => void;
  onStatusChange: (status: string) => void;
  onTimeTick: () => void;
  onTimeReset: () => void;
}

export function PilotConnection({ onSessionId, onStatusChange, onTimeTick, onTimeReset }: PilotConnectionProps) {
  const pilotRef = useRef<AeroStreamPilot | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [status, setStatus] = useState('Disconnected');

  useEffect(() => {
    onStatusChange(status);
  }, [status, onStatusChange]);

  const handleConnect = async () => {
    try {
      setStatus('Connecting...');
      onSessionId(null);

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const pilot = new AeroStreamPilot({ 
        url: socketUrl, 
        secret: token,
        workflowId,
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

      pilotRef.current = pilot;
      
      await pilot.connect({ videoStream: stream });

      if (pilot.isConnected) {
        setStatus('Connected');

        onTimeReset();
        timerRef.current = setInterval(() => { onTimeTick(); }, 1000);
      }
    } catch (error: unknown) {
      setStatus('Connection Error');
      console.error('Connection error:', error);
    }
  };

  const handleDisconnect = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (pilotRef.current) {
      if (typeof pilotRef.current.disconnect === 'function') {
        pilotRef.current.disconnect();
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => { track.stop(); });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus('Disconnected');
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(track => { track.stop(); });
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
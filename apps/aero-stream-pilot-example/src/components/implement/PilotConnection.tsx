'use client';

import { ConnectionStatus } from '@/constants';

import { DoneComponent, KYCComponent, VideoComponent, WelcomeComponent } from '../steps';

import { type AeroStreamComponentParams, type AeroStreamLibrary, AeroStreamPilot } from 'aero-stream-pilot';
import { useEffect, useRef, useState } from 'react';


const token = 'my-super-secret-token';
const workflowId = 'default-workflow-id';
const socketUrl = 'ws://localhost:8787/app/sync';

interface PilotConnectionProps {
  onSessionId: (id: string | null) => void;
  onStatusChange: (status: ConnectionStatus) => void;
  onTimeTick: () => void;
  onTimeReset: () => void;
}

export function PilotConnection({ onSessionId, onStatusChange, onTimeTick, onTimeReset }: PilotConnectionProps) {
  const stepLibrary: AeroStreamLibrary<React.ReactNode> = {
    WelcomeComponent: (props: AeroStreamComponentParams) => <WelcomeComponent {...props} />,
    VideoComponent: (props: AeroStreamComponentParams) => <VideoComponent {...props} />,
    KYCComponent: (props: AeroStreamComponentParams) => <KYCComponent {...props} />,
    DoneComponent: (props: AeroStreamComponentParams) => <DoneComponent {...props} />,
  };

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [status, setStatus] = useState(ConnectionStatus.closed);
  const [currentComponent, setCurrentComponent] = useState<React.ReactNode | null>(null);

  useEffect(() => {
    onStatusChange(status);
  }, [status, onStatusChange]);

  // Pilot reference
  const pilotRef = useRef<AeroStreamPilot | null>(null);

  const handleConnect = async () => {
    try {
      onSessionId(null);

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video:{
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 30 }
        }, 
        audio: true,  
      });

      pilotRef.current = new AeroStreamPilot<React.ReactNode>({
        url: socketUrl,
        secret: token,
        workflowId,
        videoStream: stream,
        library: stepLibrary,
        renderer: setCurrentComponent,
        onMessage: (message: unknown) => {
          const msgSessionId = (message as { sessionId?: string }).sessionId;
          if (msgSessionId) {
            onSessionId(msgSessionId);
          }
        },
        onClose: () => {
          handleDisconnect();
        }
      });

      await pilotRef.current.connect();

      if (pilotRef.current.isConnected) {
        setStatus(ConnectionStatus.active);

        onTimeReset();
        timerRef.current = setInterval(() => { onTimeTick(); }, 1000);
      }
    } catch (error: unknown) {
      setStatus(ConnectionStatus.error);
      console.error('Connection error:', error);
    }
  };

  const handleDisconnect = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (pilotRef.current) {
      pilotRef.current.disconnect();
      pilotRef.current = null;
    }

    setStatus(ConnectionStatus.closed);
    onSessionId(null);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', padding: '1rem', boxSizing: 'border-box' }}>      
      <div style={{ 
        position: 'relative',
        width: '100%', 
        flex: 1, 
        backgroundColor: '#ebeced', 
        border: '1px solid #e5e7eb', 
        borderRadius: '1rem', 
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>

        {currentComponent ?? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af' }}>
            Flow disconnected. Click Connect to start.
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <button 
          onClick={() => { void handleConnect(); }} 
          disabled={status === ConnectionStatus.active} 
          style={{ padding: '0.75rem 1.5rem', cursor: status === ConnectionStatus.active ? 'not-allowed' : 'pointer', flex: 1, backgroundColor: status === ConnectionStatus.active ? '#d1d5db' : '#2563eb', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 500, fontSize: '1rem', transition: 'background-color 0.2s' }}
        >
          Connect
        </button>
        <button 
          onClick={() => { handleDisconnect(); }} 
          disabled={status === ConnectionStatus.closed} 
          style={{ padding: '0.75rem 1.5rem', cursor: status === ConnectionStatus.closed ? 'not-allowed' : 'pointer', flex: 1, backgroundColor: status === ConnectionStatus.closed ? '#d1d5db' : '#ef4444', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 500, fontSize: '1rem', transition: 'background-color 0.2s' }}
        >
          Disconnect
        </button>
      </div>
    </div>
  );
}
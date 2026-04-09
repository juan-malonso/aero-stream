'use client';

import { ConnectionStatus } from '@/constants';

import { LiveViewer, PerformanceStats, VideoHistory } from './developer';
import { PilotConnection } from './implement';

import { useCallback,useState } from 'react';

export function PilotExample() {
  const [status, setStatus] = useState(ConnectionStatus.closed);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [videoHistory, setVideoHistory] = useState<{ id: string, date: string }[]>([]);
  const [connectionTime, setConnectionTime] = useState(0);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const handleSessionId = useCallback((id: string | null) => {
    setSessionId(id);
    if (id) {
      setVideoHistory((prev) => {
        if (prev.some((v) => v.id === id)) return prev;
        return [...prev, { id, date: new Date().toLocaleString() }];
      });
    }
  }, []);

  return (
      <div style={{ height: '100vh', width: '100%', padding: '30px', boxSizing: 'border-box', fontFamily: 'sans-serif', display: 'flex', gap: '30px' }}>
        <section style={{ height: '100%', flex: 2, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <h2 style={{ margin: 0, paddingBottom: '15px' }}>AeroStream Example</h2>
          
          {/* Core Implementation Example */}
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <PilotConnection 
              onSessionId={handleSessionId}
              onStatusChange={setStatus}
              onTimeTick={() => { setConnectionTime((prev) => prev + 1); }}
              onTimeReset={() => { setConnectionTime(0); }}
            />
          </div>
        </section>

        <hr />

        {/* Developer Diagnostic Tools */}
        <aside style={{ width: '350px', height: '100%', display: 'flex', flexDirection: 'column', gap: '40px' }}>
          <PerformanceStats status={status} connectionTime={connectionTime} />
          <LiveViewer viewingId={viewingId} onClose={() => { setViewingId(null); }} />
          <VideoHistory 
            history={videoHistory} 
            currentSessionId={sessionId} 
            status={status} 
            onViewVideo={(id) => {
              setViewingId(id);
            }} 
          />
        </aside>
      </div>
  );
}
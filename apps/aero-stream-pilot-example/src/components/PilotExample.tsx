'use client';

import { LiveViewer, PerformanceStats, VideoHistory } from './developer';
import { PilotConnection } from './implement';

import { useCallback,useState } from 'react';

export function PilotExample() {
  const [status, setStatus] = useState('Disconnected');
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
    <div style={{ fontFamily: 'sans-serif', padding: 20, maxWidth: 1400, margin: '0 auto', display: 'flex', gap: '30px' }}>
      <section style={{ flex: 2, minWidth: 0 }}>
        <h2 style={{ marginTop: 0 }}>AeroStream Pilot - Next.js Frontend</h2>
        
        {/* Core Implementation Example */}
        <PilotConnection 
          onSessionId={handleSessionId}
          onStatusChange={setStatus}
          onTimeTick={() => { setConnectionTime((prev) => prev + 1); }}
          onTimeReset={() => { setConnectionTime(0); }}
        />

        {viewingId && (
          <LiveViewer viewingId={viewingId} onClose={() => { setViewingId(null); }} />
        )}
      </section>

      {/* Developer Diagnostic Tools */}
      <aside style={{ width: '250px', borderLeft: '1px solid #ddd', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <PerformanceStats status={status} connectionTime={connectionTime} />
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
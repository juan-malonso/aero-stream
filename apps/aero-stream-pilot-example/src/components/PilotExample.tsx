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
        return [{ id, date: new Date().toLocaleString() }, ...prev];
      });
    }
  }, []);

  const handleDownloadVideo = async (id: string) => {
    try {
      const playlistRes = await fetch(`http://localhost:8787/resources/${id}/video/playlist.json`);
      if (!playlistRes.ok) throw new Error('No se pudo obtener la playlist del video');
      const { url: playlistUrl } = await playlistRes.json() as { url: string };

      const playlistDataRes = await fetch(playlistUrl);
      if (!playlistDataRes.ok) throw new Error('No se pudo descargar la playlist');
      const playlist = await playlistDataRes.json() as { segments: string[] };

      const buffers: ArrayBuffer[] = [];
      for (const segment of playlist.segments) {
        const segRes = await fetch(`http://localhost:8787/resources/${id}/video/${segment}`);
        if (!segRes.ok) continue;
        const { url: segUrl } = await segRes.json() as { url: string };
        const segDataRes = await fetch(segUrl);
        if (segDataRes.ok) {
          buffers.push(await segDataRes.arrayBuffer());
        }
      }

      if (buffers.length === 0) throw new Error('No se encontraron segmentos de video');

      const blob = new Blob(buffers, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `video-${id}.webm`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error al descargar el video:', error);
      alert('Hubo un error al intentar descargar el video.');
    }
  };

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
        <aside style={{ width: '350px', height: '100%', display: 'flex', flexDirection: 'column', gap: '40px', overflowY: 'hidden'}}>
          <PerformanceStats status={status} connectionTime={connectionTime} />
          <LiveViewer viewingId={viewingId} onClose={() => { setViewingId(null); }} />
          <VideoHistory 
            history={videoHistory} 
            currentSessionId={sessionId} 
            status={status} 
            onViewVideo={(id) => {
              setViewingId(id);
            }} 
            onDownloadVideo={(id) => {
              void handleDownloadVideo(id)
            }}
          />
        </aside>
      </div>
  );
}
'use client';

import { useState, useRef, useEffect } from 'react';
import { AeroStreamPilot } from 'aero-stream-pilot';

const token = 'my-super-secret-token';
const socketUrl = 'ws://localhost:8787/app/sync';

export default function Home() {
  const [status, setStatus] = useState('Disconnected');
  const [logs, setLogs] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [videoHistory, setVideoHistory] = useState<{ id: string, date: string }[]>([]);
  const [memoryUsage, setMemoryUsage] = useState<string>('N/A');
  const [fps, setFps] = useState<number>(0);
  const [connectionTime, setConnectionTime] = useState<number>(0);
  const [vttUrl, setVttUrl] = useState<string>('');
  const pilotRef = useRef<AeroStreamPilot | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const viewerVideoRef = useRef<HTMLVideoElement>(null);

  const addLog = (msg: string) => {
    setLogs((prev: string[]) => [ `[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleConnect = async () => {
    try {
      setStatus('Connecting...');
      setLogs([]); // <-- Reinicia los logs al iniciar la conexión
      setSessionId(null);

      addLog('Requesting camera permissions...');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      addLog('Camera activated.');

      const pilot = new AeroStreamPilot({ 
        url: socketUrl, 
        secret: token,
        onMessage: (message: any) => {
          if (message.sessionId) {
            setSessionId(message.sessionId);
            setVideoHistory((prev) => {
              if (prev.some((v) => v.id === message.sessionId)) return prev;
              return [...prev, { id: message.sessionId, date: new Date().toLocaleString() }];
            });
          }
          addLog(`Received message: ${JSON.stringify(message)}`);
        },
        onClose: () => {
          handleDisconnect();
          addLog('WebSocket connection closed by the server.');
        },
      });

      addLog('Connecting to server and starting video...');
      pilotRef.current = pilot;
      // Delegamos el stream de video al SDK para que lo procese internamente
      await pilot.connect({ token, videoStream: stream } as any);

      if (pilot.isConnected) {
        setStatus('Connected');
        addLog(`Connection successful.`);

        setConnectionTime(0);
        timerRef.current = setInterval(() => {
          setConnectionTime((prev) => prev + 1);
        }, 1000);
      }
    } catch (error: any) {
      setStatus('Connection Error');
      addLog(`An error occurred: ${error.message || error}`);
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
      addLog('Closing connection locally...');
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus('Disconnected');
  };

  const handleViewVideo = async (idToView: string) => {
    addLog(`Starting MSE viewer for video (${idToView})...`);
    setViewingId(idToView);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!viewingId || !viewerVideoRef.current) return;

    setVttUrl('');
    fetch(`http://localhost:8787/resources/${viewingId}/video/signature.vtt`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.url) setVttUrl(data.url);
      })
      .catch(e => console.error('Error fetching VTT:', e));

    const video = viewerVideoRef.current;
    const mediaSource = new MediaSource();
    video.src = URL.createObjectURL(mediaSource);

    let sourceBuffer: SourceBuffer;
    let isDestroyed = false;
    let fetchInterval: ReturnType<typeof setInterval>;
    const loadedSegments = new Set<string>();
    const queue: string[] = [];
    let isAppending = false;

    const processQueue = async () => {
      if (isAppending || queue.length === 0 || isDestroyed || !sourceBuffer || sourceBuffer.updating) return;
      isAppending = true;
      const segment = queue.shift()!;
      try {
        const presignedRes = await fetch(`http://localhost:8787/resources/${viewingId}/video/${segment}`);
        if (presignedRes.ok) {
          const { url } = await presignedRes.json();
          const segmentRes = await fetch(url);
          if (segmentRes.ok) {
            const arrayBuffer = await segmentRes.arrayBuffer();
            sourceBuffer.appendBuffer(arrayBuffer);
            return; // Will set isAppending = false inside updateend event
          }
        }
      } catch (e) {
        console.error('Error fetching/appending segment:', e);
      }
      isAppending = false;
      if (queue.length > 0) processQueue();
    };

    mediaSource.addEventListener('sourceopen', () => {
      try {
        const mime = 'video/webm; codecs="vp8,opus"';
        sourceBuffer = mediaSource.addSourceBuffer(MediaSource.isTypeSupported(mime) ? mime : 'video/webm');
        sourceBuffer.addEventListener('updateend', () => {
          isAppending = false;
          processQueue();
        });
      } catch (e) {
        console.error('Error adding source buffer:', e);
        return;
      }

      const pollPlaylist = async () => {
        if (isDestroyed) return;
        try {
          const presignedRes = await fetch(`http://localhost:8787/resources/${viewingId}/video/playlist.json`);
          if (!presignedRes.ok) return;
          const { url } = await presignedRes.json();
          const playlistRes = await fetch(url);
          if (playlistRes.ok) {
            const playlist = await playlistRes.json();
            let hasNew = false;
            for (const seg of playlist.segments) {
              if (!loadedSegments.has(seg)) {
                loadedSegments.add(seg);
                queue.push(seg);
                hasNew = true;
              }
            }
            if (hasNew) processQueue();

            if (!playlist.isUploading && queue.length === 0 && !isAppending) {
              clearInterval(fetchInterval);
              setTimeout(() => {
                if (mediaSource.readyState === 'open' && !sourceBuffer.updating) {
                  mediaSource.endOfStream();
                }
              }, 500);
            }
          }
        } catch (e) {
          console.error('Error polling playlist:', e);
        }
      };

      pollPlaylist();
      fetchInterval = setInterval(pollPlaylist, 3000);
    });

    return () => {
      isDestroyed = true;
      if (fetchInterval) clearInterval(fetchInterval);
      if (mediaSource.readyState === 'open') {
        try { mediaSource.endOfStream(); } catch(e) {}
      }
    };
  }, [viewingId]);

  // Hook para calcular el uso de Memoria y CPU (usando FPS como indicador de estrés del Main Thread)
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    let frames = 0;

    const updateMetrics = () => {
      const now = performance.now();
      frames++;

      if (now - lastTime >= 1000) {
        setFps(Math.round((frames * 1000) / (now - lastTime)));
        frames = 0;
        lastTime = now;

        // Obtener uso de memoria (Solo disponible en Chromium: Chrome, Edge, Brave)
        const perf = performance as any;
        if (perf.memory) {
          const used = Math.round(perf.memory.usedJSHeapSize / 1024 / 1024);
          setMemoryUsage(`${used} MB`);
        }
      }

      animationFrameId = requestAnimationFrame(updateMetrics);
    };

    animationFrameId = requestAnimationFrame(updateMetrics);

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20, maxWidth: 1400, margin: '0 auto', display: 'flex', gap: '30px' }}>
      <section style={{ flex: 2, minWidth: 0 }}>
        <h2 style={{ marginTop: 0 }}>AeroStream Pilot - Next.js Frontend</h2>
        <div style={{ marginTop: 20 }}>
          <h3 style={{ marginTop: 0 }}>Camera Capture:</h3>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            style={{ width: '100%', background: '#000', borderRadius: '8px' }} 
          />
        </div>

      {viewingId && (
        <div style={{ marginTop: 20 }}>
          <h3 style={{ marginTop: 0 }}>Live Viewer: {viewingId.split('-')[0]}</h3>
          <video 
            ref={viewerVideoRef} 
            autoPlay 
            controls
            crossOrigin="anonymous"
            style={{ width: '100%', background: '#000', borderRadius: '8px', border: '2px solid #4CAF50' }} 
          >
            {vttUrl && <track default kind="subtitles" srcLang="es" label="Firma" src={vttUrl} />}
          </video>
          <button 
            onClick={() => setViewingId(null)} 
            style={{ marginTop: 10, padding: '8px 16px', cursor: 'pointer', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            Close Viewer
          </button>
        </div>
      )}
      </section>

      <section style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: 15, fontWeight: 'bold', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ color: status === 'Connected' ? 'green' : status === 'Disconnected' ? 'orange' : 'gray' }}>Status: {status}</span>
          <span style={{ fontSize: '0.9em', color: '#444' }}>⏱ {formatTime(connectionTime)} | ⚡ FPS: {fps} | 💻 Memoria: {memoryUsage}</span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleConnect} disabled={status === 'Connected' || status === 'Connecting...'} style={{ padding: '8px 16px', cursor: 'pointer', flex: 1 }}>Connect</button>
          <button onClick={handleDisconnect} disabled={status !== 'Connected'} style={{ padding: '8px 16px', cursor: 'pointer', flex: 1 }}>Disconnect</button>
        </div>
        <div style={{ marginTop: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginTop: 0 }}>Message Log:</h3>
          <ul style={{ background: '#f4f4f4', padding: 10, flex: 1, minHeight: 300, overflowY: 'auto', border: '1px solid #ccc', listStyleType: 'none', margin: 0 }}>
            {logs.map((l, i) => <li key={i} style={{ borderBottom: '1px solid #ddd', padding: '4px 0', fontSize: '14px' }}>{l}</li>)}
          </ul>
        </div>
      </section>
      
      <aside style={{ width: '150px', borderLeft: '1px solid #ddd', paddingLeft: '20px' }}>
        <h3 style={{ marginTop: 0 }}>History</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {videoHistory.length === 0 && <li style={{ color: '#888', fontSize: '14px' }}>No videos yet...</li>}
          {videoHistory.map((video) => (
            <li key={video.id} style={{ marginBottom: '15px', border: '1px solid #eee', padding: '12px', borderRadius: '8px', backgroundColor: '#fafafa' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>📅 {video.date}</div>
              <div style={{ fontSize: '12px', color: '#333', marginBottom: '10px', wordBreak: 'break-all', fontFamily: 'monospace' }}>ID: {video.id.split('-')[0]}</div>
              <button 
                onClick={() => handleViewVideo(video.id)} 
                disabled={status !== 'Disconnected' && sessionId === video.id}
                style={{ padding: '6px 12px', cursor: status !== 'Disconnected' && sessionId === video.id ? 'not-allowed' : 'pointer', backgroundColor: status !== 'Disconnected' && sessionId === video.id ? '#ccc' : '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', width: '100%', fontSize: '14px' }}
              >
                {status !== 'Disconnected' && sessionId === video.id ? '🔴 Recording...' : '🎬 View Video'}
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
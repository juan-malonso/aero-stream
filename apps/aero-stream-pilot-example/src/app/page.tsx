'use client';

import { useState, useRef, useEffect } from 'react';
import { AeroStreamPilot } from 'aero-stream-pilot';

const token = 'my-super-secret-token';
const socketUrl = 'ws://localhost:8787/app/sync';

export default function Home() {
  const [status, setStatus] = useState('Disconnected');
  const [logs, setLogs] = useState<string[]>([]);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const pilotRef = useRef<AeroStreamPilot | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const addLog = (msg: string) => {
    setLogs((prev: string[]) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleConnect = async () => {
    try {
      setStatus('Connecting...');
      const pilot = new AeroStreamPilot({ 
        url: socketUrl, 
        secret: token,
        onMessage: (message: any) => {
          addLog(`Received message: ${JSON.stringify(message)}`);
        },
        onClose: () => {
          handleDisconnect();
          addLog('WebSocket connection closed by the server.');
        },
      });

      addLog('Connecting to server...');
      pilotRef.current = pilot;
      await pilot.connect();

      if (pilot.isConnected) {
        setStatus('Connected');
        addLog(`Connection successful.`);
      }
    } catch (error: any) {
      setStatus('Connection Error');
      addLog(`An error occurred: ${error.message || error}`);
    }
  };

  const handleDisconnect = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (pilotRef.current) {
      if (typeof pilotRef.current.disconnect === 'function') pilotRef.current.disconnect();
      addLog('Closing connection locally...');
    }
    setStatus('Disconnected');
  };

  const handleHandshake = () => {
    if (pilotRef.current) {
      addLog('Sending handshake...');
      // The server expects the first message to validate the connection.
      pilotRef.current.sendMessage({ type: 'TESTING', token: sessionToken });
    } else {
      addLog('Cannot send handshake: Not connected.');
    }
  };

  const startCamera = async () => {
    try {
      addLog('Requesting camera permissions...');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
      addLog('Camera activated.');
    } catch (err: any) {
      addLog(`Camera error: ${err.message || err}`);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    addLog('Camera stopped.');
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    };
  }, []);

  return (
    <main style={{ fontFamily: 'sans-serif', padding: 20, maxWidth: 600, margin: '0 auto' }}>
      <h2>AeroStream Pilot - Next.js Frontend</h2>
      <div style={{ marginBottom: 15, fontWeight: 'bold', color: status === 'Connected' ? 'green' : status === 'Disconnected' ? 'orange' : 'gray' }}>
        Status: {status}
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={handleConnect} disabled={status === 'Connected' || status === 'Connecting...'} style={{ padding: '8px 16px', cursor: 'pointer' }}>Connect</button>
        <button onClick={handleDisconnect} disabled={status !== 'Connected'} style={{ padding: '8px 16px', cursor: 'pointer' }}>Disconnect</button>
        <button onClick={handleHandshake} disabled={status !== 'Connected'} style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#e0f7fa' }}>Send Handshake</button>
      </div>
      <div style={{ marginTop: 20 }}>
        <h3>Message Log:</h3>
        <ul style={{ background: '#f4f4f4', padding: 10, height: 300, overflowY: 'auto', border: '1px solid #ccc', listStyleType: 'none', margin: 0 }}>
          {logs.map((l, i) => <li key={i} style={{ borderBottom: '1px solid #ddd', padding: '4px 0', fontSize: '14px' }}>{l}</li>)}
        </ul>
      </div>
      <div style={{ marginTop: 20 }}>
        <h3>Camera Capture:</h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <button onClick={startCamera} disabled={isCameraActive} style={{ padding: '8px 16px', cursor: 'pointer' }}>Start Camera</button>
          <button onClick={stopCamera} disabled={!isCameraActive} style={{ padding: '8px 16px', cursor: 'pointer' }}>Stop Camera</button>
        </div>
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          style={{ width: '100%', background: '#000', borderRadius: '8px' }} 
        />
      </div>
    </main>
  );
}
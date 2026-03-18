'use client';

import { useState, useRef, useEffect } from 'react';
import { AeroStreamPilot } from 'aero-stream-pilot';

const requestUrl = 'http://localhost:8787/request-flight';

export default function Home() {
  const [status, setStatus] = useState('Desconectado');
  const [logs, setLogs] = useState<string[]>([]);
  const pilotRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleConnect = async () => {
    try {
      setStatus('Iniciando...');
      addLog('Obteniendo token de autorización...');
      const response = await fetch(requestUrl);
      if (!response.ok) throw new Error(`Error: ${response.statusText}`);
      
      const data = await response.json();
      const token = data.ticket;
      addLog('Token obtenido exitosamente.');

      const pilot = new AeroStreamPilot({
        url: 'http://localhost:8787/tower-stream',
      });
      pilotRef.current = pilot;

      addLog('Conectando al servidor...');
      await pilot.connect(token);

      if (pilot.isConnected) {
        setStatus('Conectado');
        addLog(`Conexión exitosa.`);

        intervalRef.current = setInterval(() => {
          if (pilot.isConnected) {
            const msg = 'Ping de estado desde frontend Next.js...';
            // Compatibilidad según los métodos expuestos en tu clase
            if (typeof pilot.sendMessage === 'function') pilot.sendMessage({ type: 'ping', content: msg });
            else if (typeof pilot.send === 'function') pilot.send({ type: 'ping', content: msg });
            else if (typeof pilot.publicMessage === 'function') pilot.publicMessage({ type: 'ping', content: msg });
            
            addLog(`Enviado: ${msg}`);
          }
        }, 5000);

        pilot.ws?.addEventListener('close', () => {
          handleDisconnect();
          addLog('La conexión de WebSocket se ha cerrado por parte del servidor.');
        });
      }
    } catch (error: any) {
      setStatus('Error de conexión');
      addLog(`Ocurrió un error: ${error.message || error}`);
    }
  };

  const handleDisconnect = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (pilotRef.current) {
      if (typeof pilotRef.current.disconnect === 'function') pilotRef.current.disconnect();
      else if (typeof pilotRef.current.close === 'function') pilotRef.current.close();
      addLog('Cerrando conexión localmente...');
    }
    setStatus('Desconectado');
  };

  return (
    <main style={{ fontFamily: 'sans-serif', padding: 20, maxWidth: 600, margin: '0 auto' }}>
      <h2>AeroStream Pilot - Next.js Frontend</h2>
      <div style={{ marginBottom: 15, fontWeight: 'bold', color: status === 'Conectado' ? 'green' : status === 'Desconectado' ? 'orange' : 'gray' }}>
        Estado: {status}
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={handleConnect} disabled={status === 'Conectado' || status === 'Iniciando...'} style={{ padding: '8px 16px', cursor: 'pointer' }}>Conectar</button>
        <button onClick={handleDisconnect} disabled={status !== 'Conectado'} style={{ padding: '8px 16px', cursor: 'pointer' }}>Desconectar</button>
      </div>
      <div style={{ marginTop: 20 }}>
        <h3>Log de mensajes:</h3>
        <ul style={{ background: '#f4f4f4', padding: 10, height: 300, overflowY: 'auto', border: '1px solid #ccc', listStyleType: 'none', margin: 0 }}>
          {logs.map((l, i) => <li key={i} style={{ borderBottom: '1px solid #ddd', padding: '4px 0', fontSize: '14px' }}>{l}</li>)}
        </ul>
      </div>
    </main>
  );
}
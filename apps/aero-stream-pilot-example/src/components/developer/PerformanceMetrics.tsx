'use client';

import { ConnectionStatus } from '@/constants';

import { useEffect, useState } from 'react';

function usePerformanceMetrics() {
  const [fps, setFps] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState('N/A');

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

        const perf = performance as unknown as { memory?: { usedJSHeapSize: number } };
        if (perf.memory) {
          const used = Math.round(perf.memory.usedJSHeapSize / 1024 / 1024);
          setMemoryUsage(`${used.toString()} MB`);
        }
      }
      animationFrameId = requestAnimationFrame(updateMetrics);
    };
    animationFrameId = requestAnimationFrame(updateMetrics);
    return () => { cancelAnimationFrame(animationFrameId); };
  }, []);

  return { fps, memoryUsage };
}

export function PerformanceStats({ status, connectionTime }: { status: ConnectionStatus; connectionTime: number }) {
  const { fps, memoryUsage } = usePerformanceMetrics();
  const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

  return (
    <div style={{ marginBottom: 15, fontWeight: 'bold', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <h3 style={{ marginBottom: 5 }}> Status: <span style={{ color: status === ConnectionStatus.active ? 'green' : status === ConnectionStatus.error ? 'orange' : 'gray' }}>{status}</span></h3>
      <span style={{ fontSize: '0.9em', color: '#444' }}>Time: {formatTime(connectionTime)}</span>
      <span style={{ fontSize: '0.9em', color: '#444' }}>FPS: {fps}</span>
      <span style={{ fontSize: '0.9em', color: '#444' }}>Mem: {memoryUsage}</span>
    </div>
  );
}
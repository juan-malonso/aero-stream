import { StepCard } from '../StepCard';

import { type AeroStreamComponent } from 'aero-stream-pilot';
import React, { useEffect, useRef } from 'react';

export const VideoComponent: AeroStreamComponent<React.ReactNode> = ({
  data, 
  submit,
  stream,
  canvas,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const ghostContainerRef = useRef<HTMLDivElement>(null);

  const config = data as {
    title?: string;
    subtitle?: string;
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream();
    }
    
    const container = ghostContainerRef.current;
    const canvasEl: HTMLCanvasElement = canvas();

    if (container) {
        canvasEl.style.position = 'absolute';
        canvasEl.style.top = '0';
        canvasEl.style.left = '0';
        canvasEl.style.width = '100%';
        canvasEl.style.height = '100%';
        canvasEl.style.objectFit = 'cover';
        
        container.appendChild(canvasEl);

        return () => {
          if (container.contains(canvasEl)) {
            container.removeChild(canvasEl);
          }
        };
    }
  }, [stream, canvas]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit({ status: 'success' });
  };
  
  return (
    <StepCard title={config.title} subtitle={config.subtitle}>
      <div style={{ width: '100%', maxWidth: '35rem', height: '100%', maxHeight: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        <div style={{ 
          width: '100%', 
          height: '100%', 
          aspectRatio: '16/9',
          backgroundColor: '#e5e7eb', 
          borderRadius: '0.5rem', 
          overflow: 'hidden', 
          position: 'relative',
          border: '2px dashed #d1d5db', 
          boxSizing: 'border-box' 
        }}>
          <video ref={videoRef} autoPlay playsInline muted 
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',  objectFit: 'cover' }}
          />
          <div ref={ghostContainerRef} 
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }} />
        </div>
        <button 
          type="button"
          style={{ width: '100%', padding: '0.75rem 1.5rem', backgroundColor: '#2563eb', color: '#ffffff', fontWeight: 500, borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
          onClick={handleSubmit}
        >
          Capturar y Continuar
        </button>
      </div>
    </StepCard>
  );
}
import React, { useEffect, useRef } from 'react';
import { StepCard } from '../StepCard';
import { AeroStreamComponent } from 'aero-stream-pilot';

export const VideoComponent: AeroStreamComponent<React.ReactNode> = ({
  data, 
  submit,
  stream,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Video Component Props
  const config = data as {
    title?: string;
    subtitle?: string;
  };

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream();
    }
  }, [stream]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit({ status: 'success' });
  };
  
  return (
    <StepCard title={config.title} subtitle={config.subtitle}>
      <div style={{ width: '100%', maxWidth: '24rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ width: '100%', aspectRatio: '4/3', backgroundColor: '#e5e7eb', borderRadius: '0.5rem', overflow: 'hidden', position: 'relative', border: '2px dashed #d1d5db', boxSizing: 'border-box' }}>
          <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
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
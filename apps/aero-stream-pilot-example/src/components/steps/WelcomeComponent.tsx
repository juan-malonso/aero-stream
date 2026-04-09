import React from 'react';
import { StepCard } from '../StepCard';
import { AeroStreamComponent } from 'aero-stream-pilot';

export const WelcomeComponent: AeroStreamComponent<React.ReactNode> = ({
  data, 
  submit,
}) => {
  // Welcome Component Props
  const config = data as {
    title?: string;
    description?: string;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit({ status: 'started' });
  };
  
  return (
    <StepCard title={config.title} description={config.description}>
      <div style={{ width: '100%', maxWidth: '24rem', display: 'flex', flexDirection: 'column' }}>
        <button 
          type="button"
          style={{ width: '100%', padding: '0.75rem 1.5rem', backgroundColor: '#2563eb', color: '#ffffff', fontWeight: 500, borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
          onClick={handleSubmit}
        >
          Continuar
        </button>
      </div>
    </StepCard>
  );
}
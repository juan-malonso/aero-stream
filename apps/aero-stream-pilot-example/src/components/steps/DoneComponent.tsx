import React from 'react';
import { StepCard } from '../StepCard';
import { AeroStreamComponent } from 'aero-stream-pilot';

export const DoneComponent: AeroStreamComponent<React.ReactNode> = ({
  data, 
  submit,
}) => {
  // Done Component Props
  const config = data as {
    title?: string;
    message?: string;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit({ status: 'finished' });
  };

  return (
    <StepCard title={config.title} message={config.message}>
      <div onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '24rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '50px'}}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '5rem', height: '5rem', backgroundColor: '#dcfce7', color: '#16a34a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg style={{ width: '2.5rem', height: '2.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
        </div>
        <button 
          type="button"
          style={{ width: '100%', padding: '0.75rem 1.5rem', backgroundColor: '#2563eb', color: '#ffffff', fontWeight: 500, borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
          onClick={handleSubmit}
        >
          Finalizar
        </button>
      </div>
    </StepCard>
  );
}
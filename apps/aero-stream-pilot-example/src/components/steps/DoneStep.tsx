import { type AeroStreamComponent } from 'aero-stream-pilot';
import React from 'react';

interface StepProps {
  title: string;
}

interface DoneStepProps {
  data: StepProps;
  commit: (action: string, data?: unknown) => void;
}

const DoneStep: React.FC<DoneStepProps> = ({ data: { title }, commit }) => {
  return (
    <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f0fff0', borderRadius: '8px' }}>
      <h2>{title}</h2>
      <p>Your workflow has completed successfully.</p>
      <button 
        onClick={() => { commit('NEXT'); }}
        style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer', marginTop: '20px' }}
      >
        Finish
      </button>
    </div>
  );
};

export const DoneComponent: AeroStreamComponent<React.ReactNode> = (
  config, 
  submit: (data: unknown) => void,
  _reject: (error: unknown) => void
) => {
  const commit = (action: string, data: unknown = {}) => { 
    submit(data);
  };

  return <DoneStep data={config as StepProps} commit={commit} />;
}
import { type AeroStreamComponent } from 'aero-stream-pilot';
import React from 'react';

interface StepProps {
  title: string;
}

interface WelcomeStepProps {
  data: StepProps;
  commit: (data?: unknown) => void;
}

const WelcomeStep: React.FC<WelcomeStepProps> = ({ data: { title }, commit }) => {
  return (
    <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f0f4f8', borderRadius: '8px' }}>
      <h2>{title}</h2>
      <p>Welcome to the Aero-Stream Pilot flow. Please click below to start.</p>
      <button 
        onClick={() => { commit(); }}
        style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer', marginTop: '20px' }}
      >
        Start
      </button>
    </div>
  );
};

export const WelcomeComponent: AeroStreamComponent<React.ReactNode> = (
  config, 
  submit: (data: unknown) => void,
  _reject: (error: unknown) => void
) => {
  const commit = (data: unknown = {}) => {
    console.log('WelcomeComponent commit called:', { data });
    submit(data);
  };
  return <WelcomeStep data={config as StepProps} commit={commit} />;
}
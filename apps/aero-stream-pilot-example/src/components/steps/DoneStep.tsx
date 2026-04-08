import { type AeroStreamComponent } from 'aero-stream-pilot';
import React from 'react';

interface StepProps {
  title: string;
}

interface DoneStepProps {
  data: StepProps;
  commit: (data?: unknown) => void;
}

const DoneStep: React.FC<DoneStepProps> = ({ data, commit }) => {
  return (
    <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f0fff0', borderRadius: '8px' }}>
      <h2>{data?.title || 'Done'}</h2>
      <p>Your workflow has completed successfully.</p>


      <button 
        onClick={() => { commit(); }}
        style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer', marginTop: '20px' }}
      >
        Finish
      </button>
    </div>
  );
};

export const DoneComponent: AeroStreamComponent<React.ReactNode> = ({
  data, 
  submit,
  reject
}) => {
  const commit = (payload: unknown = {}) => {
    console.log('DoneComponent commit called:', { data: payload });
    submit(payload);
  };
  return <DoneStep data={data as StepProps} commit={commit} />;
}
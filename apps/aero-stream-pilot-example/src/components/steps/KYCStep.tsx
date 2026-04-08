import { type AeroStreamComponent } from 'aero-stream-pilot';
import React, { useState } from 'react';

interface StepProps {
  title: string;
}

interface KYCStepProps {
  data: StepProps;
  commit: (data?: unknown) => void;
}

const KYCStep: React.FC<KYCStepProps> = ({ data, commit }) => {
  const [name, setName] = useState('');

  return (
    <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#fff0f0', borderRadius: '8px' }}>
      <h2>{data?.title || 'KYC Step'}</h2>
      <p>Please enter your full name for verification.</p>


      <div style={{ margin: '20px 0' }}>
        <input 
          type="text" 
          value={name}
          onChange={(e) => { setName(e.target.value); }}
          placeholder="Your full name"
          style={{ padding: '10px', fontSize: '16px', width: '80%' }}
        />
      </div>
      <button 
        onClick={() => { commit({ name }); }}
        disabled={!name}
        style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
      >
        Submit KYC
      </button>
    </div>
  );
};

export const KYCComponent: AeroStreamComponent<React.ReactNode> = ({
  data, 
  submit,
  reject
}) => {
  const commit = (payload: unknown = {}) => {
    console.log('KYCComponent commit called:', { data: payload });
    submit(payload);
  };
  return <KYCStep data={data as StepProps} commit={commit} />;
}
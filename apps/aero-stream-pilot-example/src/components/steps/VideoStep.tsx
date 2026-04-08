import { type AeroStreamComponent } from 'aero-stream-pilot';
import React, { useEffect, useRef } from 'react';

interface StepProps {
  title: string;
}

interface VideoStepProps {
  data: StepProps;
  stream: () => MediaStream;
  commit: (data?: unknown) => void;
}

const VideoStep: React.FC<VideoStepProps> = ({ data, stream, commit }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream();
    }
  }, [stream]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#eef2ff', borderRadius: '8px' }}>
      <h2>{data?.title || 'Video Feed'}</h2>
      <p>Please position yourself in the frame before continuing.</p>


      <div style={{ margin: '20px auto', maxWidth: '400px', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden' }}>
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          style={{ width: '100%', display: 'block' }} 
        />
      </div>

      <button 
        onClick={() => { commit(); }}
        style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer', marginTop: '10px' }}
      >
        Continue
      </button>
    </div>
  );
};

export const VideoComponent: AeroStreamComponent<React.ReactNode> = ({
  data, 
  stream,
  submit,
  reject
}) => {
  const commit = (payload: unknown = {}) => {
    console.log('VideoComponent commit called:', { data: payload });
    submit(payload);
  };
  return <VideoStep data={data as StepProps} stream={stream} commit={commit} />;
}

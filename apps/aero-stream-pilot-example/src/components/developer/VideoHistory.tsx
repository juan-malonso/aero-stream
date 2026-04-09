'use client';

import { ConnectionStatus } from "@/constants";

interface VideoHistoryProps {
  history: { id: string; date: string }[];
  currentSessionId: string | null;
  status: ConnectionStatus;
  onViewVideo: (id: string) => void;
}

export function VideoHistory({ history, currentSessionId, status, onViewVideo }: VideoHistoryProps) {
  return (
    <div style={{ marginBottom: 15, fontWeight: 'bold', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <h3 style={{ marginBottom: 5 }}>History</h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {history.length === 0 && <li style={{ color: '#000', fontSize: '14px' }}>No videos yet...</li>}
        {history.map((video) => (
          <li key={video.id} style={{ marginBottom: '15px', border: '1px solid #000', padding: '12px', borderRadius: '3px', backgroundColor: '#eee' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
              <div style={{ fontSize: '12px', color: '#666' }}>{video.date}</div>
              <div style={{ fontSize: '12px', color: '#000' }}>{video.id.split('-')[0]}</div>
            </div>
            <button 
              onClick={() => { onViewVideo(video.id); }} 
              disabled={status === ConnectionStatus.active && currentSessionId === video.id} 
              style={{ 
                padding: '6px 12px', 
                cursor: status === ConnectionStatus.active && currentSessionId === video.id ? 'not-allowed' : 'pointer', 
                backgroundColor: status === ConnectionStatus.active && currentSessionId === video.id ? '#c6720b' : '#4CAF50',
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                width: '100%', 
                fontSize: '14px' 
              }}
            >
              {status === ConnectionStatus.active && currentSessionId === video.id ? 'Recording' : 'View Video'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
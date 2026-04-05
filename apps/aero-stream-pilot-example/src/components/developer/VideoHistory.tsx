'use client';

interface VideoHistoryProps {
  history: { id: string; date: string }[];
  currentSessionId: string | null;
  status: string;
  onViewVideo: (id: string) => void;
}

export function VideoHistory({ history, currentSessionId, status, onViewVideo }: VideoHistoryProps) {
  return (
    <div>
      <h3 style={{ marginTop: 0 }}>History</h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {history.length === 0 && <li style={{ color: '#888', fontSize: '14px' }}>No videos yet...</li>}
        {history.map((video) => (
          <li key={video.id} style={{ marginBottom: '15px', border: '1px solid #eee', padding: '12px', borderRadius: '8px', backgroundColor: '#fafafa' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
              <div style={{ fontSize: '12px', color: '#666' }}>{video.date}</div>
              <div style={{ fontSize: '12px', color: '#333' }}>{video.id.split('-')[0]}</div>
            </div>
            <button onClick={() => { onViewVideo(video.id); }} disabled={status !== 'Disconnected' && currentSessionId === video.id} style={{ padding: '6px 12px', cursor: status !== 'Disconnected' && currentSessionId === video.id ? 'not-allowed' : 'pointer', backgroundColor: status !== 'Disconnected' && currentSessionId === video.id ? '#ccc' : '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', width: '100%', fontSize: '14px' }}>
              {status !== 'Disconnected' && currentSessionId === video.id ? 'Recording...' : 'View Video'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
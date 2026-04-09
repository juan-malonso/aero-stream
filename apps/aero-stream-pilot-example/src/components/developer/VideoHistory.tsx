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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', }}>
      <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 'bold', color: '#1f2937' }}>Historial de Sesiones</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '400px', paddingRight: '0.25rem' }}>
        {history.length === 0 ? (
          <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0, textAlign: 'center', padding: '1rem 0' }}>No hay videos en el historial.</p>
        ) : (
          history.reverse().map((session) => {
            const isActive = session.id === currentSessionId && status === ConnectionStatus.active;
            return (
              <div 
                key={session.id} 
                style={{ padding: '0.75rem', backgroundColor: isActive ? '#eff6ff' : '#f9fafb', border: `1px solid ${isActive ? '#bfdbfe' : '#e5e7eb'}`, borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: isActive ? '#1d4ed8' : '#374151' }}>
                    {isActive ? 'En vivo' : 'Grabación'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{session.date}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {session.id}
                </span>
                <button 
                  type="button"
                  onClick={() => onViewVideo(session.id)}
                  disabled={isActive}
                  style={{ width: '100%', marginTop: '0.25rem', padding: '0.5rem', backgroundColor: isActive ? '#e5e7eb' : '#ffffff', color: isActive ? '#9ca3af' : '#4b5563', fontSize: '0.875rem', fontWeight: 500, border: '1px solid #d1d5db', borderRadius: '0.375rem', cursor: isActive ? 'not-allowed' : 'pointer' }}
                >
                  {isActive ? 'Grabando...' : 'Reproducir'}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
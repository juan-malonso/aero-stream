'use client';

import { ConnectionStatus } from "@/constants";

interface VideoHistoryProps {
  history: { id: string; date: string }[];
  currentSessionId: string | null;
  status: ConnectionStatus;
  onViewVideo: (id: string) => void;
  onDownloadVideo?: (id: string) => void;
}

interface VideoHistoryItemProps {
  session: { id: string; date: string };
  isActive: boolean;
  onView: () => void;
  onDownload?: () => void;
}

interface VideoHistoryItemHeaderProps {
  isActive: boolean;
  date: string;
}

function VideoHistoryItemHeader({ isActive, date }: VideoHistoryItemHeaderProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: isActive ? '#dc960a' : '#374151' }}>
        {isActive ? 'En vivo' : 'Grabación'}
      </span>
      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{date}</span>
    </div>
  );
}

interface VideoHistoryItemActionsProps {
  isActive: boolean;
  onView: () => void;
  onDownload?: () => void;
}

function VideoHistoryItemActions({ isActive, onView, onDownload }: VideoHistoryItemActionsProps) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
      <button 
        type="button"
        onClick={onView}
        disabled={isActive}
        style={{ flex: 1, padding: '0.5rem', backgroundColor: isActive ? '#dc960a' : '#10b981', color: '#ffffff', fontSize: '0.875rem', fontWeight: 500, border: '1px solid #d1d5db', borderRadius: '0.375rem', cursor: isActive ? 'not-allowed' : 'pointer' }}
      >
        {isActive ? 'Grabando...' : 'Reproducir'}
      </button>
      <button
        type="button"
        onClick={onDownload}
        disabled={isActive}
        title="Descargar video"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.25rem 0.5rem', backgroundColor: '#ffffff', color: '#4b5563', border: '1px solid #d1d5db', borderRadius: '0.375rem', cursor: isActive ? 'not-allowed' : 'pointer', opacity: isActive ? 0.5 : 1 }}
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </button>
    </div>
  );
}

function VideoHistoryItem({ session, isActive, onView, onDownload }: VideoHistoryItemProps) {
  return (
    <div 
      style={{ padding: '0.75rem', backgroundColor: isActive ? '#ffefdd' : '#ebeced', border: `1px solid ${isActive ? '#bfdbfe' : '#e5e7eb'}`, borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
    >
      <VideoHistoryItemHeader isActive={isActive} date={session.date} />
      <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {session.id}
      </span>
      <VideoHistoryItemActions isActive={isActive} onView={onView} onDownload={onDownload} />
    </div>
  );
}

export function VideoHistory({ history, currentSessionId, status, onViewVideo, onDownloadVideo }: VideoHistoryProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', }}>
      <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 'bold', color: '#1f2937' }}>Historial de Sesiones</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '400px', paddingRight: '0.25rem' }}>
        {history.length === 0 ? (
          <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0, textAlign: 'center', padding: '1rem 0' }}>No hay videos en el historial.</p>
        ) : (
          history.map((session) => {
            const isActive = session.id === currentSessionId && status === ConnectionStatus.active;
            return (
              <VideoHistoryItem
                key={session.id}
                session={session}
                isActive={isActive}
                onView={() => { onViewVideo(session.id); }}
                onDownload={onDownloadVideo ? () => { onDownloadVideo(session.id); } : undefined}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
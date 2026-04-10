import React from 'react';

interface StepCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  description?: string;
  message?: string;
}

export function StepCard({ children, title, subtitle, description, message }: StepCardProps) {
  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', fontFamily: 'sans-serif', boxSizing: 'border-box', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '90%', height: '100%', maxHeight: '90%', backgroundColor: '#ffffff', borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {(title ?? subtitle ?? description ?? message) && (
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #f3f4f6', textAlign: 'center' }}>
            {title && <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>{title}</h2>}
            {subtitle && <h3 style={{ fontSize: '1.125rem', fontWeight: 500, color: '#4b5563', marginTop: '0.5rem', marginBottom: 0 }}>{subtitle}</h3>}
            {description && <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem', marginBottom: 0 }}>{description}</p>}
            {message && <p style={{ fontSize: '1rem', color: '#4b5563', marginTop: '0.5rem', marginBottom: 0 }}>{message}</p>}
          </div>
        )}
        
        <div style={{ width: '100%', flexGrow: 1, padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
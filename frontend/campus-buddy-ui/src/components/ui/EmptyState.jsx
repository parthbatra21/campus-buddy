import React from 'react';

const EmptyState = ({ icon, title, message, action }) => {
  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1rem',
        textAlign: 'center',
        backgroundColor: 'var(--color-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px dashed var(--color-border)',
      }}
    >
      <div style={{ color: 'var(--color-text-muted)', marginBottom: '1rem', fontSize: '2.5rem' }}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
        {title}
      </h3>
      <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)', maxWidth: '280px' }}>
        {message}
      </p>
      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;

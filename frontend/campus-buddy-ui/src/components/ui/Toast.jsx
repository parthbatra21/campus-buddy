import React, { useEffect } from 'react';

const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const variants = {
    success: { bg: 'var(--color-success)', text: 'white', icon: '✓' },
    error: { bg: 'var(--color-danger)', text: 'white', icon: '✕' },
    info: { bg: 'var(--color-info)', text: 'white', icon: 'i' },
  };

  const variant = variants[type] || variants.success;

  return (
    <div 
      style={{
        position: 'fixed',
        top: '1.5rem',
        right: '1.5rem',
        backgroundColor: variant.bg,
        color: variant.text,
        padding: '0.75rem 1.25rem',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-modal)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        zIndex: 1000,
        fontWeight: '500',
        minWidth: '200px',
        animation: 'slideIn 0.3s ease-out'
      }}
    >
      <div 
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.75rem'
        }}
      >
        {variant.icon}
      </div>
      <span style={{ fontSize: '0.875rem' }}>{message}</span>
      <button 
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'inherit',
          opacity: 0.7,
          cursor: 'pointer',
          marginLeft: 'auto',
          fontSize: '1rem'
        }}
      >
        &times;
      </button>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Toast;

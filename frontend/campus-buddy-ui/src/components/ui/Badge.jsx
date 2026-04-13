import React from 'react';

const Badge = ({ text, color = 'blue' }) => {
  const colors = {
    blue: { bg: 'var(--color-info-bg)', text: 'var(--color-info)' },
    green: { bg: 'var(--color-success-bg)', text: 'var(--color-success)' },
    red: { bg: 'var(--color-danger-bg)', text: 'var(--color-danger)' },
    amber: { bg: 'var(--color-warning-bg)', text: 'var(--color-warning)' },
    purple: { bg: '#f5f3ff', text: '#7c3aed' },
    gray: { bg: 'var(--color-surface)', text: 'var(--color-text-muted)' },
  };

  const variant = colors[color] || colors.blue;

  return (
    <span 
      style={{
        backgroundColor: variant.bg,
        color: variant.text,
        fontSize: '0.75rem',
        fontWeight: '500',
        padding: '0.125rem 0.625rem',
        borderRadius: '9999px',
        display: 'inline-flex',
        alignItems: 'center'
      }}
    >
      {text}
    </span>
  );
};

export default Badge;

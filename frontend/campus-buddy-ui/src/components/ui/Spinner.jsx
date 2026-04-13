import React from 'react';

const Spinner = ({ size = 'md', color = 'var(--color-primary-light)' }) => {
  const sizes = {
    sm: '16px',
    md: '32px',
    lg: '48px',
  };

  const spinnerSize = sizes[size] || sizes.md;

  return (
    <div 
      className="animate-spin"
      style={{
        width: spinnerSize,
        height: spinnerSize,
        border: `3px solid var(--color-border-light)`,
        borderTop: `3px solid ${color}`,
        borderRadius: '50%',
        display: 'inline-block'
      }}
    />
  );
};

export default Spinner;

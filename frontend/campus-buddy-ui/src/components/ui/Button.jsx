export default function Button({ 
  children, 
  variant = 'primary', // primary, secondary, outline, danger
  size = 'md', // sm, md, lg
  isLoading = false,
  disabled = false,
  className = '',
  ...props 
}) {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '500',
    fontFamily: 'inherit',
    borderRadius: 'var(--radius-md)',
    cursor: (disabled || isLoading) ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    border: '1px solid transparent',
    outline: 'none',
    whiteSpace: 'nowrap',
  };

  const variants = {
    primary: {
      background: 'var(--primary)',
      color: 'white',
      borderColor: 'var(--primary)',
    },
    secondary: {
      background: 'var(--bg-secondary)',
      color: 'var(--text-primary)',
      borderColor: 'var(--border-strong)',
    },
    outline: {
      background: 'transparent',
      color: 'var(--primary)',
      borderColor: 'var(--primary)',
    },
    danger: {
      background: 'var(--error)',
      color: 'white',
      borderColor: 'var(--error)',
    }
  };

  const hoverVariants = {
    primary: { background: 'var(--primary-hover)', borderColor: 'var(--primary-hover)' },
    secondary: { background: 'var(--border-default)' },
    outline: { background: 'rgba(30, 58, 138, 0.05)' }, // Light primary tint
    danger: { background: '#B91C1C', borderColor: '#B91C1C' }, // Red 700
  };

  const sizes = {
    sm: { padding: '0.375rem 0.75rem', fontSize: '0.75rem' }, // 12px
    md: { padding: '0.5rem 1rem', fontSize: '0.875rem' }, // 14px
    lg: { padding: '0.75rem 1.5rem', fontSize: '1rem' }, // 16px
  };

  const style = {
    ...baseStyle,
    ...variants[variant],
    ...sizes[size],
    opacity: (disabled || isLoading) ? 0.6 : 1,
  };

  return (
    <button
      style={style}
      disabled={disabled || isLoading}
      className={className}
      onMouseOver={(e) => {
        if (!disabled && !isLoading) {
          Object.assign(e.currentTarget.style, hoverVariants[variant]);
        }
      }}
      onMouseOut={(e) => {
        if (!disabled && !isLoading) {
          Object.assign(e.currentTarget.style, variants[variant]);
        }
      }}
      onFocus={(e) => {
          e.currentTarget.style.boxShadow = 'var(--focus-ring)';
      }}
      onBlur={(e) => {
          e.currentTarget.style.boxShadow = 'none';
      }}
      {...props}
    >
      {isLoading ? (
        <span style={{ marginRight: '0.5rem', display: 'flex' }}>
          <svg style={{ animation: 'spin 1s linear infinite', width: '1em', height: '1em' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25"></circle>
            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </span>
      ) : null}
      {children}
    </button>
  );
}

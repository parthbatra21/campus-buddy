export default function Badge({ children, variant = 'neutral', className = '', ...props }) {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.125rem 0.625rem', // 2px 10px
    fontSize: '0.75rem', // 12px
    fontWeight: '600',
    borderRadius: '9999px',
    textTransform: 'uppercase',
    letterSpacing: '0.025em',
    whiteSpace: 'nowrap',
  };

  const variants = {
    neutral: {
      backgroundColor: 'var(--bg-secondary)',
      color: 'var(--text-secondary)',
      border: '1px solid var(--border-default)',
    },
    primary: {
      backgroundColor: 'var(--primary-light)',
      color: 'var(--primary-hover)',
      border: '1px solid transparent',
    },
    success: {
      backgroundColor: 'var(--success-bg)',
      color: 'var(--success-text)',
      border: '1px solid transparent',
    },
    error: {
      backgroundColor: 'var(--error-bg)',
      color: 'var(--error-text)',
      border: '1px solid transparent',
    },
    warning: {
      backgroundColor: 'var(--warning-bg)',
      color: 'var(--warning-text)',
      border: '1px solid transparent',
    },
    info: {
      backgroundColor: 'var(--info-bg)',
      color: 'var(--info-text)',
      border: '1px solid transparent',
    }
  };

  const style = {
    ...baseStyle,
    ...variants[variant],
  };

  return (
    <span style={style} className={className} {...props}>
      {children}
    </span>
  );
}

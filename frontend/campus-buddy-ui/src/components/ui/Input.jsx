export default function Input({ label, error, className = '', ...props }) {
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    width: '100%',
  };

  const labelStyle = {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'var(--text-primary)',
  };

  const inputStyle = {
    width: '100%',
    padding: '0.625rem 0.75rem', // 10px 12px
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    color: 'var(--text-primary)',
    backgroundColor: 'var(--bg-surface)',
    border: `1px solid ${error ? 'var(--error)' : 'var(--border-strong)'}`,
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-sm)',
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  };

  const errorStyle = {
    fontSize: '0.75rem',
    color: 'var(--error)',
    marginTop: '0.25rem',
  };

  return (
    <div style={containerStyle} className={className}>
      {label && <label style={labelStyle}>{label}</label>}
      <input
        style={inputStyle}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = error ? 'var(--error)' : 'var(--primary)';
          e.currentTarget.style.boxShadow = error 
            ? '0 0 0 3px rgba(220, 38, 38, 0.2)' 
            : '0 0 0 3px rgba(30, 58, 138, 0.2)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? 'var(--error)' : 'var(--border-strong)';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        }}
        {...props}
      />
      {error && <span style={errorStyle}>{error}</span>}
    </div>
  );
}

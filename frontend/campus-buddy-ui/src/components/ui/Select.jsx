export default function Select({ label, error, options, className = '', ...props }) {
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
  
    // Using a wrapper to custom style the dropdown arrow cleanly
    const selectWrapperStyle = {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
    };
  
    const selectStyle = {
      width: '100%',
      padding: '0.625rem 2rem 0.625rem 0.75rem', // 10px 32px 10px 12px
      fontSize: '0.875rem',
      lineHeight: '1.25rem',
      color: 'var(--text-primary)',
      backgroundColor: 'var(--bg-surface)',
      border: `1px solid ${error ? 'var(--error)' : 'var(--border-strong)'}`,
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-sm)',
      appearance: 'none',
      WebkitAppearance: 'none',
      cursor: 'pointer',
      outline: 'none',
      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    };
  
    const arrowIconStyle = {
      position: 'absolute',
      right: '0.75rem',
      width: '1rem',
      height: '1rem',
      color: 'var(--text-secondary)',
      pointerEvents: 'none', // Critical so clicks pass through to select
    };
  
    const errorStyle = {
      fontSize: '0.75rem',
      color: 'var(--error)',
      marginTop: '0.25rem',
    };
  
    return (
      <div style={containerStyle} className={className}>
        {label && <label style={labelStyle}>{label}</label>}
        <div style={selectWrapperStyle}>
          <select
            style={selectStyle}
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
          >
            {options && options.map((opt, idx) => (
              <option key={idx} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <svg style={arrowIconStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </div>
        {error && <span style={errorStyle}>{error}</span>}
      </div>
    );
  }

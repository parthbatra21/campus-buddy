export default function Card({ children, className = '', title, action, noPadding = false, ...props }) {
  const cardStyle = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-sm)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  };

  const headerStyle = {
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid var(--border-default)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'var(--bg-surface)',
  };

  const titleStyle = {
    margin: 0,
    fontSize: '1.125rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
  };

  const contentStyle = {
    padding: noPadding ? '0' : '1.5rem',
    flex: 1,
  };

  return (
    <div style={cardStyle} className={className} {...props}>
      {(title || action) && (
        <div style={headerStyle}>
          {title && <h3 style={titleStyle}>{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      <div style={contentStyle}>
        {children}
      </div>
    </div>
  );
}

export default function Table({ columns, data, keyExtractor, emptyMessage = "No data available", className = "" }) {
  const tableContainer = {
    width: '100%',
    overflowX: 'auto',
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '0.875rem',
    color: 'var(--text-primary)',
  };

  const thStyle = {
    padding: '0.75rem 1rem', // 12px 16px
    borderBottom: '1px solid var(--border-strong)',
    color: 'var(--text-secondary)',
    fontWeight: '600',
    textTransform: 'uppercase',
    fontSize: '0.75rem',
    letterSpacing: '0.05em',
    backgroundColor: 'var(--bg-secondary)',
  };

  const tdStyle = {
    padding: '1rem',
    borderBottom: '1px solid var(--border-default)',
    verticalAlign: 'middle',
  };

  if (!data || data.length === 0) {
    return (
      <div className="empty-state">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div style={tableContainer} className={className}>
      <table style={tableStyle}>
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i} style={{ ...thStyle, width: col.width, ...col.headerStyle }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr 
              key={keyExtractor ? keyExtractor(row) : i} 
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-app)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              style={{ transition: 'background-color 0.15s ease' }}
            >
              {columns.map((col, j) => (
                <td key={j} style={{ ...tdStyle, ...col.cellStyle }}>
                  {col.render ? col.render(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

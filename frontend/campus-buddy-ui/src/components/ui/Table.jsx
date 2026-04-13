import React from 'react';
import EmptyState from './EmptyState';

const Table = ({ columns, data, emptyMessage = "No data available" }) => {
  if (!data || data.length === 0) {
    return <EmptyState title="No Results" message={emptyMessage} icon="📊" />;
  }

  return (
    <div style={{ width: '100%', overflowX: 'auto', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'var(--color-card)', textAlign: 'left' }}>
        <thead>
          <tr style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
            {columns.map((col, index) => (
              <th 
                key={index}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr 
              key={rowIndex}
              style={{ 
                borderBottom: rowIndex === data.length - 1 ? 'none' : '1px solid var(--color-border-light)',
                transition: 'var(--transition)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {columns.map((col, colIndex) => (
                <td 
                  key={colIndex}
                  style={{
                    padding: '1rem 1.5rem',
                    fontSize: '0.875rem',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  {col.render ? col.render(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;

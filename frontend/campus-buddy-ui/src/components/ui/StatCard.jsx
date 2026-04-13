import React from 'react';

const StatCard = ({ label, value, icon, trend, color = 'blue', onClick }) => {
  const colors = {
    blue: { bg: 'var(--color-info-bg)', icon: 'var(--color-info)' },
    green: { bg: 'var(--color-success-bg)', icon: 'var(--color-success)' },
    amber: { bg: 'var(--color-warning-bg)', icon: 'var(--color-warning)' },
    purple: { bg: '#f5f3ff', icon: '#7c3aed' },
  };

  const variant = colors[color] || colors.blue;

  return (
    <div 
      className="bg-white rounded-xl shadow-card p-5 border-b"
      style={{ 
        cursor: onClick ? 'pointer' : 'default',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-card)'
      }}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted font-semibold">
            {label}
          </p>
          <h3 className="text-2xl font-bold mt-1" style={{ color: 'var(--color-text-primary)' }}>
            {value}
          </h3>
          {trend && (
            <p className="text-xs mt-2" style={{ color: trend.startsWith('+') ? 'var(--color-success)' : 'var(--color-danger)' }}>
              {trend}
            </p>
          )}
        </div>
        <div 
          style={{ 
            backgroundColor: variant.bg, 
            color: variant.icon,
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;

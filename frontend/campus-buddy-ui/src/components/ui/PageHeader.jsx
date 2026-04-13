import React from 'react';

const PageHeader = ({ title, subtitle, action }) => {
  return (
    <div className="border-b mb-6 pb-5 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div className="flex items-center gap-3">
          {action}
        </div>
      )}
    </div>
  );
};

export default PageHeader;

import React from 'react';
import { getColorForCourse } from '../../utils/colorHash';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8:00 to 20:00

const TimetableGrid = ({ entries, onCellClick, onEntryClick }) => {
  const getPosition = (start, end) => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    
    const top = ((startH - 8) * 64) + (startM / 60 * 64);
    const height = ((endH - startH) * 64) + ((endM - startM) / 60 * 64);
    
    return { top, height };
  };

  return (
    <div style={{ position: 'relative', overflowX: 'auto', backgroundColor: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '64px repeat(7, 1fr)', minWidth: '800px' }}>
        {/* Header */}
        <div style={{ height: '48px', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}></div>
        {DAYS.map((day) => (
          <div 
            key={day} 
            style={{ 
              height: '48px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '0.75rem', 
              fontWeight: '700',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
              borderBottom: '1px solid var(--color-border)',
              borderLeft: '1px solid var(--color-border-light)',
              backgroundColor: 'var(--color-surface)'
            }}
          >
            {day.substring(0, 3)}
          </div>
        ))}

        {/* Time Labels & Grid Cells */}
        <div style={{ position: 'relative', gridColumn: '1 / span 8' }}>
          {HOURS.map((hour) => (
            <div key={hour} style={{ height: '64px', display: 'flex' }}>
              <div style={{ 
                width: '64px', 
                fontSize: '0.75rem', 
                color: 'var(--color-text-muted)', 
                padding: '4px',
                textAlign: 'right',
                borderRight: '1px solid var(--color-border-light)'
              }}>
                {hour}:00
              </div>
              {DAYS.map((day) => (
                <div 
                  key={day} 
                  style={{ 
                    flex: 1, 
                    borderBottom: '1px solid var(--color-border-light)', 
                    borderRight: '1px solid var(--color-border-light)',
                    cursor: 'pointer'
                  }}
                  onClick={() => onCellClick && onCellClick(day, hour)}
                ></div>
              ))}
            </div>
          ))}

          {/* Absolute Positioned Entries */}
          {entries.map((entry) => {
            const dayIndex = DAYS.indexOf(entry.dayOfWeek.toUpperCase());
            if (dayIndex === -1) return null;
            const { top, height } = getPosition(entry.startTime, entry.endTime);
            const color = getColorForCourse(entry.courseCode);

            return (
              <div 
                key={entry.id}
                style={{
                  position: 'absolute',
                  left: `calc(64px + ((${dayIndex}) * (100% - 64px) / 7))`,
                  width: `calc((100% - 64px) / 7 - 8px)`,
                  top: `${top + 48}px`, // +48 for header
                  height: `${height}px`,
                  backgroundColor: `${color}15`,
                  borderLeft: `4px solid ${color}`,
                  padding: '8px',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  zIndex: 10,
                  margin: '0 4px'
                }}
                onClick={(e) => { e.stopPropagation(); onEntryClick && onEntryClick(entry); }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                  {entry.courseCode}
                </div>
                {height > 40 && (
                  <div style={{ fontSize: '0.625rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    {entry.courseName}
                  </div>
                )}
                {height > 60 && (
                  <div style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    {entry.roomNumber}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TimetableGrid;

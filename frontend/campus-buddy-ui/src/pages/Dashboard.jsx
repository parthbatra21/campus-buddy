import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useRole } from '../hooks/useRole';
import api from '../api/client';
import StatCard from '../components/ui/StatCard';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import { getColorForCourse } from '../utils/colorHash';

const Dashboard = () => {
  const { user } = useAuth();
  const { isStudent, isFaculty } = useRole();
  const navigate = useNavigate();
  
  const [attendance, setAttendance] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const requests = [api.get('/academic/timetable')];
        // Only fetch student attendance for students
        if (isStudent) {
          requests.unshift(api.get('/academic/attendance/student'));
        }
        const results = await Promise.allSettled(requests);

        if (isStudent) {
          if (results[0].status === 'fulfilled') setAttendance(results[0].value || []);
          if (results[1].status === 'fulfilled') setTimetable(results[1].value || []);
        } else {
          if (results[0].status === 'fulfilled') setTimetable(results[0].value || []);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isStudent]);

  const getAttendancePercentage = () => {
    if (attendance.length === 0) return 0;
    const present = attendance.filter(a => a.status === 'PRESENT').length;
    return Math.round((present / attendance.length) * 100);
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const todaysClasses = timetable.filter(t => t.dayOfWeek.toUpperCase() === today)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '10rem 0' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="fade-in">
      <PageHeader 
        title={`Welcome back, ${user?.email?.split('@')[0]}`} 
        subtitle={`You are logged in as ${user?.role}`} 
      />

      {/* Row 1: KPI Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '1.5rem', 
        marginBottom: '2rem' 
      }}>
        <StatCard 
          label="Attendance" 
          value={`${getAttendancePercentage()}%`} 
          color="blue"
          icon={<span>📊</span>}
          onClick={() => navigate('/attendance')}
        />
        <StatCard 
          label="Today's Classes" 
          value={todaysClasses.length} 
          color="purple"
          icon={<span>📅</span>}
          onClick={() => navigate('/timetable')}
        />
        <StatCard 
          label="Active Bookings" 
          value={0} 
          color="green"
          icon={<span>🚪</span>}
          onClick={() => navigate('/rooms')}
        />
      </div>

      {/* Row 2: Schedule + Quick Actions */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr', 
        gap: '1.5rem', 
        marginBottom: '2rem' 
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
          {/* Today's Schedule */}
          <div className="bg-white rounded-xl shadow-card p-6 border-b" style={{ border: '1px solid var(--border-default)' }}>
            <h3 className="text-lg font-bold mb-5">Today's Classes</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {todaysClasses.map((cls) => (
                <div 
                  key={cls.id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'between',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    borderLeft: `4px solid ${getColorForCourse(cls.courseCode)}`,
                    backgroundColor: 'var(--bg-surface)',
                    borderBottom: '1px solid var(--border-subtle)'
                  }}
                >
                  <div>
                    <div className="font-semibold">{cls.courseName}</div>
                    <div className="text-xs text-muted mt-1">{cls.courseCode}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="text-sm font-medium">{cls.startTime.substring(0, 5)} - {cls.endTime.substring(0, 5)}</div>
                    <Badge text={cls.roomNumber} color="gray" />
                  </div>
                </div>
              ))}
              {todaysClasses.length === 0 && (
                <EmptyState 
                  title="No classes today" 
                  message="Enjoy your free time or use Copilot to study!" 
                  icon="☕"
                />
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-card p-6 border-b" style={{ border: '1px solid var(--border-default)' }}>
            <h3 className="text-lg font-bold mb-5">Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {isStudent && (
                <button 
                  onClick={() => navigate('/attendance')}
                  style={{ 
                    padding: '1rem', 
                    borderRadius: 'var(--radius-md)', 
                    border: 'none', 
                    backgroundColor: 'var(--primary)', 
                    color: 'white', 
                    fontWeight: 600, 
                    cursor: 'pointer' 
                  }}
                >
                  Scan QR Code
                </button>
              )}
              {isFaculty && (
                <button 
                  onClick={() => navigate('/attendance')}
                  style={{ 
                    padding: '1rem', 
                    borderRadius: 'var(--radius-md)', 
                    border: 'none', 
                    backgroundColor: 'var(--primary)', 
                    color: 'white', 
                    fontWeight: 600, 
                    cursor: 'pointer' 
                  }}
                >
                  Generate QR Code
                </button>
              )}
              <button 
                onClick={() => navigate('/rooms')}
                style={{ 
                  padding: '1rem', 
                  borderRadius: 'var(--radius-md)', 
                  border: '1px solid var(--border-default)', 
                  backgroundColor: 'white', 
                  color: 'var(--text-primary)', 
                  fontWeight: 600, 
                  cursor: 'pointer' 
                }}
              >
                Book a Room
              </button>
              <button 
                onClick={() => navigate('/copilot')}
                style={{ 
                  padding: '1rem', 
                  borderRadius: 'var(--radius-md)', 
                  border: '1px solid var(--border-default)', 
                  backgroundColor: 'white', 
                  color: 'var(--text-primary)', 
                  fontWeight: 600, 
                  cursor: 'pointer' 
                }}
              >
                Ask Copilot
              </button>
            </div>


          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

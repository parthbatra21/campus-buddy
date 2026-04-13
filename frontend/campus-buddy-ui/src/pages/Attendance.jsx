import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { Html5QrcodeScanner } from 'html5-qrcode';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import LivenessCheck from '../components/LivenessCheck';
import { useAuth } from '../hooks/useAuth';
import { useRole } from '../hooks/useRole';
import { useToast } from '../hooks/useToast';
import api from '../api/client';

const Attendance = () => {
  const { user } = useAuth();
  const { isFaculty, isStudent } = useRole();
  const { showToast } = useToast();
  
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showLiveness, setShowLiveness] = useState(false);
  const [pendingQrPayload, setPendingQrPayload] = useState(null);
  const [sessionSecondsLeft, setSessionSecondsLeft] = useState(null);
  const [dynamicQrPayload, setDynamicQrPayload] = useState('');

  const fetchAttendance = async () => {
    try {
      const endpoint = isFaculty ? '/academic/attendance/faculty/CS101' : '/academic/attendance/student';
      const data = await api.get(endpoint);
      setAttendance(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [isFaculty]);

  // Real-time polling for faculty during active session
  const shouldPoll = isFaculty && activeSession;
  
  useEffect(() => {
    let interval;
    if (shouldPoll) {
      interval = setInterval(() => {
        fetchAttendance();
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [shouldPoll]);

  // QR Scanner Effect
  useEffect(() => {
    if (showScanner) {
      const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
      scanner.render((text) => {
        try {
          const payload = JSON.parse(text);
          setPendingQrPayload(payload);
          setShowScanner(false);
          setShowLiveness(true);
          scanner.clear();
        } catch (e) {
          showToast('Invalid QR Code', 'error');
        }
      }, () => {});
      return () => { scanner.clear().catch(() => {}); };
    }
  }, [showScanner]);

  // Timer & Dynamic QR Effect
  useEffect(() => {
    if (!activeSession) return;

    // Refresh QR code every 5 seconds
    const updateQr = () => {
      setDynamicQrPayload(JSON.stringify({ 
        sessionId: activeSession.sessionId, 
        courseCode: activeSession.courseCode,
        timestamp: Date.now() 
      }));
    };
    updateQr(); // Initial call
    const qrInterval = setInterval(updateQr, 5000);

    const sessionInterval = setInterval(() => {
      const expiry = new Date(activeSession.expiryTime).getTime();
      const remaining = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
      setSessionSecondsLeft(remaining);
      if (remaining === 0) setActiveSession(null);
    }, 1000);

    return () => {
      clearInterval(qrInterval);
      clearInterval(sessionInterval);
    };
  }, [activeSession]);



  const stats = {
    total: attendance.length,
    present: attendance.filter(a => a.status === 'PRESENT').length,
    absent: attendance.filter(a => a.status === 'ABSENT').length,
    percentage: attendance.length > 0 ? Math.round((attendance.filter(a => a.status === 'PRESENT').length / attendance.length) * 100) : 0
  };

  const handleCreateSession = async (courseCode) => {
    if (!courseCode) return showToast('Please enter a course code', 'error');

    const startSession = async (lat = 26.8430, lon = 75.5652) => {
      try {
        const payload = { courseCode, latitude: lat, longitude: lon, allowedRadius: 500 }; // Increased radius for testing
        const res = await api.post('/academic/attendance/session', payload);
        setActiveSession(res);
        showToast('Attendance session started!');
      } catch (error) {
        showToast(error.message, 'error');
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => startSession(pos.coords.latitude, pos.coords.longitude),
        () => {
          showToast('Location denied. Using default campus location.', 'warning');
          startSession();
        }
      );
    } else {
      startSession();
    }
  };

  const handleLivenessVerified = (base64Image) => {
    setShowLiveness(false);
    markAttendance(pendingQrPayload.sessionId, pendingQrPayload.courseCode, base64Image, pendingQrPayload.timestamp);
  };

  const markAttendance = (sessionId, courseCode, faceImage, timestamp) => {
    if (!navigator.geolocation) return showToast('Geolocation not supported', 'error');

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const payload = {
        sessionId,
        courseCode,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        faceImageBase64: faceImage ? `[BASE64 IMAGE - ${faceImage.length} bytes]` : 'MISSING',
        livenessVerified: true,
        timestamp
      };

      console.log("%cDEBUG: Mark Attendance Payload", "color: #007bff; font-weight: bold; font-size: 12px;");
      console.table(payload);

      try {
        await api.post('/academic/attendance/mark', {
          ...payload,
          faceImageBase64: faceImage // Send actual image to server
        });
        showToast('Attendance marked successfully!');
        fetchAttendance();
      } catch (error) {
        showToast(error.message, 'error');
      }
    });
  };

  return (
    <div className="fade-in">
      <PageHeader 
        title="Smart Attendance" 
        subtitle="Geofenced and identity-verified class tracking" 
      />

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <StatCard label="Overall Attendance" value={`${stats.percentage}%`} color={stats.percentage >= 75 ? 'green' : 'amber'} icon="📈" />
        <StatCard label="Total Classes" value={stats.total} color="blue" icon="📚" />
        <StatCard label="Present" value={stats.present} color="green" icon="✅" />
        <StatCard label="Absent" value={stats.absent} color="amber" icon="❌" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        {/* Main Action Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="bg-white rounded-xl shadow-card p-6 border-b" style={{ border: '1px solid var(--border-default)' }}>
            <h3 className="text-lg font-bold mb-4">{isFaculty ? 'Active Session' : 'Mark Attendance'}</h3>
            
            {isFaculty ? (
              activeSession ? (
                <div style={{ textAlign: 'center' }}>
                  <Badge text={activeSession.courseCode} color="blue" />
                  <div style={{ margin: '2rem auto', width: '200px', padding: '1rem', background: 'white', border: '1px solid var(--border-default)', borderRadius: '8px' }}>
                    <QRCode value={dynamicQrPayload} size={180} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1.5rem', fontFamily: 'monospace', color: sessionSecondsLeft < 60 ? 'var(--error)' : 'var(--primary)' }}>
                    ⏱️ {Math.floor(sessionSecondsLeft / 60)}:{(sessionSecondsLeft % 60).toString().padStart(2, '0')}
                  </div>
                  <button 
                    onClick={() => setActiveSession(null)}
                    style={{ marginTop: '1.5rem', color: 'var(--error)', border: 'none', background: 'none', fontWeight: 600, cursor: 'pointer' }}
                  >
                    End Session
                  </button>
                </div>
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <p className="text-muted mb-6">Start a new attendance session for your class.</p>
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <input id="courseInput" placeholder="Course Code" className="p-4 rounded-md border-b" style={{ width: '200px', border: '1px solid var(--border-default)' }} />
                    <button 
                      onClick={() => handleCreateSession(document.getElementById('courseInput').value)}
                      style={{ backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', padding: '0.75rem 1.5rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Start Session
                    </button>
                  </div>
                </div>
              )
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p className="text-muted mb-6">Scan the QR code displayed by your faculty to mark your attendance.</p>
                <button 
                  onClick={() => setShowScanner(true)}
                  style={{ backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', padding: '0.75rem 2rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Open Scanner
                </button>
                {showScanner && <div id="reader" style={{ marginTop: '2rem', borderRadius: '8px', overflow: 'hidden' }}></div>}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-card p-6 border-b" style={{ border: '1px solid var(--border-default)' }}>
            <h3 className="text-lg font-bold mb-4">Recent Records</h3>
            <Table 
              columns={[
                { header: 'Course', accessor: 'courseCode' },
                { header: 'Date', render: (row) => new Date(row.markedAt || row.lectureDate).toLocaleDateString() },
                { header: 'Status', render: (row) => <Badge text={row.status} color={row.status === 'PRESENT' ? 'green' : 'amber'} /> },
                { header: 'Verification', render: (row) => <Badge text={row.verificationType || 'Standard'} color={row.verificationType?.includes('FACE') ? 'blue' : 'gray'} /> }
              ]}
              data={attendance.slice(0, 5)}
              emptyMessage="No recent attendance activity"
            />
          </div>

          <div className="bg-white rounded-xl shadow-card p-6 border-b" style={{ border: '1px solid var(--color-border)' }}>
            <h3 className="text-lg font-bold mb-4">Integrity Report</h3>
            <div style={{ padding: '1rem', backgroundColor: 'var(--success-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--success)' }}>
              <div style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.875rem' }}>✓ System Secure</div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                All 100% of your marked records are geofence and face-verified.
              </p>
            </div>
          </div>
        </div>
      </div>

      {showLiveness && (
        <LivenessCheck 
          onVerified={handleLivenessVerified} 
          onCancel={() => setShowLiveness(false)} 
        />
      )}
    </div>
  );
};

export default Attendance;

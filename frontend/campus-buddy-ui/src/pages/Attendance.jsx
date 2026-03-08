import { useState, useEffect } from 'react';
import { academicAPI } from '../services/api';

function Attendance() {
    const [role, setRole] = useState('');
    const [loading, setLoading] = useState(false);

    // Faculty state
    const [courseCode, setCourseCode] = useState('');
    const [facultyCourseCode, setFacultyCourseCode] = useState('');
    const [courseAttendance, setCourseAttendance] = useState([]);

    // Student state
    const [sessionId, setSessionId] = useState('');
    const [studentCourseCode, setStudentCourseCode] = useState('');
    const [studentAttendance, setStudentAttendance] = useState([]);

    // Error and success messages
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const userRole = localStorage.getItem('role');
        setRole(userRole);
        if (userRole === 'STUDENT') {
            fetchStudentAttendance();
        }
    }, []);

    const fetchStudentAttendance = async () => {
        try {
            const response = await academicAPI.getStudentAttendance();
            setStudentAttendance(response.data);
        } catch (err) {
            console.error('Failed to fetch student attendance:', err);
        }
    };

    const handleCreateSession = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        // Geolocation boilerplate (same as dashboard, but simplified for manual test if they want)
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser.");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const payload = {
                    courseCode: courseCode,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    allowedRadius: 100
                };
                const response = await academicAPI.createSession(payload);
                setSuccess(`Session created successfully! ID: ${response.data.sessionId}`);
                setCourseCode('');
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to create session');
            } finally {
                setLoading(false);
            }
        }, () => {
            setError("Location access required.");
            setLoading(false);
        });
    };

    const handleMarkAttendance = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser.");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const response = await academicAPI.markAttendance({
                    sessionCode: sessionId,
                    courseCode: studentCourseCode,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
                setSuccess('Attendance marked successfully!');
                setSessionId('');
                setStudentCourseCode('');
                fetchStudentAttendance();
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to mark attendance');
            } finally {
                setLoading(false);
            }
        }, () => {
            setError("Location access required.");
            setLoading(false);
        });
    };

    const handleViewCourseAttendance = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const response = await academicAPI.getFacultyAttendance(facultyCourseCode);
            setCourseAttendance(response.data);
            setSuccess(`Loaded ${response.data.length} attendance records`);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to fetch course attendance');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
        });
    };

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    return (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <div className="page-header" style={{ marginBottom: '2rem' }}>
                <h1>📝 Academic Records</h1>
                <p>Manage and view comprehensive attendance and grades.</p>
            </div>

            {error && (
                <div style={{ padding: '1rem', background: 'var(--error-bg)', color: 'var(--error)', borderRadius: '12px', marginBottom: '1.5rem', fontWeight: 600, border: '1px solid #fca5a5' }}>
                    <span style={{ marginRight: '0.5rem' }}>⚠️</span> {error}
                </div>
            )}
            {success && (
                <div style={{ padding: '1rem', background: 'var(--success-light)', color: 'var(--success-dark)', borderRadius: '12px', marginBottom: '1.5rem', fontWeight: 600, border: '1px solid #6ee7b7' }}>
                    <span style={{ marginRight: '0.5rem' }}>✅</span> {success}
                </div>
            )}

            {role === 'FACULTY' && (
                <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
                    <div className="dashboard-column">
                        <div className="section-card">
                            <div className="section-header">
                                <h3>📊 View Course Attendance</h3>
                            </div>
                            <form onSubmit={handleViewCourseAttendance} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
                                <input
                                    type="text"
                                    value={facultyCourseCode}
                                    onChange={(e) => setFacultyCourseCode(e.target.value)}
                                    placeholder="Enter Course Code (e.g., CS101)"
                                    className="input-field"
                                    style={{ flex: 1, minWidth: '200px' }}
                                    required
                                />
                                <button type="submit" disabled={loading} className="btn btn-primary">
                                    {loading ? 'Loading...' : 'View Records'}
                                </button>
                            </form>

                            {courseAttendance.length > 0 && (
                                <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                            <thead style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                <tr>
                                                    <th style={{ padding: '1rem 1.5rem', borderBottom: '2px solid #e2e8f0' }}>Student Email</th>
                                                    <th style={{ padding: '1rem 1.5rem', borderBottom: '2px solid #e2e8f0' }}>Course</th>
                                                    <th style={{ padding: '1rem 1.5rem', borderBottom: '2px solid #e2e8f0' }}>Date</th>
                                                    <th style={{ padding: '1rem 1.5rem', borderBottom: '2px solid #e2e8f0' }}>Status</th>
                                                    <th style={{ padding: '1rem 1.5rem', borderBottom: '2px solid #e2e8f0' }}>Marked At</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {courseAttendance.map((record) => (
                                                    <tr key={record.id} style={{ borderBottom: '1px solid #f1f5f9', background: 'white' }}>
                                                        <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{record.studentEmail}</td>
                                                        <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>{record.courseCode}</td>
                                                        <td style={{ padding: '1rem 1.5rem' }}>{formatDate(record.lectureDate)}</td>
                                                        <td style={{ padding: '1rem 1.5rem' }}>
                                                            <span className={`history-status ${record.status.toLowerCase()}`}>{record.status}</span>
                                                        </td>
                                                        <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{formatDateTime(record.markedAt)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="section-card">
                            <div className="section-header">
                                <h3>🚀 Quick Generate Session</h3>
                            </div>
                            <form onSubmit={handleCreateSession} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <input
                                    type="text"
                                    value={courseCode}
                                    onChange={(e) => setCourseCode(e.target.value)}
                                    placeholder="Enter Course Code (e.g., CS101)"
                                    className="input-field"
                                    style={{ flex: 1, minWidth: '200px' }}
                                    required
                                />
                                <button type="submit" disabled={loading} className="btn" style={{ background: 'white', color: 'var(--primary)', border: '1px solid #c7d2fe' }}>
                                    {loading ? 'Creating...' : 'Create Session'}
                                </button>
                            </form>
                            <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Use the Overview tab for an interactive QR code display.</p>
                        </div>
                    </div>
                </div>
            )}

            {role === 'STUDENT' && (
                <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
                    <div className="dashboard-column">
                        <div className="section-card">
                            <div className="section-header">
                                <h3>📚 My Attendance History</h3>
                            </div>
                            {studentAttendance.length > 0 ? (
                                <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                            <thead style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                <tr>
                                                    <th style={{ padding: '1rem 1.5rem', borderBottom: '2px solid #e2e8f0' }}>Course</th>
                                                    <th style={{ padding: '1rem 1.5rem', borderBottom: '2px solid #e2e8f0' }}>Date</th>
                                                    <th style={{ padding: '1rem 1.5rem', borderBottom: '2px solid #e2e8f0' }}>Status</th>
                                                    <th style={{ padding: '1rem 1.5rem', borderBottom: '2px solid #e2e8f0' }}>Marked At</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {studentAttendance.map((record) => (
                                                    <tr key={record.id} style={{ borderBottom: '1px solid #f1f5f9', background: 'white', transition: 'background 0.2s' }}>
                                                        <td style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>{record.courseCode}</td>
                                                        <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>{formatDate(record.lectureDate)}</td>
                                                        <td style={{ padding: '1rem 1.5rem' }}>
                                                            <span className={`history-status ${record.status.toLowerCase()}`}>{record.status}</span>
                                                        </td>
                                                        <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{formatDateTime(record.markedAt)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <p className="empty-state" style={{ margin: 0 }}>No attendance records found yet.</p>
                            )}
                        </div>

                        <div className="section-card" style={{ background: 'linear-gradient(135deg, rgba(238,242,255,0.5) 0%, rgba(224,231,255,0.5) 100%)' }}>
                            <div className="section-header">
                                <h3>📝 Manual Code Entry</h3>
                            </div>
                            <form onSubmit={handleMarkAttendance} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <input
                                    type="text"
                                    value={sessionId}
                                    onChange={(e) => setSessionId(e.target.value)}
                                    placeholder="6-Digit Session Code"
                                    className="input-field"
                                    maxLength="6"
                                    style={{ width: '180px', letterSpacing: '0.1em', textAlign: 'center', fontWeight: 'bold' }}
                                    required
                                />
                                <input
                                    type="text"
                                    value={studentCourseCode}
                                    onChange={(e) => setStudentCourseCode(e.target.value)}
                                    placeholder="Course Code"
                                    className="input-field"
                                    style={{ flex: 1, minWidth: '150px' }}
                                    required
                                />
                                <button type="submit" disabled={loading} className="btn btn-primary">
                                    {loading ? 'Marking...' : 'Mark Attendance'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Attendance;

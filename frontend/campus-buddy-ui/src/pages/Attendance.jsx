import { useState, useEffect } from 'react';
import { academicAPI } from '../services/api';
import './Attendance.css';

function Attendance() {
    const [role, setRole] = useState('');
    const [loading, setLoading] = useState(false);

    // Faculty state
    const [courseCode, setCourseCode] = useState('');
    const [sessionResponse, setSessionResponse] = useState(null);
    const [facultyCourseCode, setFacultyCourseCode] = useState('');
    const [courseAttendance, setCourseAttendance] = useState([]);

    // Student state
    const [sessionId, setSessionId] = useState('');
    const [studentCourseCode, setStudentCourseCode] = useState('');
    const [markResponse, setMarkResponse] = useState(null);
    const [studentAttendance, setStudentAttendance] = useState([]);

    // Error and success messages
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const userRole = localStorage.getItem('role');
        setRole(userRole);

        // Auto-load attendance on mount
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

        try {
            const response = await academicAPI.createSession(courseCode);
            setSessionResponse(response.data);
            setSuccess(`Session created successfully! Session ID: ${response.data.sessionId}`);
            setCourseCode('');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create session');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAttendance = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const response = await academicAPI.markAttendance(sessionId, studentCourseCode);
            setMarkResponse(response.data);
            setSuccess('Attendance marked successfully!');
            setSessionId('');
            setStudentCourseCode('');

            // Refresh student attendance list
            fetchStudentAttendance();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to mark attendance');
        } finally {
            setLoading(false);
        }
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
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="attendance-container">
            <div className="attendance-header">
                <h1>📋 Attendance Management</h1>
                <a href="/dashboard" className="back-link">← Back to Dashboard</a>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            {role === 'FACULTY' && (
                <div className="faculty-section">
                    {/* Session Generation */}
                    <div className="card">
                        <h2>Generate Attendance Session</h2>
                        <form onSubmit={handleCreateSession}>
                            <div className="form-group">
                                <label htmlFor="courseCode">Course Code</label>
                                <input
                                    id="courseCode"
                                    type="text"
                                    value={courseCode}
                                    onChange={(e) => setCourseCode(e.target.value)}
                                    placeholder="e.g., CS101"
                                    required
                                />
                            </div>
                            <button type="submit" disabled={loading} className="btn-primary">
                                {loading ? 'Generating...' : 'Generate Session'}
                            </button>
                        </form>

                        {sessionResponse && (
                            <div className="session-result">
                                <h3>✅ Session Created</h3>
                                <div className="session-info">
                                    <p><strong>Session ID:</strong> <code>{sessionResponse.sessionId}</code></p>
                                    <p><strong>Course:</strong> {sessionResponse.courseCode}</p>
                                    <p><strong>Expires:</strong> {formatDateTime(sessionResponse.expiryTime)}</p>
                                    <p className="qr-placeholder">📱 QR Code Display (Coming Soon)</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* View Course Attendance */}
                    <div className="card">
                        <h2>View Course Attendance</h2>
                        <form onSubmit={handleViewCourseAttendance}>
                            <div className="form-group">
                                <label htmlFor="facultyCourseCode">Course Code</label>
                                <input
                                    id="facultyCourseCode"
                                    type="text"
                                    value={facultyCourseCode}
                                    onChange={(e) => setFacultyCourseCode(e.target.value)}
                                    placeholder="e.g., CS101"
                                    required
                                />
                            </div>
                            <button type="submit" disabled={loading} className="btn-secondary">
                                {loading ? 'Loading...' : 'View Attendance'}
                            </button>
                        </form>

                        {courseAttendance.length > 0 && (
                            <div className="attendance-table-wrapper">
                                <h3>Course Attendance Records</h3>
                                <table className="attendance-table">
                                    <thead>
                                        <tr>
                                            <th>Student Email</th>
                                            <th>Course</th>
                                            <th>Date</th>
                                            <th>Status</th>
                                            <th>Marked At</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {courseAttendance.map((record) => (
                                            <tr key={record.id}>
                                                <td>{record.studentEmail}</td>
                                                <td>{record.courseCode}</td>
                                                <td>{formatDate(record.lectureDate)}</td>
                                                <td>
                                                    <span className="status-badge">{record.status}</span>
                                                </td>
                                                <td>{formatDateTime(record.markedAt)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {role === 'STUDENT' && (
                <div className="student-section">
                    {/* Mark Attendance */}
                    <div className="card">
                        <h2>Mark Attendance</h2>
                        <form onSubmit={handleMarkAttendance}>
                            <div className="form-group">
                                <label htmlFor="sessionId">Session ID</label>
                                <input
                                    id="sessionId"
                                    type="text"
                                    value={sessionId}
                                    onChange={(e) => setSessionId(e.target.value)}
                                    placeholder="Enter session ID from QR/faculty"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="studentCourseCode">Course Code</label>
                                <input
                                    id="studentCourseCode"
                                    type="text"
                                    value={studentCourseCode}
                                    onChange={(e) => setStudentCourseCode(e.target.value)}
                                    placeholder="e.g., CS101"
                                    required
                                />
                            </div>
                            <button type="submit" disabled={loading} className="btn-primary">
                                {loading ? 'Marking...' : 'Mark Attendance'}
                            </button>
                        </form>
                    </div>

                    {/* View Own Attendance */}
                    <div className="card">
                        <h2>My Attendance History</h2>
                        {studentAttendance.length > 0 ? (
                            <div className="attendance-table-wrapper">
                                <table className="attendance-table">
                                    <thead>
                                        <tr>
                                            <th>Course</th>
                                            <th>Date</th>
                                            <th>Status</th>
                                            <th>Marked At</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {studentAttendance.map((record) => (
                                            <tr key={record.id}>
                                                <td>{record.courseCode}</td>
                                                <td>{formatDate(record.lectureDate)}</td>
                                                <td>
                                                    <span className="status-badge">{record.status}</span>
                                                </td>
                                                <td>{formatDateTime(record.markedAt)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="no-data">No attendance records found.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Attendance;

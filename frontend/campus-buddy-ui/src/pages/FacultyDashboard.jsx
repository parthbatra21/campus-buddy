import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { academicAPI } from '../services/api';
import NoticeBoard from '../components/NoticeBoard';
import ChangePasswordModal from '../components/ChangePasswordModal';
import './Dashboard.css';

function FacultyDashboard({ user, handleLogout }) {
    const [timetable, setTimetable] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [activeSession, setActiveSession] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    useEffect(() => {
        // Fetch timetable to get list of courses the faculty teaches
        // For MVP, we might settle for a manual input or a mock list if timetable is empty
        fetchTimetable();
    }, []);

    const fetchTimetable = async () => {
        try {
            const response = await academicAPI.getTimetable();
            // Filter only courses this faculty teaches (backend should handle this filter ideally, 
            // but for now we filter or just show all unique courses)
            setTimetable(response.data);
        } catch (error) {
            console.error("Failed to fetch timetable", error);
        }
    };

    const handleCreateSession = async () => {
        if (!selectedCourse) return;
        setLoading(true);

        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const payload = {
                    courseCode: selectedCourse,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    allowedRadius: 100 // Default 100m
                };

                const response = await academicAPI.createSession(payload);
                setActiveSession({
                    ...response.data,
                    payload: JSON.stringify({
                        sessionId: response.data.sessionId,
                        courseCode: response.data.courseCode
                    })
                });
            } catch (error) {
                console.error("Failed to create session", error);
                alert("Failed to create attendance session: " + (error.response?.data?.error || error.message));
            } finally {
                setLoading(false);
            }
        }, (error) => {
            console.error("Geolocation error", error);
            alert("Location access is required to create a session. Please enable location.");
            setLoading(false);
        });
    };

    // Extract unique courses from timetable for the dropdown
    const uniqueCourses = [...new Set(timetable.map(t => t.courseCode))];

    return (
        <div className="dashboard-container">
            {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}

            <div className="dashboard-card">
                <div className="dashboard-header">
                    <div>
                        <h1>🎓 Faculty Dashboard</h1>
                        <p style={{ color: '#64748b', margin: 0 }}>Welcome, <strong>{user.email}</strong></p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <button onClick={() => setShowPasswordModal(true)} className="action-btn secondary small">
                            🔐 Change Password
                        </button>
                        <button onClick={handleLogout} className="logout-btn">
                            🚪 Logout
                        </button>
                    </div>
                </div>

                {/* Create Session */}
                <div className="action-section">
                    <h3>🚀 Start Attendance Session</h3>
                    <div className="control-group">
                        <select
                            value={selectedCourse}
                            onChange={(e) => setSelectedCourse(e.target.value)}
                            className="course-select"
                        >
                            <option value="">Select Course...</option>
                            {uniqueCourses.map(code => (
                                <option key={code} value={code}>{code}</option>
                            ))}
                            {/* Fallback for testing if no timetable exists */}
                            <option value="CS101">CS101 - Intro to CS</option>
                            <option value="CS102">CS102 - Data Structures</option>
                        </select>
                        <button
                            className="action-btn primary"
                            onClick={handleCreateSession}
                            disabled={!selectedCourse || loading}
                        >
                            {loading ? "Generating..." : "Generate QR Code"}
                        </button>
                    </div>

                    {activeSession && (
                        <div className="qr-section">
                            <div className="qr-card">
                                <h4>Scan to Mark Attendance</h4>
                                <p className="course-badge">{activeSession.courseCode}</p>
                                <div className="qr-wrapper">
                                    <QRCode value={activeSession.payload} size={250} />
                                </div>
                                <div className="session-code-display">
                                    <p>Or enter code:</p>
                                    <h2 className="code-text">{activeSession.sessionCode}</h2>
                                </div>
                                <p className="expiry-info">Session expires at: {new Date(activeSession.expiryTime).toLocaleTimeString()}</p>
                                <button className="close-btn" onClick={() => setActiveSession(null)}>End Session</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Timetable View */}
                <div className="timetable-section">
                    <h3>📅 Your Schedule</h3>
                    {timetable.length === 0 ? (
                        <p className="empty-state">No classes scheduled yet.</p>
                    ) : (
                        <div className="timetable-grid">
                            {timetable.map((cls) => (
                                <div key={cls.id} className="timetable-item">
                                    <span className="time">{cls.startTime.substring(0, 5)} - {cls.endTime.substring(0, 5)}</span>
                                    <span className="course">{cls.courseName} ({cls.courseCode})</span>
                                    <span className="room">📍 {cls.roomNumber}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Notice Board */}
                <NoticeBoard role="FACULTY" />
            </div>
        </div>
    );
}

export default FacultyDashboard;

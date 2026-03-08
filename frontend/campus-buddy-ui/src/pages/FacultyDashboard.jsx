import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { academicAPI } from '../services/api';
import NoticeBoard from '../components/NoticeBoard';
import MainLayout from '../components/layout/MainLayout';
import FacilityBooking from '../components/FacilityBooking';
import Attendance from './Attendance';
import './Dashboard.css';

function FacultyDashboard({ user, handleLogout }) {
    const [timetable, setTimetable] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [activeSession, setActiveSession] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const [activeTab, setActiveTab] = useState('dashboard');
    

    useEffect(() => {
        fetchTimetable();
    }, []);

    const fetchTimetable = async () => {
        try {
            const response = await academicAPI.getTimetable();
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
                    allowedRadius: 100
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

    const uniqueCourses = [...new Set(timetable.map(t => t.courseCode))];

        return (
        <MainLayout 
            user={user} 
            handleLogout={handleLogout} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
        >
            {activeTab === 'dashboard' ? (
                <>
                    <div className="page-header">
                        <h1>Welcome back, Professor 👋</h1>
                        <p>Here's what's happening today on campus.</p>
                    </div>

                    {/* Two Column Grid */}
                    <div className="dashboard-grid">

                        {/* Left Column (Wider) */}
                        <div className="dashboard-column">
                            <div className="section-card">
                                <div className="section-header">
                                    <h3><span style={{ fontSize: '1.75rem' }}>🚀</span> Start Attendance Session</h3>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
                                    <select
                                        value={selectedCourse}
                                        onChange={(e) => setSelectedCourse(e.target.value)}
                                        className="input-field"
                                        style={{ flex: 1, minWidth: '200px' }}
                                    >
                                        <option value="">Select Course...</option>
                                        {uniqueCourses.map(code => (
                                            <option key={code} value={code}>{code}</option>
                                        ))}
                                        {/* Fallbacks if empty */}
                                        <option value="CS101">CS101 - Intro to CS</option>
                                        <option value="CS102">CS102 - Data Structures</option>
                                    </select>
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleCreateSession}
                                        disabled={!selectedCourse || loading}
                                    >
                                        {loading ? "Generating..." : "Generate QR Code"}
                                    </button>
                                </div>

                                {activeSession && (
                                    <div className="qr-display-card fade-in">
                                        <h4 style={{ margin: '0 0 1rem', fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 800 }}>Scan to Mark Attendance</h4>
                                        <p style={{ display: 'inline-block', background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)', color: 'white', padding: '0.35rem 1.25rem', borderRadius: '20px', fontWeight: 700, margin: '0 0 1.5rem', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)' }}>
                                            {activeSession.courseCode}
                                        </p>
                                        <div style={{ background: 'white', padding: '1.5rem', display: 'inline-block', borderRadius: '20px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', border: '1px solid var(--border-color)' }}>
                                            <QRCode value={activeSession.payload} size={260} />
                                        </div>
                                        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <p style={{ color: 'var(--text-secondary)', margin: '0 0 0.5rem', fontWeight: 600 }}>Or students can manually enter code:</p>
                                            <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem 2rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                                                <h2 style={{ fontSize: '3rem', letterSpacing: '0.3em', margin: 0, color: 'var(--text-primary)', fontWeight: 900 }}>{activeSession.sessionCode}</h2>
                                            </div>
                                        </div>
                                        <p style={{ color: 'var(--error)', fontSize: '0.9rem', marginTop: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span>⏱️</span> Expires at: {new Date(activeSession.expiryTime).toLocaleTimeString()}
                                        </p>
                                        <button className="btn btn-primary" style={{ marginTop: '2rem', background: 'white', color: 'var(--error)', border: '1px solid #fca5a5' }} onClick={() => setActiveSession(null)}>End Session</button>
                                    </div>
                                )}
                            </div>

                            <div className="section-card">
                                <div className="section-header">
                                    <h3><span style={{ fontSize: '1.75rem' }}>📅</span> Your Schedule</h3>
                                </div>
                                {timetable.length === 0 ? (
                                    <p className="empty-state">No classes scheduled yet.</p>
                                ) : (
                                    <div className="timetable-list">
                                        {timetable.map((cls) => (
                                            <div key={cls.id} className="timetable-item">
                                                <div className="course-info">
                                                    <span className="course-name">{cls.courseName}</span>
                                                    <span className="course-meta">{cls.courseCode} • Room {cls.roomNumber}</span>
                                                </div>
                                                <div className="time-block">
                                                    <span className="time-range">{cls.startTime.substring(0, 5)} - {cls.endTime.substring(0, 5)}</span>
                                                    <span className="time-day">{cls.dayOfWeek}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column (Narrower) */}
                        <div className="dashboard-column">
                            <NoticeBoard role="FACULTY" />
                        </div>
                    </div>
                </>
            ) : activeTab === 'facilities' ? (
                <div className="fade-in">
                    <FacilityBooking />
                </div>
            ) : (
                <div className="fade-in">
                    <Attendance />
                </div>
            )}
        </MainLayout>
    );
}

export default FacultyDashboard;

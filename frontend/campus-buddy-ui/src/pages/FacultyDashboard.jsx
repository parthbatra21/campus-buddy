import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { academicAPI } from '../services/api';
import NoticeBoard from '../components/NoticeBoard';
import ChangePasswordModal from '../components/ChangePasswordModal';
import FacilityBooking from '../components/FacilityBooking';
import Attendance from './Attendance';
import './Dashboard.css';

function FacultyDashboard({ user, handleLogout }) {
    const [timetable, setTimetable] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [activeSession, setActiveSession] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
        <div className="dashboard-wrapper">
            {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}

            {/* Mobile Topbar */}
            <div className="mobile-topbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>🎓</span>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Campus Buddy</h2>
                </div>
                <button
                    className="btn btn-primary"
                    style={{ padding: '0.5rem' }}
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                    ☰
                </button>
            </div>

            {/* Sidebar Navigation */}
            <aside className={`dashboard-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    <span style={{ fontSize: '2rem' }}>🎓</span>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a', fontWeight: 800 }}>Campus Buddy</h2>
                </div>

                <nav className="sidebar-nav">
                    <button
                        className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
                    >
                        <span className="nav-icon">📊</span> Overview
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'facilities' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('facilities'); setIsSidebarOpen(false); }}
                    >
                        <span className="nav-icon">🏢</span> Facility Booking
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'academics' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('academics'); setIsSidebarOpen(false); }}
                    >
                        <span className="nav-icon">📝</span> Academics
                    </button>
                </nav>

                <div className="sidebar-footer">
                    <div style={{ marginBottom: '1rem', padding: '0 0.5rem' }}>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Logged in as</p>
                        <p style={{ margin: 0, fontSize: '0.95rem', color: '#0f172a', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</p>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#4f46e5', fontWeight: 800, background: '#eef2ff', display: 'inline-block', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>FACULTY</p>
                    </div>

                    <button onClick={() => setShowPasswordModal(true)} className="nav-item">
                        <span className="nav-icon">🔐</span> Settings
                    </button>
                    <button onClick={handleLogout} className="nav-item danger">
                        <span className="nav-icon">🚪</span> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="dashboard-main" onClick={() => isSidebarOpen && setIsSidebarOpen(false)}>

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
                                        <div className="qr-display-card">
                                            <h4 style={{ margin: '0 0 1rem', fontSize: '1.25rem', color: '#0f172a', fontWeight: 800 }}>Scan to Mark Attendance</h4>
                                            <p style={{ display: 'inline-block', background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)', color: 'white', padding: '0.35rem 1.25rem', borderRadius: '20px', fontWeight: 700, margin: '0 0 1.5rem', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)' }}>
                                                {activeSession.courseCode}
                                            </p>
                                            <div style={{ background: 'white', padding: '1.5rem', display: 'inline-block', borderRadius: '20px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', border: '1px solid #f1f5f9' }}>
                                                <QRCode value={activeSession.payload} size={260} />
                                            </div>
                                            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <p style={{ color: '#64748b', margin: '0 0 0.5rem', fontWeight: 600 }}>Or students can manually enter code:</p>
                                                <div style={{ background: '#f8fafc', padding: '0.75rem 2rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                                    <h2 style={{ fontSize: '3rem', letterSpacing: '0.3em', margin: 0, color: '#0f172a', fontWeight: 900 }}>{activeSession.sessionCode}</h2>
                                                </div>
                                            </div>
                                            <p style={{ color: '#ef4444', fontSize: '0.9rem', marginTop: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span>⏱️</span> Expires at: {new Date(activeSession.expiryTime).toLocaleTimeString()}
                                            </p>
                                            <button className="btn btn-primary" style={{ marginTop: '2rem', background: 'white', color: '#dc2626', border: '1px solid #fca5a5' }} onClick={() => setActiveSession(null)}>End Session</button>
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
                    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                        <FacilityBooking />
                    </div>
                ) : (
                    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                        <Attendance />
                    </div>
                )}
            </main>
        </div>
    );
}

export default FacultyDashboard;

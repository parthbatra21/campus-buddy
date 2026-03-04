import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { academicAPI } from '../services/api';
import NoticeBoard from '../components/NoticeBoard';
import ChangePasswordModal from '../components/ChangePasswordModal';
import FacilityBooking from '../components/FacilityBooking';
import './Dashboard.css';

function StudentDashboard({ user, handleLogout }) {
    const [timetable, setTimetable] = useState([]);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [scanResult, setScanResult] = useState(null);
    const [showScanner, setShowScanner] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (showScanner) {
            const scanner = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                /* verbose= */ false
            );

            scanner.render(onScanSuccess, onScanFailure);

            return () => {
                scanner.clear().catch(error => console.error("Failed to clear scanner", error));
            };
        }
    }, [showScanner]);

    const fetchData = async () => {
        try {
            const [timetableRes, attendanceRes] = await Promise.all([
                academicAPI.getTimetable(),
                academicAPI.getStudentAttendance()
            ]);
            setTimetable(timetableRes.data);
            setAttendanceHistory(attendanceRes.data);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    const onScanSuccess = async (decodedText, decodedResult) => {
        setShowScanner(false);

        if (!navigator.geolocation) {
            setScanResult({ error: "Geolocation is not supported." });
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                let payload;
                try {
                    payload = JSON.parse(decodedText);
                } catch (e) {
                    setScanResult({ error: "Invalid QR code format" });
                    return;
                }

                const payloadObj = {
                    sessionId: payload.sessionId,
                    courseCode: payload.courseCode,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };

                const response = await academicAPI.markAttendance(payloadObj);
                setScanResult({ success: "Attendance marked successfully!", data: response.data });
                fetchData();
            } catch (error) {
                setScanResult({ error: error.response?.data?.error || "Failed to mark attendance" });
            }
        }, (error) => {
            setScanResult({ error: "Location access required to mark attendance." });
        });
    };

    const onScanFailure = (error) => {
        // console.warn(`Code scan error = ${error}`);
    };

    // calculate attendance percentage
    const totalClasses = attendanceHistory.length;
    const presentClasses = attendanceHistory.filter(r => r.status === 'PRESENT').length;
    const attendancePercentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;

    // Calculate Next Class
    const getNextClass = () => {
        const now = new Date();
        const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        const today = days[now.getDay()];
        const currentTime = now.toTimeString().split(' ')[0]; // HH:mm:ss

        // Filter for today's classes that haven't started yet
        // Assuming timetable is sorted by time
        const upcoming = timetable.find(t => t.dayOfWeek === today && t.startTime > currentTime);

        if (upcoming) {
            return {
                code: upcoming.courseCode,
                time: upcoming.startTime.substring(0, 5),
                room: upcoming.roomNumber
            };
        }
        return null;
    };

    const nextClass = getNextClass();

    return (
        <div className="dashboard-container">
            {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}

            {/* Header */}
            <div className="dashboard-header">
                <div>
                    <h1>🎓 Campus Buddy</h1>
                    <p style={{ color: '#64748b', margin: 0 }}>Welcome back, {user.email.split('@')[0]}</p>
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

            {/* Stats Overview */}
            <div className="stats-overview">
                <div className="stat-card">
                    <div className="stat-header">
                        <span className="stat-title">Attendance</span>
                        <div className="stat-icon" style={{ color: '#4f46e5' }}>📊</div>
                    </div>
                    <p className="stat-value">{attendancePercentage}%</p>
                    <p className="stat-desc">
                        <span className={`stat-trend ${attendancePercentage >= 75 ? 'positive' : 'negative'}`}>
                            {attendancePercentage >= 75 ? 'Good Standing' : 'Needs Improvement'}
                        </span>
                    </p>
                </div>
                <div className="stat-card">
                    <div className="stat-header">
                        <span className="stat-title">Next Class</span>
                        <div className="stat-icon" style={{ color: '#ec4899' }}>🕒</div>
                    </div>
                    {nextClass ? (
                        <>
                            <p className="stat-value" style={{ fontSize: '1.5rem' }}>{nextClass.code}</p>
                            <p className="stat-desc">at {nextClass.time} • Room {nextClass.room}</p>
                        </>
                    ) : (
                        <>
                            <p className="stat-value" style={{ fontSize: '1.2rem', color: '#64748b' }}>Done for today</p>
                            <p className="stat-desc">Relax! ☕</p>
                        </>
                    )}
                </div>
                <div className="stat-card">
                    <div className="stat-header">
                        <span className="stat-title">Assignments</span>
                        <div className="stat-icon" style={{ color: '#f59e0b' }}>📝</div>
                    </div>
                    <p className="stat-value">3</p>
                    <p className="stat-desc">1 Due Tomorrow</p>
                </div>
                <div className="stat-card">
                    <div className="stat-header">
                        <span className="stat-title">CGPA</span>
                        <div className="stat-icon" style={{ color: '#10b981' }}>🎓</div>
                    </div>
                    <p className="stat-value">8.9</p>
                    <p className="stat-desc">Last Semester</p>
                </div>
            </div>

            <div className="dashboard-content">
                {/* Navigation Tabs (Mobile friendly) */}
                <div style={{ padding: '0 1rem', marginBottom: '1rem' }} className="sm:hidden">
                    <div className="flex gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
                        <button
                            className={`whitespace-nowrap px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            onClick={() => setActiveTab('dashboard')}
                        >
                            Overview
                        </button>
                        <button
                            className={`whitespace-nowrap px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'facilities' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            onClick={() => setActiveTab('facilities')}
                        >
                            Facility Booking
                        </button>
                    </div>
                </div>

                {activeTab === 'dashboard' ? (
                    <>
                        {/* Left Panel: Main Content */}
                        <div className="left-panel w-full lg:w-2/3">

                            {/* Quick Actions */}
                            <div className="section-card">
                                <div className="section-header flex justify-between items-center">
                                    <h3>⚡ Quick Actions</h3>
                                    {/* Desktop Tabs injected here for better UI flow */}
                                    <div className="hidden sm:flex gap-2">
                                        <button
                                            className={`px-3 py-1.5 text-sm font-medium rounded-md ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                            onClick={() => setActiveTab('dashboard')}
                                        >
                                            Overview
                                        </button>
                                        <button
                                            className={`px-3 py-1.5 text-sm font-medium rounded-md ${activeTab === 'facilities' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                            onClick={() => setActiveTab('facilities')}
                                        >
                                            Facility Booking
                                        </button>
                                    </div>
                                </div>
                                <div className="quick-actions-grid">
                                    <button
                                        className="action-card-btn"
                                        onClick={() => {
                                            setShowScanner(!showScanner);
                                            setScanResult(null);
                                        }}
                                    >
                                        <span className="action-icon">📷</span>
                                        <span className="action-label">{showScanner ? "Close Scanner" : "Scan QR"}</span>
                                    </button>
                                    <button className="action-card-btn">
                                        <span className="action-icon">📅</span>
                                        <span className="action-label">View Timetable</span>
                                    </button>
                                    <button className="action-card-btn" onClick={() => setActiveTab('facilities')}>
                                        <span className="action-icon">🏢</span>
                                        <span className="action-label">Book Facility</span>
                                    </button>
                                </div>

                                {/* Scanner Area */}
                                {showScanner && (
                                    <div style={{ marginTop: '2rem' }}>
                                        <div id="reader" className="qr-reader"></div>
                                    </div>
                                )}

                                {scanResult && (
                                    <div className={`scan-result ${scanResult.success ? 'success' : 'error'}`} style={{ marginTop: '1rem' }}>
                                        {scanResult.success || scanResult.error}
                                    </div>
                                )}

                                {/* Manual Entry Fallback */}
                                <div className="manual-entry-section">
                                    <h4>Or Enter Session Code</h4>
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            placeholder="CODE"
                                            maxLength="6"
                                            id="manual-code-input"
                                            className="code-input"
                                        />
                                        <select id="manual-course-select" className="course-select-small">
                                            <option value="">Select Course</option>
                                            {timetable.length > 0 ?
                                                [...new Set(timetable.map(t => t.courseCode))].map(c => <option key={c} value={c}>{c}</option>)
                                                : <option value="CS101">CS101</option> // Fallback
                                            }
                                        </select>
                                        <button className="action-btn primary" onClick={async () => {
                                            const code = document.getElementById('manual-code-input').value;
                                            const course = document.getElementById('manual-course-select').value;

                                            if (!code || !course) {
                                                alert("Please enter both code and course.");
                                                return;
                                            }

                                            if (!navigator.geolocation) {
                                                alert("Geolocation is not supported.");
                                                return;
                                            }

                                            navigator.geolocation.getCurrentPosition(async (position) => {
                                                try {
                                                    const response = await academicAPI.markAttendance({
                                                        sessionCode: code,
                                                        courseCode: course,
                                                        latitude: position.coords.latitude,
                                                        longitude: position.coords.longitude
                                                    });
                                                    alert("Attendance Marked Successfully!");
                                                    fetchData();
                                                } catch (e) {
                                                    alert(e.response?.data?.error || "Failed to mark attendance");
                                                }
                                            }, (error) => {
                                                alert("Location access required to mark attendance.");
                                            });
                                        }}>Submit</button>
                                    </div>
                                </div>
                            </div>

                            {/* Today's Schedule */}
                            <div className="section-card">
                                <div className="section-header">
                                    <h3>📅 Today's Schedule</h3>
                                </div>
                                {timetable.length === 0 ? (
                                    <p className="empty-state">No classes scheduled today.</p>
                                ) : (
                                    <div className="timetable-grid">
                                        {timetable.map((cls) => (
                                            <div key={cls.id} className="timetable-item">
                                                <div>
                                                    <span style={{ fontWeight: 700, display: 'block', fontSize: '1.1rem' }}>{cls.courseName}</span>
                                                    <span style={{ color: '#64748b', fontSize: '0.9rem' }}>{cls.courseCode} • {cls.roomNumber}</span>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <span className="time" style={{ display: 'block', fontWeight: 600, color: '#4f46e5' }}>
                                                        {cls.startTime?.substring(0, 5)} - {cls.endTime?.substring(0, 5)}
                                                    </span>
                                                    <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>
                                                        {cls.dayOfWeek}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Panel: Sidebar */}
                        <div className="right-panel w-full lg:w-1/3">
                            <NoticeBoard role={user.role} />

                            {/* Recent History Mini-Widget */}
                            <div className="section-card hidden lg:block">
                                <div className="section-header">
                                    <h3>✅ Recent History</h3>
                                </div>
                                <ul className="history-list">
                                    {attendanceHistory.slice(0, 5).map((record) => (
                                        <li key={record.id} className="history-item">
                                            <span>{record.courseCode}</span>
                                            <span className={`status ${record.status.toLowerCase()}`}>{record.status}</span>
                                        </li>
                                    ))}
                                    {attendanceHistory.length === 0 && <p className="empty-state">No records found.</p>}
                                </ul>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="w-full">
                        {/* Tab header for desktop when in facilities view */}
                        <div className="hidden sm:flex gap-2 mb-4 pl-4 pt-2">
                            <button
                                className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm'}`}
                                onClick={() => setActiveTab('dashboard')}
                            >
                                ← Back to Dashboard
                            </button>
                        </div>
                        <FacilityBooking />
                    </div>
                )}
            </div>
        </div>
    );
}

export default StudentDashboard;

import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { academicAPI } from '../services/api';
import NoticeBoard from '../components/NoticeBoard';
import MainLayout from '../components/layout/MainLayout';
import FacilityBooking from '../components/FacilityBooking';
import Attendance from './Attendance';
import './Dashboard.css';

function StudentDashboard({ user, handleLogout }) {
    const [timetable, setTimetable] = useState([]);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [scanResult, setScanResult] = useState(null);
    const [showScanner, setShowScanner] = useState(false);
    const [loading, setLoading] = useState(true);

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

    // Calculate generic stats
    const totalClasses = attendanceHistory.length;
    const presentClasses = attendanceHistory.filter(r => r.status === 'PRESENT').length;
    const attendancePercentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;

    const getNextClass = () => {
        const now = new Date();
        const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        const today = days[now.getDay()];
        const currentTime = now.toTimeString().split(' ')[0];
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
        <MainLayout
            user={user}
            handleLogout={handleLogout}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
        >
            {activeTab === 'dashboard' ? (
                <>
                    <div className="page-header">
                        <h1>Welcome back, {user.email.split('@')[0]} 👋</h1>
                        <p>Here's what's happening today on campus.</p>
                    </div>

                    {/* Stats Widgets */}
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
                                    <p className="stat-value">{nextClass.code}</p>
                                    <p className="stat-desc">at {nextClass.time} • Room {nextClass.room}</p>
                                </>
                            ) : (
                                <>
                                    <p className="stat-value" style={{ fontSize: '1.75rem', color: '#64748b' }}>Done for today</p>
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

                    {/* Two Column Grid */}
                    <div className="dashboard-grid">

                        {/* Left Column (Wider) */}
                        <div className="dashboard-column">
                            <div className="section-card">
                                <div className="section-header">
                                    <h3><span style={{ fontSize: '1.75rem' }}>⚡</span> Quick Actions</h3>
                                </div>
                                <div className="quick-actions-btns">
                                    <button className="action-card-btn" onClick={() => { setShowScanner(!showScanner); setScanResult(null); }}>
                                        <span className="action-icon">📷</span>
                                        <span className="action-label">{showScanner ? "Close Scanner" : "Scan QR"}</span>
                                    </button>
                                    <button className="action-card-btn" onClick={() => setActiveTab('facilities')}>
                                        <span className="action-icon">🏢</span>
                                        <span className="action-label">Book a Room</span>
                                    </button>
                                </div>

                                {showScanner && (
                                    <div style={{ marginTop: '2rem' }}>
                                        <div id="reader" style={{ border: '2px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden' }}></div>
                                    </div>
                                )}

                                {scanResult && (
                                    <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '12px', fontWeight: 600, background: scanResult.success ? 'var(--success-light)' : 'var(--error-bg)', color: scanResult.success ? 'var(--success-dark)' : '#b91c1c' }}>
                                        {scanResult.success || scanResult.error}
                                    </div>
                                )}

                                <div style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px dashed var(--border-color)' }}>
                                    <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)' }}>Or Enter Session Code Manually</h4>
                                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                        <input type="text" placeholder="6-DIGIT CODE" maxLength="6" id="manual-code-input" className="input-field" style={{ width: '150px', letterSpacing: '0.1em', textAlign: 'center', fontWeight: 'bold' }} />
                                        <select id="manual-course-select" className="input-field" style={{ flex: 1, minWidth: '150px' }}>
                                            <option value="">Select Course...</option>
                                            {timetable.length > 0 ?
                                                [...new Set(timetable.map(t => t.courseCode))].map(c => <option key={c} value={c}>{c}</option>)
                                                : <option value="CS101">CS101 - Fallback</option>
                                            }
                                        </select>
                                        <button className="btn btn-primary" onClick={async () => {
                                            const code = document.getElementById('manual-code-input').value;
                                            const course = document.getElementById('manual-course-select').value;
                                            if (!code || !course) return alert("Please enter code and course.");
                                            if (!navigator.geolocation) return alert("Geolocation not supported.");
                                            navigator.geolocation.getCurrentPosition(async (pos) => {
                                                try {
                                                    const response = await academicAPI.markAttendance({
                                                        sessionCode: code, courseCode: course,
                                                        latitude: pos.coords.latitude, longitude: pos.coords.longitude
                                                    });
                                                    alert("Attendance Marked Successfully!");
                                                    fetchData();
                                                } catch (e) {
                                                    alert(e.response?.data?.error || "Failed to mark attendance");
                                                }
                                            }, () => alert("Location access required."));
                                        }}>Submit</button>
                                    </div>
                                </div>
                            </div>

                            <div className="section-card">
                                <div className="section-header">
                                    <h3><span style={{ fontSize: '1.75rem' }}>📅</span> Today's Schedule</h3>
                                </div>
                                {timetable.length === 0 ? (
                                    <p className="empty-state">No classes scheduled today. 🎉</p>
                                ) : (
                                    <div className="timetable-list">
                                        {timetable.map((cls) => (
                                            <div key={cls.id} className="timetable-item">
                                                <div className="course-info">
                                                    <span className="course-name">{cls.courseName}</span>
                                                    <span className="course-meta">{cls.courseCode} • Room {cls.roomNumber}</span>
                                                </div>
                                                <div className="time-block">
                                                    <span className="time-range">{cls.startTime?.substring(0, 5)} - {cls.endTime?.substring(0, 5)}</span>
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
                            <NoticeBoard role={user.role} />

                            <div className="section-card hidden lg:block" style={{ marginTop: '0', flex: 1 }}>
                                <div className="section-header" style={{ marginBottom: '1.5rem' }}>
                                    <h3><span style={{ fontSize: '1.75rem' }}>✅</span> Recent History</h3>
                                </div>
                                <ul className="history-list">
                                    {attendanceHistory.slice(0, 6).map((record) => (
                                        <li key={record.id} className="history-item">
                                            <span>{record.courseCode}</span>
                                            <span className={`history-status ${record.status.toLowerCase()}`}>{record.status}</span>
                                        </li>
                                    ))}
                                    {attendanceHistory.length === 0 && <p className="empty-state">No records found.</p>}
                                </ul>
                            </div>
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

export default StudentDashboard;

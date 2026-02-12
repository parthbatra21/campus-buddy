import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { academicAPI } from '../services/api';
import NoticeBoard from '../components/NoticeBoard';
import './Dashboard.css';

function StudentDashboard({ user, handleLogout }) {
    const [timetable, setTimetable] = useState([]);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [scanResult, setScanResult] = useState(null);
    const [showScanner, setShowScanner] = useState(false);
    const [loading, setLoading] = useState(true);

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
                    // Fallback for simple format if any
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

    return (
        <div className="dashboard-container">
            <div className="dashboard-card">
                <div className="dashboard-header">
                    <h1>🎓 Student Dashboard</h1>
                    <button onClick={handleLogout} className="logout-btn">Logout</button>
                </div>

                <div className="user-info">
                    <p>Welcome, <strong>{user.email}</strong> (Student)</p>
                </div>

                {/* Quick Actions */}
                <div className="action-section">
                    <h3>📱 Quick Actions</h3>
                    <button
                        className="action-btn primary"
                        onClick={() => {
                            setShowScanner(!showScanner);
                            setScanResult(null);
                        }}
                    >
                        {showScanner ? "Close Scanner" : "📷 Scan Attendance QR"}
                    </button>

                    {scanResult && (
                        <div className={`scan-result ${scanResult.success ? 'success' : 'error'}`}>
                            {scanResult.success || scanResult.error}
                        </div>
                    )}

                    {showScanner && <div id="reader" className="qr-reader"></div>}

                    <div className="manual-entry-section">
                        <h4>Or Enter Session Code</h4>
                        <div className="input-group">
                            <input
                                type="text"
                                placeholder="6-Digit Code"
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
                            <button className="action-btn secondary" onClick={async () => {
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

                {/* Timetable */}
                <div className="timetable-section">
                    <h3>📅 Weekly Timetable</h3>
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

                <div className="history-section">
                    <h3>✅ Recent Attendance</h3>
                    <ul className="history-list">
                        {attendanceHistory.map((record) => (
                            <li key={record.id} className="history-item">
                                <span>{record.courseCode}</span>
                                <span className={`status ${record.status.toLowerCase()}`}>{record.status}</span>
                                <span className="date">{record.lectureDate}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Notice Board */}
                <NoticeBoard role="STUDENT" />
            </div>
        </div>
    );
}

export default StudentDashboard;

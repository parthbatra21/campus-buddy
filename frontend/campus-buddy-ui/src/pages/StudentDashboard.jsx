import { useState, useEffect, useMemo } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { academicAPI } from '../services/api';
import NoticeBoard from '../components/NoticeBoard';
import MainLayout from '../components/layout/MainLayout';
import FacilityBooking from '../components/FacilityBooking';
import Attendance from './Attendance';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Table from '../components/ui/Table';
import './Dashboard.css';

function StudentDashboard({ user, handleLogout }) {
    const [timetable, setTimetable] = useState([]);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [scanResult, setScanResult] = useState(null);
    const [showScanner, setShowScanner] = useState(false);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    
    // Manual Input State
    const [manualCode, setManualCode] = useState('');
    const [manualCourse, setManualCourse] = useState('');

    const [activeTab, setActiveTab] = useState('dashboard');

    // Calendar day ordering (not alphabetical)
    const DAY_ORDER = { MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5, SATURDAY: 6, SUNDAY: 7 };
    const DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

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
            setTimetable(timetableRes.data || []);
            setAttendanceHistory(attendanceRes.data || []);
            setFetchError(null);
        } catch (error) {
            console.error("Failed to fetch data", error);
            setFetchError('Failed to load dashboard data.');
        } finally {
            setLoading(false);
        }
    };

    // Filter and sort timetable for today
    const todayStr = DAYS[new Date().getDay()];
    const todaySchedule = useMemo(() => {
        return timetable
            .filter(t => (t.dayOfWeek || '').toUpperCase() === todayStr)
            .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    }, [timetable, todayStr]);

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

    const handleManualSubmit = async () => {
        if (!manualCode || !manualCourse) {
            alert("Please enter code and select course.");
            return;
        }
        if (!navigator.geolocation) {
            alert("Geolocation not supported.");
            return;
        }
        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const response = await academicAPI.markAttendance({
                    sessionCode: manualCode, 
                    courseCode: manualCourse,
                    latitude: pos.coords.latitude, 
                    longitude: pos.coords.longitude
                });
                alert("Attendance Marked Successfully!");
                setManualCode('');
                setManualCourse('');
                fetchData();
            } catch (e) {
                alert(e.response?.data?.error || "Failed to mark attendance");
            }
        }, () => alert("Location access required."));
    }

    // Calculate generic stats
    const totalClasses = attendanceHistory.length;
    const presentClasses = attendanceHistory.filter(r => r.status === 'PRESENT').length;
    const attendancePercentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;

    const getNextClass = () => {
        const now = new Date();
        const currentTime = now.toTimeString().split(' ')[0];
        const upcoming = todaySchedule.find(t => t.startTime > currentTime);
        if (upcoming) {
            return {
                code: upcoming.courseCode,
                time: (upcoming.startTime || '').substring(0, 5),
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
                <div className="fade-in">
                    <div className="page-header" style={{ marginBottom: '2rem' }}>
                        <h1>Overview</h1>
                        <p>Welcome back, {user.email.split('@')[0]}. Here's what's happening today.</p>
                    </div>

                    {/* Stats Widgets */}
                    <div className="stats-overview">
                        <Card noPadding={false}>
                            <div className="stat-header">
                                <span className="stat-desc" style={{ marginTop: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Attendance</span>
                                <div className="stat-icon" style={{ color: 'var(--primary)' }}>📊</div>
                            </div>
                            <p className="stat-value">{attendancePercentage}%</p>
                            <div style={{ marginTop: '0.5rem' }}>
                                <Badge variant={attendancePercentage >= 75 ? 'success' : 'error'}>
                                    {attendancePercentage >= 75 ? 'Good Standing' : 'Needs Improvement'}
                                </Badge>
                            </div>
                        </Card>

                        <Card noPadding={false}>
                            <div className="stat-header">
                                <span className="stat-desc" style={{ marginTop: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Next Class</span>
                                <div className="stat-icon" style={{ color: 'var(--warning)' }}>🕒</div>
                            </div>
                            {nextClass ? (
                                <>
                                    <p className="stat-value">{nextClass.code}</p>
                                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        at {nextClass.time} • Room {nextClass.room}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <p className="stat-value" style={{ color: 'var(--text-tertiary)' }}>Done</p>
                                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>No more classes today</span>
                                </>
                            )}
                        </Card>

                        <Card noPadding={false}>
                            <div className="stat-header">
                                <span className="stat-desc" style={{ marginTop: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assignments</span>
                                <div className="stat-icon" style={{ color: 'var(--info)' }}>📝</div>
                            </div>
                            <p className="stat-value">3</p>
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>1 Due Tomorrow</span>
                        </Card>

                        <Card noPadding={false}>
                            <div className="stat-header">
                                <span className="stat-desc" style={{ marginTop: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>CGPA</span>
                                <div className="stat-icon" style={{ color: 'var(--success)' }}>🎓</div>
                            </div>
                            <p className="stat-value">8.9</p>
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Last Semester</span>
                        </Card>
                    </div>

                    {/* Two Column Grid */}
                    <div className="dashboard-grid">

                        {/* Left Column (Wider) */}
                        <div className="dashboard-column">
                            <Card title="Quick Actions">
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
                                    <div style={{ marginTop: '1.5rem' }}>
                                        <div id="reader" style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}></div>
                                    </div>
                                )}

                                {scanResult && (
                                    <div style={{ marginTop: '1.5rem' }}>
                                        <Card style={{ background: scanResult.success ? 'var(--success-bg)' : 'var(--error-bg)', borderColor: 'transparent', color: scanResult.success ? 'var(--success-text)' : 'var(--error-text)' }}>
                                            <strong>{scanResult.success ? "Success: " : "Error: "}</strong> {scanResult.success || scanResult.error}
                                        </Card>
                                    </div>
                                )}

                                <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-default)' }}>
                                    <h4 style={{ margin: '0 0 1rem 0' }}>Or Enter Code Manually</h4>
                                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                        <div style={{ flex: '1', minWidth: '120px' }}>
                                            <Input 
                                                label="Session Code" 
                                                placeholder="6-DIGIT" 
                                                maxLength="6" 
                                                value={manualCode}
                                                onChange={(e) => setManualCode(e.target.value)}
                                                style={{ letterSpacing: '0.1em', fontWeight: 'bold' }} 
                                            />
                                        </div>
                                        <div style={{ flex: '2', minWidth: '150px' }}>
                                            <Select 
                                                label="Course Code"
                                                value={manualCourse}
                                                onChange={(e) => setManualCourse(e.target.value)}
                                                options={[
                                                    { value: "", label: "Select course..." },
                                                    ...(timetable.length > 0 
                                                        ? [...new Set(timetable.map(t => t.courseCode))].map(c => ({ value: c, label: c }))
                                                        : [{ value: "CS101", label: "CS101 - Fallback" }])
                                                ]}
                                            />
                                        </div>
                                        <Button variant="primary" onClick={handleManualSubmit}>Submit</Button>
                                    </div>
                                </div>
                            </Card>

                            <Card title="Today's Schedule" noPadding={true}>
                                <Table 
                                    columns={[
                                        { header: "Time", accessor: "time", width: "120px", render: (row) => <strong>{row.startTime?.substring(0, 5)} - {row.endTime?.substring(0, 5)}</strong> },
                                        { header: "Course", accessor: "courseName", render: (row) => (
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{row.courseName}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{row.courseCode}</div>
                                            </div>
                                        )},
                                        { header: "Room", accessor: "roomNumber" }
                                    ]}
                                    data={todaySchedule}
                                    keyExtractor={(row) => row.id}
                                    emptyMessage="No classes scheduled for today."
                                />
                            </Card>
                        </div>

                        {/* Right Column (Narrower) */}
                        <div className="dashboard-column">
                            <NoticeBoard role={user.role} />

                            <Card title="Recent Attendance" className="hidden lg:block">
                                <ul className="history-list">
                                    {attendanceHistory.slice(0, 6).map((record) => (
                                        <li key={record.id} className="history-item">
                                            <span style={{ fontWeight: 600 }}>{record.courseCode}</span>
                                            <Badge variant={record.status === 'PRESENT' ? 'success' : 'error'}>
                                                {record.status}
                                            </Badge>
                                        </li>
                                    ))}
                                    {attendanceHistory.length === 0 && <p className="empty-state">No records found.</p>}
                                </ul>
                            </Card>
                        </div>
                    </div>
                </div>
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

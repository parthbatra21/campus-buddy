import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { academicAPI } from '../services/api';
import MainLayout from '../components/layout/MainLayout';
import CopilotChat from './CopilotChat';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Select from '../components/ui/Select';
import Table from '../components/ui/Table';

function FacultyDashboard({ user, handleLogout }) {
    const [timetable, setTimetable] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [activeSession, setActiveSession] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('copilot');
    const [isManualEntry, setIsManualEntry] = useState(false);
    const [manualCourseCode, setManualCourseCode] = useState('');

    // Countdown timer for session expiry
    const [sessionSecondsLeft, setSessionSecondsLeft] = useState(null);

    useEffect(() => { fetchTimetable(); }, []);

    // Countdown timer effect
    useEffect(() => {
        if (!activeSession) { setSessionSecondsLeft(null); return; }
        const expiryMs = new Date(activeSession.expiryTime).getTime();
        const updateTimer = () => {
            const remaining = Math.max(0, Math.floor((expiryMs - Date.now()) / 1000));
            setSessionSecondsLeft(remaining);
            if (remaining === 0) setActiveSession(null);
        };
        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [activeSession]);

    const fetchTimetable = async () => {
        try {
            const response = await academicAPI.getTimetable();
            setTimetable(response.data || []);
        } catch (error) {
            console.error("Failed to fetch timetable", error);
        }
    };

    const handleCreateSession = async () => {
        const courseToUse = isManualEntry ? manualCourseCode : selectedCourse;
        console.log("handleCreateSession triggered for:", courseToUse);
        if (!courseToUse) return;
        setLoading(true);
        
        try {
            const payload = { 
                courseCode: courseToUse, 
                latitude: 26.8271, 
                longitude: 75.5652, 
                allowedRadius: 200 
            };
            console.log("Calling academicAPI.createSession with payload:", payload);
            const response = await academicAPI.createSession(payload);
            console.log("Received response from createSession:", response.data);
            
            if (!response.data || !response.data.sessionId) {
                throw new Error("Invalid response from server: sessionId missing");
            }

            setActiveSession({
                ...response.data,
                payload: JSON.stringify({ sessionId: response.data.sessionId, courseCode: response.data.courseCode })
            });
            console.log("activeSession state updated successfully");
        } catch (error) {
            console.error("Critical error in QR generation:", error);
            alert("Failed to create attendance session: " + (error.response?.data?.error || error.message));
        } finally { 
            setLoading(false); 
        }
    };

    const uniqueCourses = [...new Set(timetable.map(t => t.courseCode))];

    const formatTimer = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <MainLayout user={user} handleLogout={handleLogout} activeTab={activeTab} setActiveTab={setActiveTab}>
            {activeTab === 'copilot' ? (
                <div className="fade-in"><CopilotChat /></div>
            ) : (
                <div className="fade-in">
                    <div className="page-header" style={{ marginBottom: '2rem' }}>
                        <h1>Smart Attendance</h1>
                        <p>Generate QR codes for secure, geofenced class attendance.</p>
                    </div>

                    <div className="dashboard-grid">
                        <div className="dashboard-column">
                            <Card title="Start Attendance Session">
                                <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input 
                                        type="checkbox" 
                                        id="manualMode" 
                                        checked={isManualEntry} 
                                        onChange={(e) => setIsManualEntry(e.target.checked)} 
                                    />
                                    <label htmlFor="manualMode" style={{ fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                                        Manual Course Entry (Anytime Mode)
                                    </label>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: activeSession ? '2rem' : '0' }}>
                                    <div style={{ flex: 1, minWidth: '200px' }}>
                                        {isManualEntry ? (
                                            <div className="ui-input-group">
                                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Course Code</label>
                                                <input 
                                                    type="text" 
                                                    className="ui-input" 
                                                    placeholder="e.g. CS101" 
                                                    value={manualCourseCode} 
                                                    onChange={(e) => setManualCourseCode(e.target.value.toUpperCase())}
                                                />
                                            </div>
                                        ) : (
                                            <Select
                                                label="Course Code"
                                                value={selectedCourse}
                                                onChange={(e) => setSelectedCourse(e.target.value)}
                                                options={[
                                                    { value: "", label: "Select Course..." },
                                                    ...uniqueCourses.map(code => ({ value: code, label: code })),
                                                    ...(uniqueCourses.length === 0 ? [{ value: "", label: "No courses found", disabled: true }] : [])
                                                ]}
                                            />
                                        )}
                                    </div>
                                    <Button variant="primary" onClick={handleCreateSession} disabled={(isManualEntry ? !manualCourseCode : !selectedCourse) || loading} isLoading={loading}>
                                        Generate QR Code
                                    </Button>
                                </div>

                                {activeSession && (
                                    <div className="fade-in" style={{
                                        background: 'var(--bg-app)', padding: '2rem', borderRadius: 'var(--radius-lg)',
                                        border: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'
                                    }}>
                                        <h4 style={{ margin: '0 0 1rem', fontSize: '1.25rem' }}>Scan to Mark Attendance</h4>
                                        <Badge variant="primary" style={{ marginBottom: '1.5rem', fontSize: '1rem', padding: '0.25rem 1rem' }}>
                                            {activeSession.courseCode}
                                        </Badge>

                                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-default)' }}>
                                            <QRCode value={activeSession.payload} size={240} />
                                        </div>

                                        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <p style={{ color: 'var(--text-secondary)', margin: '0 0 0.5rem', fontWeight: 600 }}>Or students can manually enter:</p>
                                            <div style={{ background: 'var(--bg-surface)', padding: '0.75rem 2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)' }}>
                                                <h2 style={{ fontSize: '3rem', letterSpacing: '0.25em', margin: 0 }}>
                                                    {activeSession.sessionCode}
                                                </h2>
                                            </div>
                                        </div>

                                        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{
                                                background: sessionSecondsLeft <= 60 ? 'var(--error-bg)' : 'var(--info-bg)',
                                                color: sessionSecondsLeft <= 60 ? 'var(--error-text)' : 'var(--info-text)',
                                                border: `1px solid ${sessionSecondsLeft <= 60 ? 'var(--error)' : 'var(--info)'}`,
                                                borderRadius: 'var(--radius-md)',
                                                padding: '0.5rem 1.5rem',
                                                fontSize: '1.25rem',
                                                fontWeight: 800,
                                                fontFamily: 'monospace',
                                                letterSpacing: '0.05em'
                                            }}>
                                                ⏱️ {sessionSecondsLeft !== null ? formatTimer(sessionSecondsLeft) : '--:--'}
                                            </div>
                                            {sessionSecondsLeft <= 60 && sessionSecondsLeft > 0 && (
                                                <span style={{ fontSize: '0.8125rem', color: 'var(--error)', fontWeight: 600 }}>Session expiring soon!</span>
                                            )}
                                        </div>

                                        <Button variant="danger" style={{ marginTop: '1.5rem' }} onClick={() => setActiveSession(null)}>
                                            End Session
                                        </Button>
                                    </div>
                                )}
                            </Card>
                        </div>

                        <div className="dashboard-column">
                            <Card title="Add Class Schedule" style={{ marginBottom: '1.5rem' }}>
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    const fd = new FormData(e.target);
                                    if(loading) return;
                                    setLoading(true);
                                    try {
                                        await academicAPI.addClass({
                                            courseCode: fd.get('courseCode'),
                                            courseName: fd.get('courseName'),
                                            dayOfWeek: fd.get('dayOfWeek'),
                                            startTime: fd.get('startTime') + ':00',
                                            endTime: fd.get('endTime') + ':00',
                                            roomNumber: fd.get('roomNumber')
                                        });
                                        fetchTimetable();
                                        e.target.reset();
                                    } catch (err) {
                                        alert("Failed to add class: " + (err.response?.data?.error || err.message));
                                    } finally { setLoading(false); }
                                }}>
                                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                                        <div style={{ flex: 1, minWidth: '100px' }}><input name="courseCode" placeholder="Code (e.g. CS101)" required className="ui-input" /></div>
                                        <div style={{ flex: 2, minWidth: '150px' }}><input name="courseName" placeholder="Name (e.g. OS)" required className="ui-input" /></div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                                        <div style={{ flex: 1, minWidth: '100px' }}>
                                            <select name="dayOfWeek" required className="ui-input" style={{ width: '100%' }}>
                                                <option value="">Day</option><option value="MONDAY">Mon</option><option value="TUESDAY">Tue</option><option value="WEDNESDAY">Wed</option><option value="THURSDAY">Thu</option><option value="FRIDAY">Fri</option>
                                            </select>
                                        </div>
                                        <div style={{ flex: 1, minWidth: '80px' }}><input type="time" name="startTime" required className="ui-input" /></div>
                                        <div style={{ flex: 1, minWidth: '80px' }}><input type="time" name="endTime" required className="ui-input" /></div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                        <input name="roomNumber" placeholder="Room (e.g. 101)" required className="ui-input" style={{ flex: 1 }} />
                                        <Button variant="primary" type="submit" disabled={loading}>Add Class</Button>
                                    </div>
                                </form>
                            </Card>

                            <Card title="Your Schedule" noPadding={true}>
                                <Table
                                    columns={[
                                        { header: "Time", accessor: "time", width: "120px", render: (row) => <strong>{row.startTime?.substring(0, 5)} - {row.endTime?.substring(0, 5)}</strong> },
                                        { header: "Course", accessor: "courseName", render: (row) => (
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{row.courseName}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{row.courseCode}</div>
                                            </div>
                                        )},
                                        { header: "Room", accessor: "roomNumber" },
                                        { header: "Day", accessor: "dayOfWeek", render: (row) => <Badge>{row.dayOfWeek}</Badge> }
                                    ]}
                                    data={timetable}
                                    keyExtractor={(row) => row.id}
                                    emptyMessage="No classes scheduled yet."
                                />
                            </Card>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}

export default FacultyDashboard;

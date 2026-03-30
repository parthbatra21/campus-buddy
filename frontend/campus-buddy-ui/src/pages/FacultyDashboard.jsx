import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { academicAPI } from '../services/api';
import NoticeBoard from '../components/NoticeBoard';
import MainLayout from '../components/layout/MainLayout';
import FacilityBooking from '../components/FacilityBooking';
import Attendance from './Attendance';
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
    const [fetchError, setFetchError] = useState(null);
    
    const [activeTab, setActiveTab] = useState('dashboard');
    
    useEffect(() => {
        fetchTimetable();
    }, []);

    const fetchTimetable = async () => {
        try {
            const response = await academicAPI.getTimetable();
            setTimetable(response.data || []);
            setFetchError(null);
        } catch (error) {
            console.error("Failed to fetch timetable", error);
            setFetchError('Failed to load timetable.');
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
                <div className="fade-in">
                    <div className="page-header" style={{ marginBottom: '2rem' }}>
                        <h1>Overview</h1>
                        <p>Welcome back, Professor {user.email.split('@')[0]}. Here's what's happening today.</p>
                    </div>

                    {/* Two Column Grid */}
                    <div className="dashboard-grid">

                        {/* Left Column (Wider) */}
                        <div className="dashboard-column">
                            <Card title="Start Attendance Session">
                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: activeSession ? '2rem' : '0' }}>
                                    <div style={{ flex: 1, minWidth: '200px' }}>
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
                                    </div>
                                    <Button
                                        variant="primary"
                                        onClick={handleCreateSession}
                                        disabled={!selectedCourse || loading}
                                        isLoading={loading}
                                    >
                                        Generate QR Code
                                    </Button>
                                </div>

                                {activeSession && (
                                    <div className="fade-in" style={{
                                        background: 'var(--bg-app)',
                                        padding: '2rem',
                                        borderRadius: 'var(--radius-lg)',
                                        border: '1px solid var(--border-default)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        textAlign: 'center'
                                    }}>
                                        <h4 style={{ margin: '0 0 1rem', fontSize: '1.25rem' }}>Scan to Mark Attendance</h4>
                                        <Badge variant="primary" style={{ marginBottom: '1.5rem', fontSize: '1rem', padding: '0.25rem 1rem' }}>
                                            {activeSession.courseCode}
                                        </Badge>
                                        
                                        <div style={{ 
                                            background: 'white', 
                                            padding: '1.5rem', 
                                            borderRadius: 'var(--radius-md)', 
                                            boxShadow: 'var(--shadow-md)', 
                                            border: '1px solid var(--border-default)' 
                                        }}>
                                            <QRCode value={activeSession.payload} size={260} />
                                        </div>
                                        
                                        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <p style={{ color: 'var(--text-secondary)', margin: '0 0 0.5rem', fontWeight: 600 }}>Or students can manually enter code:</p>
                                            <div style={{ 
                                                background: 'var(--bg-surface)', 
                                                padding: '0.75rem 2rem', 
                                                borderRadius: 'var(--radius-md)', 
                                                border: '1px solid var(--border-strong)' 
                                            }}>
                                                <h2 style={{ fontSize: '3rem', letterSpacing: '0.25em', margin: 0 }}>
                                                    {activeSession.sessionCode}
                                                </h2>
                                            </div>
                                        </div>
                                        
                                        <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '1.5rem', fontWeight: 600 }}>
                                            ⏱️ Expires at: {new Date(activeSession.expiryTime).toLocaleTimeString()}
                                        </p>
                                        <Button 
                                            variant="danger" 
                                            style={{ marginTop: '1.5rem' }} 
                                            onClick={() => setActiveSession(null)}
                                        >
                                            End Session
                                        </Button>
                                    </div>
                                )}
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

                        {/* Right Column (Narrower) */}
                        <div className="dashboard-column">
                            <NoticeBoard role="FACULTY" />
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

export default FacultyDashboard;

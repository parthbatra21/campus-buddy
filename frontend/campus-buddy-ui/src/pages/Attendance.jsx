import { useState, useEffect } from 'react';
import { academicAPI } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Table from '../components/ui/Table';

function Attendance() {
    const [role, setRole] = useState('');
    const [loading, setLoading] = useState(false);

    // Faculty state
    const [courseCode, setCourseCode] = useState('');
    const [facultyCourseCode, setFacultyCourseCode] = useState('');
    const [courseAttendance, setCourseAttendance] = useState([]);

    // Student state
    const [sessionId, setSessionId] = useState('');
    const [studentCourseCode, setStudentCourseCode] = useState('');
    const [studentAttendance, setStudentAttendance] = useState([]);

    // Error and success messages
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const userRole = localStorage.getItem('role');
        setRole(userRole);
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

        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser.");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const payload = {
                    courseCode: courseCode,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    allowedRadius: 100
                };
                const response = await academicAPI.createSession(payload);
                setSuccess(`Session created successfully! ID: ${response.data.sessionId}`);
                setCourseCode('');
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to create session');
            } finally {
                setLoading(false);
            }
        }, () => {
            setError("Location access required.");
            setLoading(false);
        });
    };

    const handleMarkAttendance = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser.");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const response = await academicAPI.markAttendance({
                    sessionCode: sessionId,
                    courseCode: studentCourseCode,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
                setSuccess('Attendance marked successfully!');
                setSessionId('');
                setStudentCourseCode('');
                fetchStudentAttendance();
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to mark attendance');
            } finally {
                setLoading(false);
            }
        }, () => {
            setError("Location access required.");
            setLoading(false);
        });
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
            year: 'numeric', month: 'short', day: 'numeric',
        });
    };

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    return (
        <div className="fade-in">
            <div className="page-header" style={{ marginBottom: '2rem' }}>
                <h1>Academic Records</h1>
                <p>Manage and view comprehensive attendance and grades.</p>
            </div>

            {error && (
                <Card style={{ marginBottom: '1.5rem', background: 'var(--error-bg)', borderColor: 'transparent', color: 'var(--error-text)' }}>
                    <strong>Error: </strong> {error}
                </Card>
            )}
            {success && (
                <Card style={{ marginBottom: '1.5rem', background: 'var(--success-bg)', borderColor: 'transparent', color: 'var(--success-text)' }}>
                    <strong>Success: </strong> {success}
                </Card>
            )}

            {role === 'FACULTY' && (
                <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
                    <div className="dashboard-column">
                        <Card title="View Course Attendance">
                            <form onSubmit={handleViewCourseAttendance} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: courseAttendance.length > 0 ? '2rem' : '0' }}>
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <Input
                                        label="Course Code"
                                        type="text"
                                        value={facultyCourseCode}
                                        onChange={(e) => setFacultyCourseCode(e.target.value)}
                                        placeholder="e.g., CS101"
                                        required
                                    />
                                </div>
                                <Button type="submit" variant="primary" isLoading={loading}>
                                    View Records
                                </Button>
                            </form>

                            {courseAttendance.length > 0 && (
                                <Table 
                                    columns={[
                                        { header: "Student Email", accessor: "studentEmail" },
                                        { header: "Course", accessor: "courseCode" },
                                        { header: "Date", accessor: "lectureDate", render: (row) => formatDate(row.lectureDate) },
                                        { header: "Status", accessor: "status", render: (row) => (
                                            <Badge variant={row.status === 'PRESENT' ? 'success' : 'error'}>
                                                {row.status}
                                            </Badge>
                                        )},
                                        { header: "Marked At", accessor: "markedAt", render: (row) => <span style={{ color: 'var(--text-secondary)' }}>{formatDateTime(row.markedAt)}</span> }
                                    ]}
                                    data={courseAttendance}
                                    keyExtractor={(row) => row.id}
                                />
                            )}
                        </Card>

                        <Card title="Quick Generate Session">
                            <form onSubmit={handleCreateSession} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <Input
                                        label="Course Code"
                                        type="text"
                                        value={courseCode}
                                        onChange={(e) => setCourseCode(e.target.value)}
                                        placeholder="e.g., CS101"
                                        required
                                    />
                                </div>
                                <Button type="submit" variant="secondary" isLoading={loading}>
                                    Create Session
                                </Button>
                            </form>
                            <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                Use the Overview tab for an interactive QR code display.
                            </p>
                        </Card>
                    </div>
                </div>
            )}

            {role === 'STUDENT' && (
                <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
                    <div className="dashboard-column">
                        <Card title="My Attendance History" noPadding={true}>
                            <Table 
                                columns={[
                                    { header: "Course", accessor: "courseCode", cellStyle: { fontWeight: 600 } },
                                    { header: "Date", accessor: "lectureDate", render: (row) => formatDate(row.lectureDate) },
                                    { header: "Status", accessor: "status", render: (row) => (
                                        <Badge variant={row.status === 'PRESENT' ? 'success' : 'error'}>
                                            {row.status}
                                        </Badge>
                                    )},
                                    { header: "Marked At", accessor: "markedAt", render: (row) => <span style={{ color: 'var(--text-secondary)' }}>{formatDateTime(row.markedAt)}</span> }
                                ]}
                                data={studentAttendance}
                                keyExtractor={(row) => row.id}
                                emptyMessage="No attendance records found yet."
                            />
                        </Card>

                        <Card title="Manual Code Entry">
                            <form onSubmit={handleMarkAttendance} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                <div style={{ width: '180px' }}>
                                    <Input
                                        label="Session Code"
                                        type="text"
                                        value={sessionId}
                                        onChange={(e) => setSessionId(e.target.value)}
                                        placeholder="6-DIGIT"
                                        maxLength="6"
                                        style={{ letterSpacing: '0.1em', fontWeight: 'bold' }}
                                        required
                                    />
                                </div>
                                <div style={{ flex: 1, minWidth: '150px' }}>
                                    <Input
                                        label="Course Code"
                                        type="text"
                                        value={studentCourseCode}
                                        onChange={(e) => setStudentCourseCode(e.target.value)}
                                        placeholder="e.g., CS101"
                                        required
                                    />
                                </div>
                                <Button type="submit" variant="primary" isLoading={loading}>
                                    Mark Attendance
                                </Button>
                            </form>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Attendance;

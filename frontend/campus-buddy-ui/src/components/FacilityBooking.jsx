import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { campusAPI } from '../services/api';
import Card from './ui/Card';
import Badge from './ui/Badge';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import './FacilityBooking.css';

const FacilityBooking = () => {
    const [facilities, setFacilities] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        facilityId: '',
        date: '',
        startTime: '',
        endTime: '',
        purpose: '',
        clubName: '',
    });

    const currentUser = (() => {
        try {
            const stored = localStorage.getItem('user');
            if (stored) return JSON.parse(stored);
        } catch (e) { /* ignore parse errors */ }
        const email = localStorage.getItem('email');
        const role = localStorage.getItem('role');
        return email ? { email, role } : null;
    })();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        if (!currentUser?.email) {
            setError('User session not found. Please log in again.');
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const [facRes, bookRes] = await Promise.all([
                campusAPI.getFacilities(),
                campusAPI.getMyBookings(currentUser.email),
            ]);
            setFacilities(facRes.data || []);
            setBookings(bookRes.data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching facility data:', err);
            setError(err.response?.data?.error || 'Failed to load facilities or bookings.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.facilityId || !formData.date || !formData.startTime || !formData.endTime || !formData.purpose) {
            setError('Please fill out all required fields.');
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            const payload = {
                facilityId: parseInt(formData.facilityId),
                date: formData.date,
                startTime: formData.startTime + ':00',
                endTime: formData.endTime + ':00',
                purpose: formData.purpose,
                clubName: formData.clubName || null,
            };

            await campusAPI.createBooking(currentUser.email, payload);

            setShowModal(false);
            setFormData({
                facilityId: '',
                date: '',
                startTime: '',
                endTime: '',
                purpose: '',
                clubName: '',
            });

            fetchData();
        } catch (err) {
            console.error('Booking submission error:', err);
            setError(err.response?.data?.error || err.response?.data?.message || err.response?.data || 'Failed to submit booking request.');
        } finally {
            setSubmitting(false);
        }
    };

    const getFacilityName = (id) => {
        const fac = facilities.find((f) => f.id === id);
        return fac ? fac.name : 'Unknown Facility';
    };

    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="fade-in">
            <div className="page-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1>Facility Bookings</h1>
                    <p>Reserve spaces across campus for your events and club activities.</p>
                </div>
                <Button variant="primary" onClick={() => setShowModal(true)}>
                    + New Booking
                </Button>
            </div>

            {error && !showModal && (
                <Card style={{ marginBottom: '1.5rem', background: 'var(--error-bg)', borderColor: 'transparent', color: 'var(--error-text)' }}>
                    <strong>Error: </strong> {error}
                </Card>
            )}

            {loading ? (
                <Card style={{ textAlign: 'center', padding: '3rem' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>Loading your bookings...</p>
                </Card>
            ) : bookings.length === 0 ? (
                <Card style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>🏢</div>
                    <h3 style={{ margin: '0 0 0.5rem 0' }}>No active bookings</h3>
                    <p style={{ color: 'var(--text-secondary)', margin: 0, maxWidth: '400px', display: 'inline-block' }}>Ready to host your next event? Request a facility booking right now and organize it within minutes.</p>
                </Card>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    {bookings.map((booking) => (
                        <Card key={booking.id} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>{getFacilityName(booking.facilityId)}</h3>
                                <Badge variant={booking.status === 'APPROVED' ? 'success' : booking.status === 'REJECTED' ? 'error' : 'warning'}>
                                    {booking.status}
                                </Badge>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span>📅</span> {new Date(booking.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span>🕒</span> {booking.startTime?.substring(0, 5)} - {booking.endTime?.substring(0, 5)}
                                </div>
                            </div>

                            <div style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-default)' }}>
                                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem' }}>
                                    <strong style={{ color: 'var(--text-primary)' }}>Purpose:</strong> {booking.purpose}
                                </p>
                                {booking.clubName && (
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                        👥 {booking.clubName}
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {showModal && createPortal(
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'var(--overlay)', zIndex: 100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem'
                }} onClick={(e) => { if (e.target === e.currentTarget && !submitting) setShowModal(false); }}>
                    <div className="fade-in" style={{
                        background: 'var(--bg-app)', width: '100%', maxWidth: '500px',
                        borderRadius: 'var(--radius-xl)', padding: '2rem',
                        boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-default)',
                        maxHeight: '90vh', overflowY: 'auto'
                    }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>New Booking Request</h3>
                            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Fill out the details to reserve a facility.</p>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {error && (
                                <Card style={{ background: 'var(--error-bg)', borderColor: 'transparent', color: 'var(--error-text)', padding: '1rem' }}>
                                    {error}
                                </Card>
                            )}

                            <Select
                                label="Facility"
                                name="facilityId"
                                value={formData.facilityId}
                                onChange={handleChange}
                                required
                                options={[
                                    { value: "", label: "Choose a space...", disabled: true },
                                    ...facilities.map(fac => ({ value: fac.id, label: `${fac.name} — Capacity: ${fac.capacity}` }))
                                ]}
                            />

                            <Input
                                type="date"
                                label="Date"
                                name="date"
                                min={today}
                                value={formData.date}
                                onChange={handleChange}
                                required
                            />

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <Input
                                        type="time"
                                        label="Start Time"
                                        name="startTime"
                                        value={formData.startTime}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <Input
                                        type="time"
                                        label="End Time"
                                        name="endTime"
                                        value={formData.endTime}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <Input
                                type="text"
                                label="Club Name (Optional)"
                                name="clubName"
                                placeholder="e.g., Coding Club"
                                value={formData.clubName}
                                onChange={handleChange}
                            />

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Purpose of Booking</label>
                                <textarea
                                    name="purpose"
                                    rows="3"
                                    required
                                    placeholder="Briefly describe what you'll be doing..."
                                    value={formData.purpose}
                                    onChange={handleChange}
                                    style={{
                                        padding: '0.625rem 0.875rem',
                                        border: '1px solid var(--border-default)',
                                        borderRadius: 'var(--radius-md)',
                                        background: 'var(--bg-app)',
                                        fontSize: '0.875rem',
                                        color: 'var(--text-primary)',
                                        fontFamily: 'inherit',
                                        outline: 'none',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <Button type="button" variant="outline" onClick={() => setShowModal(false)} disabled={submitting}>
                                    Cancel
                                </Button>
                                <Button type="submit" variant="primary" isLoading={submitting}>
                                    Submit Request
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default FacilityBooking;

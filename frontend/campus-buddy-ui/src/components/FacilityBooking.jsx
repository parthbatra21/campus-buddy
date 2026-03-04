import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { campusAPI } from '../services/api';
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

    const currentUser = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [facRes, bookRes] = await Promise.all([
                campusAPI.getFacilities(),
                campusAPI.getMyBookings(currentUser.email),
            ]);
            setFacilities(facRes.data);
            setBookings(bookRes.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching facility data:', err);
            setError('Failed to load facilities or bookings.');
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
                startTime: formData.startTime + ':00', // Ensure HH:mm:ss if backend expects it
                endTime: formData.endTime + ':00',
                purpose: formData.purpose,
                clubName: formData.clubName || null,
            };

            await campusAPI.createBooking(currentUser.email, payload);

            // Reset form and modal
            setShowModal(false);
            setFormData({
                facilityId: '',
                date: '',
                startTime: '',
                endTime: '',
                purpose: '',
                clubName: '',
            });

            // Refresh bookings
            fetchData();
        } catch (err) {
            console.error('Booking submission error:', err);
            setError(err.response?.data?.error || err.response?.data?.message || err.response?.data || 'Failed to submit booking request. The facility might already be booked for this time.');
        } finally {
            setSubmitting(false);
        }
    };

    const getFacilityName = (id) => {
        const fac = facilities.find((f) => f.id === id);
        return fac ? fac.name : 'Unknown Facility';
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'APPROVED': return 'fb-status-approved';
            case 'REJECTED': return 'fb-status-rejected';
            case 'PENDING': return 'fb-status-pending';
            default: return 'fb-status-default';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'APPROVED': return '✓ ';
            case 'REJECTED': return '✕ ';
            case 'PENDING': return '⧗ ';
            default: return '';
        }
    };

    // Get minimum date (today) for the date picker
    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="fb-container">
            <div className="fb-decor-blob"></div>

            <div className="fb-header">
                <div className="fb-header-info">
                    <h2 className="fb-title">
                        <span className="fb-title-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" className="fb-svg-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </span>
                        Facility Bookings
                    </h2>
                    <p className="fb-subtitle">Reserve spaces across campus for your events and club activities.</p>
                </div>
                <button className="fb-btn-primary fb-new-booking-btn" onClick={() => setShowModal(true)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="fb-svg-icon-small" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    New Booking
                </button>
            </div>

            <div className="fb-content">
                {error && !showModal && (
                    <div className="fb-error-banner">
                        <span className="fb-error-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </span>
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="fb-loader-container">
                        <div className="fb-spinner"></div>
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="fb-empty-state">
                        <div className="fb-empty-icon-wrap">
                            <svg xmlns="http://www.w3.org/2000/svg" className="fb-empty-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3>No active bookings</h3>
                        <p>Ready to host your next event? Request a facility booking right now and organize it within minutes.</p>
                    </div>
                ) : (
                    <div className="fb-grid">
                        {bookings.map((booking) => (
                            <div key={booking.id} className="fb-card">
                                <div className="fb-card-top">
                                    <h3 className="fb-card-facility">{getFacilityName(booking.facilityId)}</h3>
                                    <span className={`fb-status-badge ${getStatusClass(booking.status)}`}>
                                        {getStatusIcon(booking.status)}{booking.status}
                                    </span>
                                </div>

                                <div className="fb-card-middle">
                                    <div className="fb-info-row">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="fb-info-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        {new Date(booking.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                    <div className="fb-info-row">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="fb-info-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {booking.startTime?.substring(0, 5)} &mdash; {booking.endTime?.substring(0, 5)}
                                    </div>
                                </div>

                                <div className="fb-card-bottom">
                                    <p className="fb-card-purpose">
                                        <strong>Purpose:</strong> {booking.purpose}
                                    </p>
                                    {booking.clubName && (
                                        <div className="fb-club-tag">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="fb-club-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                            {booking.clubName}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showModal && createPortal(
                <div className="fb-modal-overlay" onClick={(e) => { if (e.target.className === 'fb-modal-overlay' && !submitting) setShowModal(false); }}>
                    <div className="fb-modal">
                        <div className="fb-modal-header">
                            <div className="fb-modal-title-wrap">
                                <div className="fb-modal-icon-bg">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="fb-modal-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="fb-modal-title">New Booking Request</h3>
                                    <p className="fb-modal-subtitle">Fill out the details to reserve a facility.</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="fb-modal-form">
                            {error && (
                                <div className="fb-error-banner fb-empty-state-small">
                                    <span className="fb-error-icon">⚠️</span> {error}
                                </div>
                            )}

                            <div className="fb-form-group">
                                <label>Facility <span className="fb-required">*</span></label>
                                <select name="facilityId" required value={formData.facilityId} onChange={handleChange} className="fb-input">
                                    <option value="" disabled>Choose a space...</option>
                                    {facilities.map((fac) => (
                                        <option key={fac.id} value={fac.id}>
                                            {fac.name} &mdash; Capacity: {fac.capacity}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="fb-form-group">
                                <label>Date <span className="fb-required">*</span></label>
                                <input type="date" name="date" required min={today} value={formData.date} onChange={handleChange} className="fb-input" />
                            </div>

                            <div className="fb-form-row">
                                <div className="fb-form-group">
                                    <label>Start Time <span className="fb-required">*</span></label>
                                    <input type="time" name="startTime" required value={formData.startTime} onChange={handleChange} className="fb-input" />
                                </div>
                                <div className="fb-form-group">
                                    <label>End Time <span className="fb-required">*</span></label>
                                    <input type="time" name="endTime" required value={formData.endTime} onChange={handleChange} className="fb-input" />
                                </div>
                            </div>

                            <div className="fb-form-group">
                                <label>Club Name <span className="fb-optional">(Optional)</span></label>
                                <input type="text" name="clubName" placeholder="e.g., Coding Club" value={formData.clubName} onChange={handleChange} className="fb-input" />
                            </div>

                            <div className="fb-form-group">
                                <label>Purpose of Booking <span className="fb-required">*</span></label>
                                <textarea name="purpose" rows="3" required placeholder="Briefly describe what you'll be doing..." value={formData.purpose} onChange={handleChange} className="fb-input fb-textarea"></textarea>
                            </div>

                            <div className="fb-modal-actions">
                                <button type="button" disabled={submitting} onClick={() => setShowModal(false)} className="fb-btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting} className={`fb-btn-primary ${submitting ? 'fb-btn-loading' : ''}`}>
                                    {submitting ? 'Processing...' : 'Submit Request'}
                                </button>
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

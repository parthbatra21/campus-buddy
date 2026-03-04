import { useState, useEffect } from 'react';
import { campusAPI } from '../services/api';

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
            setError(err.response?.data || 'Failed to submit booking request. The facility might already be booked for this time.');
        } finally {
            setSubmitting(false);
        }
    };

    const getFacilityName = (id) => {
        const fac = facilities.find((f) => f.id === id);
        return fac ? fac.name : 'Unknown Facility';
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'APPROVED': return 'bg-green-100 text-green-800 border-green-200';
            case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
            case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    // Get minimum date (today) for the date picker
    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border-b border-gray-100 bg-gray-50/50">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Facility Booking
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Book campus facilities for events, club activities, or sports.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium text-sm rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 transition-colors shadow-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Booking
                </button>
            </div>

            {/* Content */}
            <div className="p-6">
                {error && !showModal && (
                    <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg flex items-start text-sm border border-red-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="text-center py-12 px-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 text-indigo-500 mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No bookings yet</h3>
                        <p className="text-gray-500 text-sm max-w-sm mx-auto">You haven't made any facility booking requests yet. Click "New Booking" to reserve a space.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Facility</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose / Club</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {bookings.map((booking) => (
                                    <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{getFacilityName(booking.facilityId)}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{booking.date}</div>
                                            <div className="text-xs text-gray-500">{booking.startTime?.substring(0, 5)} - {booking.endTime?.substring(0, 5)}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 line-clamp-1">{booking.purpose}</div>
                                            {booking.clubName && (
                                                <div className="text-xs text-indigo-600 font-medium mt-0.5 border border-indigo-200 bg-indigo-50 px-2 py-0.5 rounded-full inline-block">
                                                    Club: {booking.clubName}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                                                {booking.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Booking Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        {/* Background overlay */}
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm" aria-hidden="true" onClick={() => !submitting && setShowModal(false)}></div>

                        {/* Modal panel container */}
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        {/* Modal panel */}
                        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-100">
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">Book a Facility</h3>
                                        <p className="text-sm text-gray-500 mt-1">Submit a request to reserve a space.</p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
                                {error && (
                                    <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="facilityId" className="block text-sm font-medium text-gray-700 mb-1">Facility <span className="text-red-500">*</span></label>
                                        <select
                                            id="facilityId"
                                            name="facilityId"
                                            required
                                            value={formData.facilityId}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                                        >
                                            <option value="">Select a facility</option>
                                            {facilities.map((fac) => (
                                                <option key={fac.id} value={fac.id}>
                                                    {fac.name} (Capacity: {fac.capacity})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                                        <div>
                                            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
                                            <input
                                                type="date"
                                                id="date"
                                                name="date"
                                                required
                                                min={today}
                                                value={formData.date}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                                        <div>
                                            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">Start Time <span className="text-red-500">*</span></label>
                                            <input
                                                type="time"
                                                id="startTime"
                                                name="startTime"
                                                required
                                                value={formData.startTime}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">End Time <span className="text-red-500">*</span></label>
                                            <input
                                                type="time"
                                                id="endTime"
                                                name="endTime"
                                                required
                                                value={formData.endTime}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="clubName" className="block text-sm font-medium text-gray-700 mb-1">Club Name (Optional)</label>
                                        <input
                                            type="text"
                                            id="clubName"
                                            name="clubName"
                                            placeholder="e.g. Coding Club"
                                            value={formData.clubName}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-1">Purpose of Booking <span className="text-red-500">*</span></label>
                                        <textarea
                                            id="purpose"
                                            name="purpose"
                                            rows="3"
                                            required
                                            placeholder="Briefly describe what the facility will be used for..."
                                            value={formData.purpose}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow resize-none"
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className={`w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm ${submitting ? 'opacity-70 cursor-not-allowed' : ''
                                            }`}
                                    >
                                        {submitting ? 'Submitting...' : 'Submit Request'}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={submitting}
                                        onClick={() => setShowModal(false)}
                                        className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacilityBooking;

import React, { useState, useEffect } from 'react';
import PageHeader from '../components/ui/PageHeader';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import api from '../api/client';

const ROOMS = [
  { id: 'LAB-101', name: 'Computer Lab 101' },
  { id: 'LAB-102', name: 'AI Research Lab' },
  { id: 'ROOM-201', name: 'Seminar Hall' },
  { id: 'ROOM-202', name: 'Lecture Theater' },
  { id: 'STUDY-1', name: 'Study Pod A' },
];

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 8 PM

const RoomBooking = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/bookings?date=${selectedDate}`);
      setBookings(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [selectedDate]);

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = {
      roomId: selectedSlot.roomId,
      date: selectedDate,
      startTime: fd.get('startTime') + ':00',
      endTime: fd.get('endTime') + ':00',
      purpose: fd.get('purpose')
    };

    try {
      await api.post('/bookings', data);
      showToast('Room booked successfully!');
      setIsModalOpen(false);
      fetchBookings();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const getBookingForSlot = (roomId, hour) => {
    const hourStr = `${hour.toString().padStart(2, '0')}:00`;
    return bookings.find(b => 
      b.roomId === roomId && 
      b.status === 'CONFIRMED' &&
      hourStr >= b.startTime.substring(0, 5) && 
      hourStr < b.endTime.substring(0, 5)
    );
  };

  const onSlotClick = (roomId, hour) => {
    const existing = getBookingForSlot(roomId, hour);
    if (existing) {
      showToast(`Already booked: ${existing.purpose}`, 'info');
      return;
    }
    setSelectedSlot({ roomId, hour });
    setIsModalOpen(true);
  };

  return (
    <div className="fade-in">
      <PageHeader 
        title="Room Booking" 
        subtitle="Check availability and reserve spaces" 
        action={
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ 
              padding: '0.5rem', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--color-border)',
              fontFamily: 'inherit'
            }}
          />
        }
      />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <div style={{ position: 'relative', overflowX: 'auto', backgroundColor: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '120px repeat(12, 1fr)', minWidth: '1000px' }}>
            {/* Hour Header */}
            <div style={{ height: '48px', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', borderRight: '1px solid var(--color-border)' }}></div>
            {HOURS.map(h => (
              <div key={h} style={{ 
                height: '48px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '0.75rem', 
                fontWeight: '700',
                color: 'var(--color-text-muted)',
                borderBottom: '1px solid var(--color-border)',
                borderRight: '1px solid var(--color-border-light)',
                backgroundColor: 'var(--color-surface)'
              }}>
                {h}:00
              </div>
            ))}

            {/* Room Rows */}
            {ROOMS.map(room => (
              <React.Fragment key={room.id}>
                <div style={{ 
                  height: '64px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '0 1rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  borderBottom: '1px solid var(--color-border-light)',
                  borderRight: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)'
                }}>
                  {room.name}
                </div>
                {HOURS.map(h => {
                  const booking = getBookingForSlot(room.id, h);
                  const isMine = booking?.userId === user?.email; // Assuming userId is email here
                  
                  return (
                    <div 
                      key={h}
                      onClick={() => onSlotClick(room.id, h)}
                      style={{ 
                        height: '64px', 
                        borderBottom: '1px solid var(--color-border-light)', 
                        borderRight: '1px solid var(--color-border-light)',
                        backgroundColor: booking ? (isMine ? '#dbeafe' : '#f1f5f9') : 'transparent',
                        cursor: booking ? 'default' : 'pointer',
                        padding: '4px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                      }}
                    >
                      {booking && (
                        <div style={{ 
                          fontSize: '0.625rem', 
                          color: isMine ? 'var(--color-primary-light)' : 'var(--color-text-primary)',
                          fontWeight: 500,
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {booking.purpose}
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Booking Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={`Book ${ROOMS.find(r => r.id === selectedSlot?.roomId)?.name}`}
      >
        <form onSubmit={handleCreateBooking} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Start Time</label>
              <input 
                type="time" 
                name="startTime" 
                defaultValue={`${selectedSlot?.hour.toString().padStart(2, '0')}:00`}
                className="p-4 rounded-md border-b" 
                style={{ width: '100%', border: '1px solid var(--color-border)' }} 
                required 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>End Time</label>
              <input 
                type="time" 
                name="endTime" 
                defaultValue={`${(selectedSlot?.hour + 1).toString().padStart(2, '0')}:00`}
                className="p-4 rounded-md border-b" 
                style={{ width: '100%', border: '1px solid var(--color-border)' }} 
                required 
              />
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Purpose</label>
            <textarea 
              name="purpose" 
              rows="3" 
              className="p-4 rounded-md border-b" 
              style={{ width: '100%', border: '1px solid var(--color-border)', resize: 'none' }} 
              required 
              placeholder="e.g. Project meeting, Study session"
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', fontWeight: 500 }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', padding: '0.75rem 1.5rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Confirm Booking
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RoomBooking;

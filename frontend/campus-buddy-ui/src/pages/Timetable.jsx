import React, { useState, useEffect } from 'react';
import PageHeader from '../components/ui/PageHeader';
import TimetableGrid from '../components/timetable/TimetableGrid';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import { useAuth } from '../hooks/useAuth';
import { useRole } from '../hooks/useRole';
import { useToast } from '../hooks/useToast';
import api from '../api/client';

const Timetable = () => {
  const { isFaculty } = useRole();
  const { showToast } = useToast();
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const data = await api.get('/academic/timetable');
      setTimetable(data || []);
    } catch (error) {
      showToast('Failed to fetch timetable', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, []);

  const handleAddClass = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = {
      courseCode: fd.get('courseCode'),
      courseName: fd.get('courseName'),
      dayOfWeek: fd.get('dayOfWeek'),
      startTime: fd.get('startTime') + ':00',
      endTime: fd.get('endTime') + ':00',
      roomNumber: fd.get('roomNumber')
    };

    try {
      await api.post('/academic/timetable', data);
      showToast('Class added successfully!');
      setIsModalOpen(false);
      fetchTimetable();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const onCellClick = (day, hour) => {
    if (!isFaculty) return;
    // Pre-fill or just open modal
    setIsModalOpen(true);
  };

  const onEntryClick = (entry) => {
    setSelectedEntry(entry);
    // Show details modal? Or just toast?
  };

  return (
    <div className="fade-in">
      <PageHeader 
        title="Timetable" 
        subtitle="Your weekly class schedule" 
        action={isFaculty && (
          <button 
            onClick={() => setIsModalOpen(true)}
            style={{ 
              backgroundColor: 'var(--color-primary)', 
              color: 'white', 
              border: 'none', 
              borderRadius: 'var(--radius-md)', 
              padding: '0.625rem 1.25rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Add Class
          </button>
        )}
      />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="timetable-container">
          <TimetableGrid 
            entries={timetable} 
            onCellClick={onCellClick}
            onEntryClick={onEntryClick}
          />
        </div>
      )}

      {/* Add Class Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Add New Class"
      >
        <form onSubmit={handleAddClass} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Course Code</label>
              <input name="courseCode" className="p-4 rounded-md border-b" style={{ width: '100%', border: '1px solid var(--color-border)' }} required placeholder="e.g. CS101" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Course Name</label>
              <input name="courseName" className="p-4 rounded-md border-b" style={{ width: '100%', border: '1px solid var(--color-border)' }} required placeholder="e.g. Data Structures" />
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Day of Week</label>
            <select name="dayOfWeek" className="p-4 rounded-md border-b" style={{ width: '100%', border: '1px solid var(--color-border)' }} required>
              <option value="MONDAY">Monday</option>
              <option value="TUESDAY">Tuesday</option>
              <option value="WEDNESDAY">Wednesday</option>
              <option value="THURSDAY">Thursday</option>
              <option value="FRIDAY">Friday</option>
              <option value="SATURDAY">Saturday</option>
              <option value="SUNDAY">Sunday</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Start Time</label>
              <input type="time" name="startTime" className="p-4 rounded-md border-b" style={{ width: '100%', border: '1px solid var(--color-border)' }} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>End Time</label>
              <input type="time" name="endTime" className="p-4 rounded-md border-b" style={{ width: '100%', border: '1px solid var(--color-border)' }} required />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Room Number</label>
            <input name="roomNumber" className="p-4 rounded-md border-b" style={{ width: '100%', border: '1px solid var(--color-border)' }} required placeholder="e.g. Room 101" />
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', padding: '0.625rem 1.25rem', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
              Cancel
            </button>
            <button type="submit" style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', padding: '0.625rem 1.25rem', fontWeight: 600, cursor: 'pointer' }}>
              Save Class
            </button>
          </div>
        </form>
      </Modal>

      {/* Entry Details Modal */}
      <Modal
        isOpen={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        title={selectedEntry?.courseName}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Course Code</span>
            <div style={{ fontSize: '1rem', fontWeight: 600 }}>{selectedEntry?.courseCode}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Time Slot</span>
            <div style={{ fontSize: '1rem', fontWeight: 600 }}>{selectedEntry?.startTime} - {selectedEntry?.endTime}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Room</span>
            <div style={{ fontSize: '1rem', fontWeight: 600 }}>{selectedEntry?.roomNumber}</div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Timetable;

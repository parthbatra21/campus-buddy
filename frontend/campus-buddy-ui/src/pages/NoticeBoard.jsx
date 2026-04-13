import React, { useState, useEffect } from 'react';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import { useAuth } from '../hooks/useAuth';
import { useRole } from '../hooks/useRole';
import { useToast } from '../hooks/useToast';
import api from '../api/client';

const NoticeBoard = () => {
  const { isFaculty } = useRole();
  const { showToast } = useToast();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const data = await api.get('/notices');
      setNotices(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handlePostNotice = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = {
      title: fd.get('title'),
      body: fd.get('body'),
      category: fd.get('category'),
      priority: fd.get('priority')
    };

    try {
      await api.post('/notices', data);
      showToast('Notice posted successfully!');
      setIsModalOpen(false);
      fetchNotices();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.post(`/notices/${id}/read`, {});
      setNotices(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error(error);
    }
  };

  const openNotice = (notice) => {
    setSelectedNotice(notice);
    if (!notice.isRead) {
      markAsRead(notice.id);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'PINNED': return 'purple';
      case 'URGENT': return 'red';
      default: return 'gray';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'ACADEMIC': return 'blue';
      case 'EVENTS': return 'green';
      case 'ADMIN': return 'amber';
      default: return 'gray';
    }
  };

  return (
    <div className="fade-in">
      <PageHeader 
        title="Notice Board" 
        subtitle="Stay updated with the latest campus announcements" 
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
            Post Notice
          </button>
        )}
      />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {notices.map((notice) => (
            <div 
              key={notice.id} 
              onClick={() => openNotice(notice)}
              style={{ 
                backgroundColor: 'white',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                border: '1px solid var(--color-border)',
                cursor: 'pointer',
                transition: 'var(--transition)',
                opacity: notice.isRead ? 0.7 : 1,
                borderLeft: notice.priority === 'URGENT' ? '4px solid var(--color-danger)' : '1px solid var(--color-border)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-card)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {!notice.isRead && (
                    <span style={{ width: '8px', height: '8px', backgroundColor: 'var(--color-primary-light)', borderRadius: '50%' }}></span>
                  )}
                  <Badge text={notice.category} color={getCategoryColor(notice.category)} />
                  {notice.priority !== 'NORMAL' && (
                    <Badge text={notice.priority} color={getPriorityColor(notice.priority)} />
                  )}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {new Date(notice.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
                {notice.title}
              </h3>
              <p className="text-sm line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                {notice.body}
              </p>
            </div>
          ))}

          {notices.length === 0 && (
            <EmptyState 
              title="No updates yet" 
              message="When notices are posted, they will appear here." 
              icon="📭"
            />
          )}
        </div>
      )}

      {/* Post Notice Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Post New Notice"
      >
        <form onSubmit={handlePostNotice} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Title</label>
            <input name="title" className="p-4 rounded-md border-b" style={{ width: '100%', border: '1px solid var(--color-border)' }} required placeholder="e.g. End Semester Exams" />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Message</label>
            <textarea name="body" rows="4" className="p-4 rounded-md border-b" style={{ width: '100%', border: '1px solid var(--color-border)', resize: 'none' }} required placeholder="Details about the notice..." />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Category</label>
              <select name="category" className="p-4 rounded-md border-b" style={{ width: '100%', border: '1px solid var(--color-border)' }} required>
                <option value="ACADEMIC">Academic</option>
                <option value="EVENTS">Events</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Priority</label>
              <select name="priority" className="p-4 rounded-md border-b" style={{ width: '100%', border: '1px solid var(--color-border)' }} required>
                <option value="NORMAL">Normal</option>
                <option value="URGENT">Urgent</option>
                <option value="PINNED">Pinned</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', padding: '0.625rem 1.25rem', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
              Cancel
            </button>
            <button type="submit" style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', padding: '0.625rem 1.25rem', fontWeight: 600, cursor: 'pointer' }}>
              Post Notice
            </button>
          </div>
        </form>
      </Modal>

      {/* View Notice Modal */}
      <Modal 
        isOpen={!!selectedNotice} 
        onClose={() => setSelectedNotice(null)} 
        title={selectedNotice?.title}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Badge text={selectedNotice?.category} color={getCategoryColor(selectedNotice?.category)} />
            {selectedNotice?.priority !== 'NORMAL' && (
              <Badge text={selectedNotice?.priority} color={getPriorityColor(selectedNotice?.priority)} />
            )}
          </div>
          <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {selectedNotice?.body}
          </p>
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border-light)', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Posted by {selectedNotice?.postedBy} on {new Date(selectedNotice?.createdAt).toLocaleString()}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default NoticeBoard;

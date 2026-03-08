import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { academicAPI } from '../services/api';
import '../pages/Dashboard.css';

function NoticeBoard({ role }) {
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showArchived, setShowArchived] = useState(false);
    const [priorityFilter, setPriorityFilter] = useState('ALL');
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [newNotice, setNewNotice] = useState({
        title: '',
        content: '',
        priority: 'LOW',
        category: 'GENERAL'
    });

    useEffect(() => {
        fetchNotices();
        // Poll every 30 seconds for realtime updates
        const interval = setInterval(fetchNotices, 30000);
        return () => clearInterval(interval);
    }, [showArchived]); // Re-fetch when toggle changes

    const fetchNotices = async () => {
        try {
            const response = await academicAPI.getNotices(showArchived);
            setNotices(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch notices", error);
            setLoading(false);
        }
    };

    const handleArchive = async (id) => {
        if (window.confirm("Are you sure you want to archive this notice?")) {
            try {
                await academicAPI.archiveNotice(id);
                fetchNotices(); // Refresh list
            } catch (error) {
                alert("Failed to archive notice.");
            }
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'HIGH': return 'var(--error)'; // Red
            case 'MEDIUM': return '#f59e0b'; // Amber
            case 'LOW': return 'var(--success)'; // Green
            default: return 'var(--text-secondary)';
        }
    };

    const getCategoryBadge = (category) => {
        const style = {
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '0.7rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
        };

        switch (category) {
            case 'EXAM':
                return <span style={{ ...style, background: 'var(--error-bg)', color: 'var(--error)' }}>🎓 Exam</span>;
            case 'ALERT':
                return <span style={{ ...style, background: '#FEF3C7', color: '#92400E' }}>⚠️ Alert</span>;
            case 'EVENT':
                return <span style={{ ...style, background: 'var(--primary-light)', color: 'var(--primary)' }}>🎉 Event</span>;
            case 'SPORTS':
                return <span style={{ ...style, background: 'var(--success-light)', color: 'var(--success-dark)' }}>🏀 Sports</span>;
            default:
                return <span style={{ ...style, background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>📢 General</span>;
        }
    };

    // Filter notices client-side for priority (since backend sorts but doesn't filter by priority param yet)
    const filteredNotices = notices.filter(notice =>
        priorityFilter === 'ALL' || notice.priority === priorityFilter
    );

    const handleCreateNotice = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await academicAPI.createNotice(newNotice);
            setShowModal(false);
            setNewNotice({ title: '', content: '', priority: 'LOW', category: 'GENERAL' });
            fetchNotices();
        } catch (error) {
            alert("Failed to create notice: " + (error.response?.data?.error || "Unknown error"));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="section-card notice-board-section">
            <div className="section-header" style={{ flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ margin: 0 }}>📌 Notice Board</h3>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="filter-select"
                        style={{ padding: '4px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}
                    >
                        <option value="ALL">All Priorities</option>
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                    </select>

                    <label style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={showArchived}
                            onChange={(e) => setShowArchived(e.target.checked)}
                        />
                        Archived
                    </label>

                    {role === 'FACULTY' && (
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>Post New</button>
                    )}
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    Loading updates...
                </div>
            ) : filteredNotices.length === 0 ? (
                <p className="empty-state">No notices found.</p>
            ) : (
                <div className="notices-list">
                    {filteredNotices.map(notice => (
                        <div key={notice.id} className="notice-card" style={{ borderLeftColor: getPriorityColor(notice.priority), opacity: notice.archived ? 0.7 : 1 }}>
                            <div className="notice-header">
                                {getCategoryBadge(notice.category)}
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(notice.createdAt).toLocaleDateString()}</span>
                                    {role === 'FACULTY' && !notice.archived && (
                                        <button
                                            onClick={() => handleArchive(notice.id)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
                                            title="Archive Notice"
                                        >
                                            📥
                                        </button>
                                    )}
                                </div>
                            </div>
                            <h4 className="notice-title">{notice.title}</h4>
                            <p className="notice-content">{notice.content}</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                                <span>By: {notice.postedBy}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && createPortal(
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}>
                    <div className="section-card fade-in" style={{ width: '90%', maxWidth: '500px', background: 'var(--card-bg)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', margin: 'auto' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.5rem', color: 'var(--text-primary)' }}>Create New Notice</h3>
                        <form onSubmit={handleCreateNotice}>
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>Title</label>
                                <input type="text" className="input-field" required value={newNotice.title} onChange={e => setNewNotice({ ...newNotice, title: e.target.value })} style={{ width: '100%', background: '#fff' }} />
                            </div>
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>Content</label>
                                <textarea className="input-field" required rows="4" value={newNotice.content} onChange={e => setNewNotice({ ...newNotice, content: e.target.value })} style={{ width: '100%', background: '#fff', resize: 'vertical' }}></textarea>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>Priority</label>
                                    <select className="input-field" value={newNotice.priority} onChange={e => setNewNotice({ ...newNotice, priority: e.target.value })} style={{ width: '100%', background: '#fff' }}>
                                        <option value="LOW">Low</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HIGH">High</option>
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>Category</label>
                                    <select className="input-field" value={newNotice.category} onChange={e => setNewNotice({ ...newNotice, category: e.target.value })} style={{ width: '100%', background: '#fff' }}>
                                        <option value="GENERAL">General</option>
                                        <option value="EVENT">Event</option>
                                        <option value="EXAM">Exam</option>
                                        <option value="ALERT">Alert</option>
                                        <option value="SPORTS">Sports</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                                <button type="button" className="btn" style={{ padding: '0.75rem 1.5rem', background: '#fff', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: 'var(--radius)', fontWeight: 600 }} onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius)' }}>{submitting ? 'Posting...' : 'Post Notice'}</button>
                            </div>
                        </form>
                    </div>
                </div>, document.body
            )}
        </div>
    );
}

export default NoticeBoard;

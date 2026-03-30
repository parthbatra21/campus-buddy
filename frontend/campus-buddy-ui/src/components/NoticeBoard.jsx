import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { academicAPI } from '../services/api';
import Card from './ui/Card';
import Badge from './ui/Badge';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import '../pages/Dashboard.css';

function NoticeBoard({ role }) {
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
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
        const interval = setInterval(fetchNotices, 30000);
        return () => clearInterval(interval);
    }, [showArchived]);

    const fetchNotices = async () => {
        try {
            const response = await academicAPI.getNotices(showArchived);
            setNotices(response.data || []);
            setFetchError(null);
        } catch (error) {
            console.error("Failed to fetch notices", error);
            setFetchError('Failed to load notices. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleArchive = async (id) => {
        if (window.confirm("Are you sure you want to archive this notice?")) {
            try {
                await academicAPI.archiveNotice(id);
                fetchNotices();
            } catch (error) {
                alert("Failed to archive notice.");
            }
        }
    };

    const getCategoryBadge = (category) => {
        switch (category) {
            case 'IMPORTANT':
                return <Badge variant="error">🔴 Important</Badge>;
            case 'EXAM':
                return <Badge variant="error">🎓 Exam</Badge>;
            case 'ALERT':
                return <Badge variant="warning">⚠️ Alert</Badge>;
            case 'EVENT':
                return <Badge variant="primary">🎉 Event</Badge>;
            case 'SPORTS':
                return <Badge variant="success">🏀 Sports</Badge>;
            default:
                return <Badge variant="secondary">📢 General</Badge>;
        }
    };

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
        <Card title="Notice Board" noPadding={false}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                <Select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    options={[
                        { value: 'ALL', label: 'All Priorities' },
                        { value: 'HIGH', label: 'High' },
                        { value: 'MEDIUM', label: 'Medium' },
                        { value: 'LOW', label: 'Low' }
                    ]}
                    style={{ minWidth: '130px', margin: 0 }}
                />

                <label style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 500, color: 'var(--text-secondary)' }}>
                    <input
                        type="checkbox"
                        checked={showArchived}
                        onChange={(e) => setShowArchived(e.target.checked)}
                        style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
                    />
                    Archived
                </label>

                {role === 'FACULTY' && (
                    <Button variant="outline" size="small" onClick={() => setShowModal(true)} style={{ marginLeft: 'auto' }}>
                        + Post New
                    </Button>
                )}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    Loading updates...
                </div>
            ) : fetchError ? (
                <div style={{ padding: '1rem', background: 'var(--error-bg)', color: 'var(--error-text)', borderRadius: 'var(--radius-md)', fontWeight: 600 }}>
                    ⚠️ {fetchError}
                </div>
            ) : filteredNotices.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-default)' }}>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>No notices found.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {filteredNotices.map(notice => (
                        <div key={notice.id} style={{
                            padding: '1.25rem',
                            background: 'var(--bg-app)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-default)',
                            borderLeftWidth: '4px',
                            borderLeftColor: notice.priority === 'HIGH' ? 'var(--error)' : notice.priority === 'MEDIUM' ? 'var(--warning)' : 'var(--success)',
                            opacity: notice.archived ? 0.6 : 1,
                            transition: 'all 0.2s',
                            boxShadow: 'var(--shadow-sm)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                {getCategoryBadge(notice.category)}
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                        {new Date(notice.createdAt).toLocaleDateString()}
                                    </span>
                                    {role === 'FACULTY' && !notice.archived && (
                                        <button
                                            onClick={() => handleArchive(notice.id)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', opacity: 0.6 }}
                                            title="Archive Notice"
                                        >
                                            📥
                                        </button>
                                    )}
                                </div>
                            </div>
                            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 700 }}>{notice.title}</h4>
                            <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{notice.content}</p>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                                By {notice.postedBy}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && createPortal(
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'var(--overlay)', backdropFilter: 'blur(4px)', zIndex: 100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem'
                }} onClick={(e) => { if (e.target === e.currentTarget && !submitting) setShowModal(false); }}>
                    <div className="fade-in" style={{
                        background: 'var(--bg-app)', width: '100%', maxWidth: '500px',
                        borderRadius: 'var(--radius-xl)', padding: '2rem',
                        boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-default)'
                    }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>Post New Notice</h3>
                            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Broadcast an announcement to the campus.</p>
                        </div>

                        <form onSubmit={handleCreateNotice} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <Input
                                label="Title"
                                required
                                value={newNotice.title}
                                onChange={e => setNewNotice({ ...newNotice, title: e.target.value })}
                                placeholder="Enter a descriptive title"
                            />

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Content</label>
                                <textarea
                                    required
                                    rows="4"
                                    value={newNotice.content}
                                    onChange={e => setNewNotice({ ...newNotice, content: e.target.value })}
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

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <Select
                                        label="Priority"
                                        value={newNotice.priority}
                                        onChange={e => setNewNotice({ ...newNotice, priority: e.target.value })}
                                        options={[
                                            { value: 'LOW', label: 'Low' },
                                            { value: 'MEDIUM', label: 'Medium' },
                                            { value: 'HIGH', label: 'High' }
                                        ]}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <Select
                                        label="Category"
                                        value={newNotice.category}
                                        onChange={e => setNewNotice({ ...newNotice, category: e.target.value })}
                                        options={[
                                            { value: 'GENERAL', label: 'General' },
                                            { value: 'IMPORTANT', label: 'Important' },
                                            { value: 'EVENT', label: 'Event' },
                                            { value: 'EXAM', label: 'Exam' },
                                            { value: 'ALERT', label: 'Alert' },
                                            { value: 'SPORTS', label: 'Sports' }
                                        ]}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <Button type="button" variant="outline" onClick={() => setShowModal(false)} disabled={submitting}>
                                    Cancel
                                </Button>
                                <Button type="submit" variant="primary" isLoading={submitting}>
                                    Post Notice
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>, document.body
            )}
        </Card>
    );
}

export default NoticeBoard;

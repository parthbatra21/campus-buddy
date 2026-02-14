import { useState, useEffect } from 'react';
import { academicAPI } from '../services/api';
import '../pages/Dashboard.css';

function NoticeBoard({ role }) {
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showArchived, setShowArchived] = useState(false);
    const [priorityFilter, setPriorityFilter] = useState('ALL');

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
            case 'HIGH': return '#ef4444'; // Red
            case 'MEDIUM': return '#f59e0b'; // Amber
            case 'LOW': return '#10b981'; // Green
            default: return '#6b7280';
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
                return <span style={{ ...style, background: '#FEE2E2', color: '#991B1B' }}>🎓 Exam</span>;
            case 'ALERT':
                return <span style={{ ...style, background: '#FEF3C7', color: '#92400E' }}>⚠️ Alert</span>;
            case 'EVENT':
                return <span style={{ ...style, background: '#DBEAFE', color: '#1E40AF' }}>🎉 Event</span>;
            case 'SPORTS':
                return <span style={{ ...style, background: '#D1FAE5', color: '#065F46' }}>🏀 Sports</span>;
            default:
                return <span style={{ ...style, background: '#F3F4F6', color: '#374151' }}>📢 General</span>;
        }
    };

    // Filter notices client-side for priority (since backend sorts but doesn't filter by priority param yet)
    const filteredNotices = notices.filter(notice =>
        priorityFilter === 'ALL' || notice.priority === priorityFilter
    );

    return (
        <div className="section-card notice-board-section">
            <div className="section-header" style={{ flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ margin: 0 }}>📌 Notice Board</h3>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="filter-select"
                        style={{ padding: '4px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}
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
                        <button className="action-btn small">Post New</button>
                    )}
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
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
                                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{new Date(notice.createdAt).toLocaleDateString()}</span>
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem', borderTop: '1px solid #f3f4f6', paddingTop: '0.5rem' }}>
                                <span>By: {notice.postedBy}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default NoticeBoard;

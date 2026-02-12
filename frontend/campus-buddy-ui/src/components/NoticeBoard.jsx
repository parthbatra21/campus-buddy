import { useState, useEffect } from 'react';
import api from '../services/api'; // Correct default import
import '../pages/Dashboard.css'; // Reuse dashboard styles

function NoticeBoard({ role }) {
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);

    // Mock data for initial UI dev if backend is empty
    const mockNotices = [
        { id: 1, title: "Final Exam Schedule", category: "IMPORTANT", priority: "HIGH", content: "The final exam schedule for Spring 2026 has been released.", createdAt: "2026-02-12", postedBy: "admin@college.edu" },
        { id: 2, title: "Tech Fest 2026", category: "EVENT", priority: "MEDIUM", content: "Register for the upcoming Hackathon!", createdAt: "2026-02-10", postedBy: "student_council@college.edu" }
    ];

    useEffect(() => {
        fetchNotices();
    }, []);

    const fetchNotices = async () => {
        try {
            // Uncomment when backend is fully ready
            const response = await api.get('/campus/notices');
            setNotices(response.data);
            // setNotices(mockNotices); // Fallback for testing UI
        } catch (error) {
            console.error("Failed to fetch notices", error);
            // setNotices(mockNotices); // Fallback on error
        } finally {
            setLoading(false);
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
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: '600',
            backgroundColor: '#e5e7eb',
            color: '#374151'
        };

        if (category === 'IMPORTANT') {
            style.backgroundColor = '#fee2e2';
            style.color = '#991b1b';
        } else if (category === 'EVENT') {
            style.backgroundColor = '#dbeafe';
            style.color = '#1e40af';
        }

        return <span style={style}>{category}</span>;
    };

    return (
        <div className="notice-board-section">
            <div className="section-header">
                <h3>📢 Digital Notice Board</h3>
                {role === 'FACULTY' && (
                    <button className="action-btn small">Post Notice</button> // modal trigger to be implemented
                )}
            </div>

            {loading ? (
                <p>Loading notices...</p>
            ) : notices.length === 0 ? (
                <p className="empty-state">No notices at the moment.</p>
            ) : (
                <div className="notices-list">
                    {notices.map(notice => (
                        <div key={notice.id} className="notice-card">
                            <div className="notice-header">
                                <div className="notice-meta">
                                    {getCategoryBadge(notice.category)}
                                    <span className="notice-date">{new Date(notice.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="priority-indicator" style={{ backgroundColor: getPriorityColor(notice.priority) }} title={`Priority: ${notice.priority}`}></div>
                            </div>
                            <h4 className="notice-title">{notice.title}</h4>
                            <p className="notice-content">{notice.content}</p>
                            <p className="notice-author">Posted by: {notice.postedBy}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default NoticeBoard;

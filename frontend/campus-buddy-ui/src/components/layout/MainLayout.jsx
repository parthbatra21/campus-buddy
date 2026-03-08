import { useState } from 'react';
import ChangePasswordModal from '../ChangePasswordModal';
import './MainLayout.css';

const MainLayout = ({ user, handleLogout, activeTab, setActiveTab, children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    return (
        <div className="dashboard-wrapper">
            {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}

            {/* Mobile Topbar */}
            <div className="mobile-topbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>🎓</span>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Campus Buddy</h2>
                </div>
                <button
                    className="btn btn-primary"
                    style={{ padding: '0.4rem 0.8rem', borderRadius: '8px' }}
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                    ☰
                </button>
            </div>

            {/* Sidebar Navigation */}
            <aside className={`dashboard-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    <span style={{ fontSize: '2rem' }}>🎓</span>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: 800 }}>Campus Buddy</h2>
                </div>

                <nav className="sidebar-nav">
                    <button
                        className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
                    >
                        <span className="nav-icon">📊</span> Overview
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'facilities' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('facilities'); setIsSidebarOpen(false); }}
                    >
                        <span className="nav-icon">🏢</span> Facility Booking
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'academics' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('academics'); setIsSidebarOpen(false); }}
                    >
                        <span className="nav-icon">📝</span> Academics
                    </button>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info-box">
                        <p className="user-info-label">Logged in as</p>
                        <p className="user-info-email" title={user?.email}>{user?.email}</p>
                        <p className={`user-info-role ${user?.role?.toLowerCase()}`}>
                            {user?.role}
                        </p>
                    </div>

                    <button onClick={() => setShowPasswordModal(true)} className="nav-item">
                        <span className="nav-icon">🔐</span> Settings
                    </button>
                    <button onClick={handleLogout} className="nav-item danger">
                        <span className="nav-icon">🚪</span> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="dashboard-main" onClick={() => isSidebarOpen && setIsSidebarOpen(false)}>
                {children}
            </main>
        </div>
    );
};

export default MainLayout;

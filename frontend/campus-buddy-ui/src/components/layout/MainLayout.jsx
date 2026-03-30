import { useState } from 'react';
import ChangePasswordModal from '../ChangePasswordModal';
import Badge from '../ui/Badge';
import './MainLayout.css';

const MainLayout = ({ user, handleLogout, activeTab, setActiveTab, children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    // Feather Icons via SVG for a clean institutional look
    const Icons = {
        Book: (
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
            </svg>
        ),
        Home: (
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
            </svg>
        ),
        Building: (
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
        ),
        Settings: (
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
        ),
        LogOut: (
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
        ),
        Menu: (
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M3 12h18M3 6h18M3 18h18"></path>
            </svg>
        )
    };

    return (
        <div className="dashboard-wrapper">
            {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}

            {/* Mobile Topbar */}
            <div className="mobile-topbar">
                <div className="mobile-brand">
                    <div style={{ background: 'var(--primary)', color: 'white', padding: '4px', borderRadius: '6px', display: 'flex' }}>
                        {Icons.Book}
                    </div>
                    <h2 className="brand-name">Campus Buddy</h2>
                </div>
                <button
                    style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                    {Icons.Menu}
                </button>
            </div>

            {/* Sidebar Navigation */}
            <aside className={`dashboard-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    <div style={{ background: 'var(--primary)', color: 'white', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                        {Icons.Book}
                    </div>
                    <h2 className="brand-name">Campus Buddy</h2>
                </div>

                <nav className="sidebar-nav">
                    <button
                        className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
                    >
                        {Icons.Home} Overview
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'facilities' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('facilities'); setIsSidebarOpen(false); }}
                    >
                        {Icons.Building} Facility Booking
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'academics' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('academics'); setIsSidebarOpen(false); }}
                    >
                        {Icons.Book} Academics
                    </button>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info-box">
                        <p className="user-info-label">Account</p>
                        <p className="user-info-email" title={user?.email}>{user?.email}</p>
                        <div className="user-info-role">
                            <Badge variant={user?.role === 'STUDENT' ? 'success' : 'primary'}>
                                {user?.role}
                            </Badge>
                        </div>
                    </div>

                    <button onClick={() => setShowPasswordModal(true)} className="nav-item" style={{ marginTop: '0.5rem' }}>
                        {Icons.Settings} Settings
                    </button>
                    <button onClick={handleLogout} className="nav-item danger">
                        {Icons.LogOut} Logout
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

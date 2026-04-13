import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Timetable', path: '/timetable' },
    { label: 'Room Booking', path: '/rooms' },
    { label: 'Attendance', path: '/attendance' },
    { label: 'Copilot', path: '/copilot' },
  ];

  const getInitials = (name) => {
    if (!name) return user?.email?.charAt(0).toUpperCase() || 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-brand" onClick={() => navigate('/dashboard')}>
          <div className="logo-icon">CB</div>
          <span className="brand-name">Campus Buddy</span>
        </div>

        {/* Desktop Navigation */}
        <div className="navbar-links">
          {navItems.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path} 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Right Actions */}
        <div className="navbar-actions">
          <div className="user-profile">
            <div 
              className={`avatar ${user?.role === 'FACULTY' ? 'faculty' : 'student'}`}
              title={`${user?.role}: ${user?.email}`}
            >
              {getInitials(user?.name)}
            </div>
            <div className="user-meta">
              <span className="role-pill">{user?.role}</span>
            </div>
            <button className="logout-btn" onClick={logout}>Logout</button>
          </div>

          {/* Hamburger Menu */}
          <button className="hamburger" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <span className="brand-name">Menu</span>
              <button className="close-btn" onClick={() => setIsMobileMenuOpen(false)}>&times;</button>
            </div>
            <div className="drawer-links">
              {navItems.map((item) => (
                <NavLink 
                  key={item.path} 
                  to={item.path} 
                  className="drawer-link"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
              <button 
                className="drawer-link logout" 
                onClick={() => { logout(); setIsMobileMenuOpen(false); }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

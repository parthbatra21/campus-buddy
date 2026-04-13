import React from 'react';
import Navbar from './Navbar';
import { useAuth } from '../../hooks/useAuth';
import Spinner from '../ui/Spinner';

const MainLayout = ({ children }) => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div style={{ h: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Navbar />
      <main className="layout-main">
        <div className="max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;

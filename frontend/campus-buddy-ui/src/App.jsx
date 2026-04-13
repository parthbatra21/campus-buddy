import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ToastProvider } from './hooks/useToast';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Timetable from './pages/Timetable';
import RoomBooking from './pages/RoomBooking';
import NoticeBoard from './pages/NoticeBoard';
import Attendance from './pages/Attendance';
import Copilot from './pages/Copilot';

import './styles/globals.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return null; // Spinner is handled in MainLayout or here
  
  return user ? <MainLayout>{children}</MainLayout> : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
            
            <Route path="/dashboard" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />
            <Route path="/timetable" element={
              <ProtectedRoute><Timetable /></ProtectedRoute>
            } />
            <Route path="/rooms" element={
              <ProtectedRoute><RoomBooking /></ProtectedRoute>
            } />
            <Route path="/notices" element={
              <ProtectedRoute><NoticeBoard /></ProtectedRoute>
            } />
            <Route path="/attendance" element={
              <ProtectedRoute><Attendance /></ProtectedRoute>
            } />
            <Route path="/copilot" element={
              <ProtectedRoute><Copilot /></ProtectedRoute>
            } />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

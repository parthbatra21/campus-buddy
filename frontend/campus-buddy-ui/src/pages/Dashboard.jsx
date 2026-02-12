import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import StudentDashboard from './StudentDashboard';
import FacultyDashboard from './FacultyDashboard';
import './Dashboard.css';

function Dashboard() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const response = await authAPI.getCurrentUser();
            setUser(response.data);
        } catch (error) {
            console.error('Failed to fetch user data:', error);
            // If unauthorized, redirect to login
            if (error.response?.status === 401 || error.response?.status === 403) {
                handleLogout();
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('email');
        localStorage.removeItem('role');
        navigate('/');
    };

    if (loading) {
        return (
            <div className="dashboard-container">
                <div className="loading">Loading...</div>
            </div>
        );
    }

    if (!user) return null;

    return user.role === 'STUDENT' ? (
        <StudentDashboard user={user} handleLogout={handleLogout} />
    ) : (
        <FacultyDashboard user={user} handleLogout={handleLogout} />
    );
}

export default Dashboard;

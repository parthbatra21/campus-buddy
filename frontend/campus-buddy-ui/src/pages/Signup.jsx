import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import './AuthLayout.css';

function Signup() {
    const [role, setRole] = useState('STUDENT'); // Default role
    const [formData, setFormData] = useState({
        studentId: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleRoleChange = (newRole) => {
        setRole(newRole);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Basic Validation
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);

        try {
            await authAPI.register(
                formData.studentId,
                formData.email,
                formData.password,
                role
            );

            // Redirect to Login on success
            navigate('/', { state: { message: 'Registration successful! Please login.' } });
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>Create Account</h1>
                    <p>Join Campus Buddy today</p>
                </div>

                {error && <div className="error-message">{error}</div>}

                {/* Role Toggle */}
                <div className="role-toggle">
                    <button
                        className={`role-btn ${role === 'STUDENT' ? 'active' : ''}`}
                        onClick={() => handleRoleChange('STUDENT')}
                        type="button"
                    >
                        Student
                    </button>
                    <button
                        className={`role-btn ${role === 'FACULTY' ? 'active' : ''}`}
                        onClick={() => handleRoleChange('FACULTY')}
                        type="button"
                    >
                        Faculty
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="studentId">{role === 'STUDENT' ? 'Student ID' : 'Faculty ID'}</label>
                        <input
                            id="studentId"
                            type="text"
                            value={formData.studentId}
                            onChange={handleChange}
                            required
                            placeholder={role === 'STUDENT' ? 'e.g., S12345' : 'e.g., F98765'}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="name@example.com"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="Create a password"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            placeholder="Confirm your password"
                        />
                    </div>

                    <button type="submit" disabled={loading} className="auth-btn">
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <div className="auth-footer">
                    Already have an account?
                    <Link to="/">Login</Link>
                </div>
            </div>
        </div>
    );
}

export default Signup;

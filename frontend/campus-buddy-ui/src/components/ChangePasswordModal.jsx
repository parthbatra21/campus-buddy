import { useState } from 'react';
import { authAPI } from '../services/api';

function ChangePasswordModal({ onClose }) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        setLoading(true);

        try {
            await authAPI.changePassword(currentPassword, newPassword);
            setSuccess('Password changed successfully!');
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to change password. check current password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>🔐 Change Password</h3>
                    <button onClick={onClose} className="close-btn">&times;</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Current Password</label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Confirm New Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <p className="error-msg">{error}</p>}
                    {success && <p className="success-msg">{success}</p>}

                    <button type="submit" className="action-btn primary" disabled={loading}>
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>

            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                    backdrop-filter: blur(4px);
                }
                .modal-content {
                    background: white;
                    padding: 2rem;
                    border-radius: 1rem;
                    width: 90%;
                    max-width: 400px;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }
                .close-btn {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #64748b;
                }
                .form-group {
                    margin-bottom: 1rem;
                }
                .form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-size: 0.9rem;
                    color: #475569;
                    font-weight: 500;
                }
                .form-group input {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 0.5rem;
                }
                .error-msg { color: #ef4444; font-size: 0.9rem; margin-bottom: 1rem; }
                .success-msg { color: #10b981; font-size: 0.9rem; margin-bottom: 1rem; }
            `}</style>
        </div>
    );
}

export default ChangePasswordModal;

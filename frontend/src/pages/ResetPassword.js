import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // Get the token from the URL
    const location = useLocation();
    const token = new URLSearchParams(location.search).get('token'); // Extract token from URL

    useEffect(() => {
        // Check if token exists, if not show an error message
        if (!token) {
            setMessage('Invalid or expired token.');
        }
    }, [token]);

    const handleResetPassword = async () => {
        if (password !== confirmPassword) {
            setMessage('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const res = await axios.post('http://localhost:5000/api/auth/reset-password', { token, password });
            setMessage(res.data.message);
        } catch (error) {
            setMessage(error.response.data.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2>Reset Password</h2>
            {message && <p>{message}</p>}
            <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Enter new password" 
            /><br />
            <input 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                placeholder="Confirm new password" 
            /><br />
            <button onClick={handleResetPassword} disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
            </button>
        </div>
    );
}

export default ResetPassword;

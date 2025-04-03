import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';

function App() {
    const [page, setPage] = useState('login');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [token, setToken] = useState('');
    const [formData, setFormData] = useState({ field1: '', field2: '' });
    const [submittedData, setSubmittedData] = useState([]);
    const [message, setMessage] = useState('');

    // Manual captcha states
    const [captcha, setCaptcha] = useState({ num1: 0, num2: 0 });
    const [captchaAnswer, setCaptchaAnswer] = useState('');
    const [isCaptchaValid, setIsCaptchaValid] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const resetToken = new URLSearchParams(location.search).get('token');

    useEffect(() => {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        if (savedToken) setToken(savedToken);
        if (savedUser) {
            const userObj = JSON.parse(savedUser);
            setUsername(userObj.username);
            setEmail(userObj.email);
            setPage('form');
            fetchSubmissions(savedToken);
        }

        if (resetToken) {
            setPage('resetPassword');
        }

        generateCaptcha();
    }, [resetToken]);

    const generateCaptcha = () => {
        const num1 = Math.floor(Math.random() * 100) + 1;
        const num2 = Math.floor(Math.random() * 100) + 1;
        setCaptcha({ num1, num2 });
        setCaptchaAnswer('');
        setIsCaptchaValid(false);
    };

    const checkCaptcha = (value) => {
        setCaptchaAnswer(value);
        if (parseInt(value) === captcha.num1 + captcha.num2) {
            setIsCaptchaValid(true);
        } else {
            setIsCaptchaValid(false);
        }
    };

    const fetchSubmissions = async (token) => {
        const res = await axios.get('http://localhost:5000/api/form/get-submissions', {
            headers: { Authorization: token }
        });
        setSubmittedData(res.data);
    };

    const handleRegister = async () => {
        try {
            const res = await axios.post('http://localhost:5000/api/auth/register', { username, email, password });
            alert(res.data.message);
            setPage('login');
        } catch (err) {
            setMessage(err.response?.data?.message || 'Registration failed');
        }
    };

    const handleLogin = async () => {
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
            if (res.data.token) {
                setToken(res.data.token);
                setUsername(res.data.user.username);
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('user', JSON.stringify(res.data.user));
                setPage('form');
                fetchSubmissions(res.data.token);
            } else {
                setMessage(res.data.message);
            }
        } catch (err) {
            setMessage(err.response?.data?.message || 'Login failed');
        }
    };

    const handleForgot = async () => {
        try {
            const res = await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
            setMessage(res.data.message);
        } catch (err) {
            setMessage(err.response?.data?.message || 'Error sending password reset email');
        }
    };

    const handleFormSubmit = async () => {
        try {
            await axios.post('http://localhost:5000/api/form/submit', formData, {
                headers: { Authorization: token }
            });
            setFormData({ field1: '', field2: '' });
            fetchSubmissions(token);
        } catch (err) {
            setMessage('Error submitting form');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken('');
        setPage('login');
        setSubmittedData([]);
        generateCaptcha();
    };

    const handleResetPassword = async () => {
        if (!password) {
            setMessage('Please enter a new password');
            return;
        }

        try {
            const res = await axios.post('http://localhost:5000/api/auth/reset-password', { token: resetToken, password });
            setMessage(res.data.message);
            setPage('login');
        } catch (err) {
            setMessage(err.response?.data?.message || 'Error resetting password');
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            {page === 'login' && (
                <div>
                    <h2>Login</h2>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" /><br />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" /><br />

                    {/* Manual Captcha */}
                    <div style={{ marginTop: '10px' }}>
                        <span><strong>{captcha.num1} + {captcha.num2} = ?</strong></span><br />
                        <input 
                            type="text" 
                            placeholder="Enter answer"
                            value={captchaAnswer} 
                            onChange={(e) => checkCaptcha(e.target.value)} 
                        />
                        <button onClick={generateCaptcha} style={{ marginLeft: '5px' }}>Reload</button>
                    </div>

                    <button onClick={handleLogin} disabled={!isCaptchaValid}>Login</button>
                    {message && <p>{message}</p>}
                    <p onClick={() => { setPage('forgot'); generateCaptcha(); }} style={{ cursor: 'pointer', color: 'blue' }}>Forgot Password?</p>
                    <p onClick={() => { setPage('register'); generateCaptcha(); }} style={{ cursor: 'pointer', color: 'blue' }}>Don't have an account? Register</p>
                </div>
            )}

            {page === 'register' && (
                <div>
                    <h2>Register</h2>
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" /><br />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" /><br />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" /><br />
                    <button onClick={handleRegister}>Register</button>
                    {message && <p>{message}</p>}
                    <p onClick={() => { setPage('login'); generateCaptcha(); }} style={{ cursor: 'pointer', color: 'blue' }}>Already have an account? Login</p>
                </div>
            )}

            {page === 'forgot' && (
                <div>
                    <h2>Forgot Password</h2>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" /><br />
                    <button onClick={handleForgot}>Send Reset Email</button>
                    {message && <p>{message}</p>}
                    <p onClick={() => { setPage('login'); generateCaptcha(); }} style={{ cursor: 'pointer', color: 'blue' }}>Back to Login</p>
                </div>
            )}

            {page === 'resetPassword' && (
                <div>
                    <h2>Reset Password</h2>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter new password" /><br />
                    <button onClick={handleResetPassword}>Reset Password</button>
                    {message && <p>{message}</p>}
                </div>
            )}

            {page === 'form' && (
                <div>
                    <h2>Welcome, {username}</h2>
                    <button onClick={handleLogout}>Logout</button>

                    <h3>Submit Form</h3>
                    <input type="text" placeholder="Field 1" value={formData.field1} onChange={(e) => setFormData({ ...formData, field1: e.target.value })} /><br />
                    <input type="text" placeholder="Field 2" value={formData.field2} onChange={(e) => setFormData({ ...formData, field2: e.target.value })} /><br />
                    <button onClick={handleFormSubmit}>Submit</button>

                    <h3>Your Submissions</h3>
                    <ul>
                        {submittedData.map((data, index) => (
                            <li key={index}>{data.field1} - {data.field2}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default App;

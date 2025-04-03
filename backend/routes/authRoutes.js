
const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Register
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hashedPassword],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'User registered' });
        }
    );
});

// Login
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(400).json({ message: 'User not found' });

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user: { username: user.username, email: user.email } });
    });
});

// Forgot password

// router.post('/forgot-password', (req, res) => {
//     const { email } = req.body;

//     db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
//         if (err) return res.status(500).json({ message: 'Server error' });
//         if (results.length === 0) return res.status(404).json({ message: 'User not found' });

//         const user = results[0];
//         const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '15m' });

//         const transporter = nodemailer.createTransport({
//             service: 'gmail',
//             auth: {
//                 user: process.env.EMAIL_USER,
//                 pass: process.env.EMAIL_PASS
//             }
//         });

//         const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

//         const mailOptions = {
//             from: process.env.EMAIL_USER,
//             to: email,
//             subject: 'Password Reset',
//             html: `
//                 <h3>Hello ${user.username},</h3>
//                 <p>Click below to reset your password:</p>
//                 <a href="${resetLink}">Reset Password</a>
//                 <p>This link will expire in 15 minutes.</p>
//             `
//         };

//         transporter.sendMail(mailOptions, (error, info) => {
//             if (error) {
//                 return res.status(500).json({ message: 'Email failed to send' });
//             } else {
//                 return res.json({ message: 'Password reset link sent to your email' });
//             }
//         });
//     });
// });


router.post('/forgot-password', (req, res) => {
    const { email } = req.body;

    // Check if user exists
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) return res.status(500).json({ message: 'Server error', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'User not found' });

        const user = results[0];
        
        // Create JWT token valid for 15 minutes
        const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '15m' });

        // Configure nodemailer transporter with secure Gmail SMTP settings
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true, // use SSL
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS // use App Password here, not your normal password
            }
        });

        // Password reset link
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        // Email content
        const mailOptions = {
            from: `"Support" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Password Reset Request',
            html: `
                <h3>Hello ${user.username},</h3>
                <p>You requested to reset your password. Click the link below to proceed:</p>
                <a href="${resetLink}">Reset Password</a>
                <p><small>This link will expire in 15 minutes.</small></p>
            `
        };

        // Send email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Email error:', error);
                return res.status(500).json({ message: 'Email failed to send', error: error.message });
            } else {
                return res.json({ message: 'Password reset link sent to your email' });
            }
        });
    });
});


// Reset password
router.post('/reset-password', (req, res) => {
    const { token, password } = req.body;

    if (!token) return res.status(400).json({ message: 'Token missing' });

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) return res.status(400).json({ message: 'Invalid or expired token' });

        const hashedPassword = await bcrypt.hash(password, 10);

        db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, decoded.id], (err, result) => {
            if (err) return res.status(500).json({ message: 'Server error while updating password' });
            return res.json({ message: 'Password updated successfully' });
        });
    });
});


module.exports = router;


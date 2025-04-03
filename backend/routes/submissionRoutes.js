const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Submit form data
router.post('/submit', (req, res) => {
    const token = req.headers['authorization'];
    const { field1, field2 } = req.body;

    if (!token) return res.status(401).json({ message: 'Unauthorized - No token' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        db.query(
            'INSERT INTO submissions (user_id, field1, field2) VALUES (?, ?, ?)',
            [decoded.id, field1, field2],
            (err, result) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'Form submitted' });
            }
        );
    } catch (err) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
});

// Get submissions
router.get('/get-submissions', (req, res) => {
    const token = req.headers['authorization'];

    if (!token) return res.status(401).json({ message: 'Unauthorized - No token' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        db.query(
            'SELECT field1, field2 FROM submissions WHERE user_id = ? ORDER BY created_at DESC',
            [decoded.id],
            (err, results) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(results);
            }
        );
    } catch (err) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
});

module.exports = router;

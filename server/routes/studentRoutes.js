const express = require('express');
const router = express.Router();
const db = require('../config/db');
const multer = require('multer');
const path = require('path');

// Configure Multer
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, `dp_${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});

const DEPT_MAP = {
    'CSE': 'CS', 'ISE': 'IS', 'MECH': 'ME', 'ECE': 'EC',
    'CV': 'CV', 'ETE': 'ET', 'AI/ML': 'AI', 'CSD': 'CD',
    'CG': 'CG', 'CY': 'CY', 'MATH': 'MT', 'BT': 'BT'
};

// Add student
router.post('/add', upload.single('dp'), (req, res) => {
    const { name, department, phone, email, gender, password, duration, paid_status } = req.body;
    const dp = req.file ? req.file.filename : null;
    const dept = department || 'CSE';
    const abbrev = DEPT_MAP[dept] || 'CS';

    const maxQuery = `SELECT usn FROM students WHERE usn LIKE '1DS24${abbrev}%' ORDER BY usn DESC LIMIT 1`;
    db.query(maxQuery, (err, result) => {
        if (err) return res.status(500).send(err);
        
        let seq = 1;
        if (result.length > 0 && result[0].usn) {
            const num = parseInt(result[0].usn.replace(`1DS24${abbrev}`, ''), 10);
            if (!isNaN(num)) seq = num + 1;
        }
        
        const newUsn = `1DS24${abbrev}${String(seq).padStart(3, '0')}`;

        db.query(
            'INSERT INTO students (name, department, phone, email, gender, dp, usn, password, duration, paid_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, department, phone, email, gender, dp, newUsn, password, duration || '6 Months', paid_status || 'Not Paid'],
            (err2) => {
                if (err2) {
                    if (err2.code === 'ER_DUP_ENTRY') return res.status(400).send('Generated USN already exists ❌');
                    return res.status(500).send(err2);
                }
                res.json({ success: true, message: 'Student Added ✅', usn: newUsn });
            }
        );
    });
});

// Check USN availability
router.get('/check-usn/:usn', (req, res) => {
    const usn = req.params.usn;
    db.query('SELECT id FROM students WHERE usn = ?', [usn], (err, result) => {
        if (err) return res.status(500).send(err);
        if (result.length > 0) {
            res.json({ available: false });
        } else {
            res.json({ available: true });
        }
    });
});

// Login student
router.post('/login', (req, res) => {
    const { usn, password } = req.body;
    db.query(
        `SELECT s.*, r.room_number, r.capacity, r.occupied_count 
         FROM students s 
         LEFT JOIN rooms r ON s.room_id = r.id 
         WHERE s.usn = ? AND s.password = ?`,
        [usn, password],
        (err, result) => {
            if (err) return res.status(500).send(err);
            if (result.length > 0) {
                res.json({ success: true, student: result[0] });
            } else {
                res.json({ success: false, message: 'Invalid credentials' });
            }
        }
    );
});

// Get all students
router.get('/', (req, res) => {
    db.query('SELECT * FROM students', (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result);
    });
});


// ================== UPDATE STUDENT (ADDED) ==================

router.put('/:id', upload.single('dp'), (req, res) => {
    const { name, email, department, duration, paid_status } = req.body;
    const id = req.params.id;
    const dp = req.file ? req.file.filename : null;

    if (dp) {
        db.query(
            'UPDATE students SET name = ?, email = ?, department = ?, duration = ?, paid_status = ?, dp = ? WHERE id = ?',
            [name, email, department, duration, paid_status || 'Not Paid', dp, id],
            (err, result) => {
                if (err) return res.status(500).send(err);
                res.send('Student updated successfully ✅');
            }
        );
    } else {
        db.query(
            'UPDATE students SET name = ?, email = ?, department = ?, duration = ?, paid_status = ? WHERE id = ?',
            [name, email, department, duration, paid_status || 'Not Paid', id],
            (err, result) => {
                if (err) return res.status(500).send(err);
                res.send('Student updated successfully ✅');
            }
        );
    }
});

// ================== UPDATE PAYMENT STATUS (ADDED) ==================
router.post('/pay/:id', (req, res) => {
    const id = req.params.id;
    db.query("UPDATE students SET paid_status = 'Payment Pending for Approval' WHERE id = ?", [id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true, message: 'Payment marked as pending verification ⏳' });
    });
});

// Admin Approve Payment
router.post('/pay/approve/:id', (req, res) => {
    const id = req.params.id;
    db.query("UPDATE students SET paid_status = 'Paid' WHERE id = ?", [id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true, message: 'Payment Approved ✅' });
    });
});

// Admin Decline Payment
router.post('/pay/decline/:id', (req, res) => {
    const id = req.params.id;
    db.query("UPDATE students SET paid_status = 'Not Paid' WHERE id = ?", [id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true, message: 'Payment Declined ❌' });
    });
});


module.exports = router;
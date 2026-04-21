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

// Add student
router.post('/add', upload.single('dp'), (req, res) => {
    const { name, phone, email, gender } = req.body;
    const dp = req.file ? req.file.filename : null;

    db.query(
        'INSERT INTO students (name, phone, email, gender, dp) VALUES (?, ?, ?, ?, ?)',
        [name, phone, email, gender, dp],
        (err, result) => {
            if (err) return res.status(500).send(err);
            res.send('Student Added ✅');
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
    const { name, email } = req.body;
    const id = req.params.id;
    const dp = req.file ? req.file.filename : null;

    if (dp) {
        db.query(
            'UPDATE students SET name = ?, email = ?, dp = ? WHERE id = ?',
            [name, email, dp, id],
            (err, result) => {
                if (err) return res.status(500).send(err);
                if (result.affectedRows === 0) return res.send('Student not found ❌');
                res.send('Student Updated ✅');
            }
        );
    } else {
        db.query(
            'UPDATE students SET name = ?, email = ? WHERE id = ?',
            [name, email, id],
            (err, result) => {
                if (err) return res.status(500).send(err);
                if (result.affectedRows === 0) return res.send('Student not found ❌');
                res.send('Student Updated ✅');
            }
        );
    }
});


module.exports = router;
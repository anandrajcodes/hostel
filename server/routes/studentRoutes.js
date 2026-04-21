const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Add student
router.post('/add', (req, res) => {
    const { name, phone, email, gender } = req.body;

    db.query(
        'INSERT INTO students (name, phone, email, gender) VALUES (?, ?, ?, ?)',
        [name, phone, email, gender],
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

router.put('/:id', (req, res) => {
    const { name, email } = req.body;
    const id = req.params.id;

    db.query(
        'UPDATE students SET name = ?, email = ? WHERE id = ?',
        [name, email, id],
        (err, result) => {
            if (err) return res.status(500).send(err);

            if (result.affectedRows === 0) {
                return res.send('Student not found ❌');
            }

            res.send('Student Updated ✅');
        }
    );
});


module.exports = router;
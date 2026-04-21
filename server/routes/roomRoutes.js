const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Add room
router.post('/add', (req, res) => {
    const { room_number, capacity } = req.body;

    if (!room_number || !capacity) {
        return res.status(400).send('All fields required');
    }

    db.query(
        'INSERT INTO rooms (room_number, capacity) VALUES (?, ?)',
        [room_number, capacity],
        (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Error adding room');
            }
            res.send('Room Added ✅');
        }
    );
});

// Get all rooms
router.get('/', (req, res) => {
    db.query('SELECT * FROM rooms', (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error fetching rooms');
        }
        res.json(result);
    });
});

// Delete room (only if empty)
router.delete('/:id', (req, res) => {
    const roomId = req.params.id;

    // Check if room is empty
    db.query(
        'SELECT occupied_count FROM rooms WHERE id = ?',
        [roomId],
        (err, result) => {
            if (err) return res.status(500).send(err);

            if (result[0].occupied_count > 0) {
                return res.send('Room is not empty ❌');
            }

            // Delete room
            db.query(
                'DELETE FROM rooms WHERE id = ?',
                [roomId],
                (err, result) => {
                    if (err) return res.status(500).send(err);
                    res.send('Room Deleted ✅');
                }
            );
        }
    );
});

module.exports = router;
const express = require('express');
const cors = require('cors');
const db = require('./config/db');

const studentRoutes = require('./routes/studentRoutes');
const roomRoutes = require('./routes/roomRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/students', studentRoutes);
app.use('/api/rooms', roomRoutes);


// ================== ALLOCATION ==================

// ✅ SMART Assign / Reassign Room
app.post('/api/allocate', (req, res) => {
    const { student_id, room_id } = req.body;

    db.query(
        'SELECT room_id FROM students WHERE id = ?',
        [student_id],
        (err, result) => {
            if (err) return res.status(500).send(err);

            const oldRoom = result[0]?.room_id;

            db.query(
                'SELECT capacity, occupied_count FROM rooms WHERE id = ?',
                [room_id],
                (err, result) => {
                    if (err) return res.status(500).send(err);

                    const room = result[0];

                    if (!room) return res.send('Room not found ❌');

                    if (room.occupied_count >= room.capacity) {
                        return res.send('Room Full ❌');
                    }

                    if (oldRoom && oldRoom != room_id) {
                        db.query(
                            'UPDATE rooms SET occupied_count = occupied_count - 1 WHERE id = ?',
                            [oldRoom],
                            (err) => {
                                if (err) return res.status(500).send(err);
                                assignNewRoom();
                            }
                        );
                    } else {
                        assignNewRoom();
                    }

                    function assignNewRoom() {
                        db.query(
                            'UPDATE students SET room_id = ? WHERE id = ?',
                            [room_id, student_id],
                            (err) => {
                                if (err) return res.status(500).send(err);

                                db.query(
                                    'UPDATE rooms SET occupied_count = occupied_count + 1 WHERE id = ?',
                                    [room_id],
                                    (err) => {
                                        if (err) return res.status(500).send(err);

                                        res.send('Room Assigned / Updated ✅');
                                    }
                                );
                            }
                        );
                    }
                }
            );
        }
    );
});


// ================== DEALLOCATE ==================

app.post('/api/deallocate', (req, res) => {
    const { student_id } = req.body;

    db.query(
        'SELECT room_id FROM students WHERE id = ?',
        [student_id],
        (err, result) => {
            if (err) return res.status(500).send(err);

            const room_id = result[0]?.room_id;

            if (!room_id) return res.send('Student not assigned');

            db.query(
                'UPDATE students SET room_id = NULL WHERE id = ?',
                [student_id],
                (err) => {
                    if (err) return res.status(500).send(err);

                    db.query(
                        'UPDATE rooms SET occupied_count = occupied_count - 1 WHERE id = ?',
                        [room_id],
                        (err) => {
                            if (err) return res.status(500).send(err);

                            res.send('Room Removed ✅');
                        }
                    );
                }
            );
        }
    );
});


// ================== DELETE STUDENT ==================

app.delete('/api/students/:id', (req, res) => {
    const id = req.params.id;

    db.query(
        'SELECT room_id FROM students WHERE id = ?',
        [id],
        (err, result) => {
            if (err) return res.status(500).send(err);

            const room_id = result[0]?.room_id;

            if (room_id) {
                db.query(
                    'UPDATE rooms SET occupied_count = occupied_count - 1 WHERE id = ?',
                    [room_id],
                    (err) => {
                        if (err) return res.status(500).send(err);
                        deleteStudent();
                    }
                );
            } else {
                deleteStudent();
            }

            function deleteStudent() {
                db.query(
                    'DELETE FROM students WHERE id = ?',
                    [id],
                    (err) => {
                        if (err) return res.status(500).send(err);
                        res.send('Student Deleted ✅');
                    }
                );
            }
        }
    );
});


// ================== DELETE ROOM (SAFE) ==================

app.delete('/api/rooms/:id', (req, res) => {
    const id = req.params.id;

    // 🔹 Check if any students are inside
    db.query(
        'SELECT COUNT(*) AS total FROM students WHERE room_id = ?',
        [id],
        (err, result) => {
            if (err) return res.status(500).send(err);

            if (result[0].total > 0) {
                return res.send('Room not empty ❌');
            }

            // 🔹 Safe delete
            db.query(
                'DELETE FROM rooms WHERE id = ?',
                [id],
                (err) => {
                    if (err) return res.status(500).send(err);

                    res.send('Room Deleted ✅');
                }
            );
        }
    );
});


// ================== TEST ==================

app.get('/', (req, res) => {
    res.send('Server running');
});


// ================== START ==================

app.listen(5000, () => {
    console.log('Server running on port 5000');
});
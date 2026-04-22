const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const path = require('path');

const studentRoutes = require('./routes/studentRoutes');
const roomRoutes = require('./routes/roomRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Expose uploads directory to the public
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Auto-Migration: Setup Tables & Columns
db.query(
    "SELECT count(*) as count FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'hostel_db' AND TABLE_NAME = 'students' AND COLUMN_NAME = 'dp'",
    (err, result) => {
        if (!err && result[0].count === 0) {
            db.query("ALTER TABLE students ADD COLUMN dp VARCHAR(255)", () => console.log("✅ Added 'dp' column."));
        }
    }
);

db.query(
    "SELECT count(*) as count FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'hostel_db' AND TABLE_NAME = 'students' AND COLUMN_NAME = 'usn'",
    (err, result) => {
        if (!err && result[0].count > 0) {
            db.query("ALTER TABLE students DROP COLUMN usn", () => console.log("✅ Dropped 'usn' column."));
        }
    }
);

db.query(
    "SELECT count(*) as count FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'hostel_db' AND TABLE_NAME = 'students' AND COLUMN_NAME = 'department'",
    (err, result) => {
        if (!err && result[0].count === 0) {
            db.query("ALTER TABLE students ADD COLUMN department VARCHAR(50)", (err2) => {
                if (!err2) {
                    console.log("✅ Added 'department' column.");
                    db.query("UPDATE students SET department = ELT(FLOOR(1 + (RAND() * 12)), 'CSE','ISE','ECE','CV','MECH','ETE','AI/ML','CSD','CG','CY','MATH','BT') WHERE department IS NULL", (err3) => {
                        if (!err3) console.log("✅ Backfilled departments for all students safely!");
                    });
                }
            });
        } else {
             // In case column was there, ensure everyone has a department
             db.query("UPDATE students SET department = ELT(FLOOR(1 + (RAND() * 12)), 'CSE','ISE','ECE','CV','MECH','ETE','AI/ML','CSD','CG','CY','MATH','BT') WHERE department IS NULL OR department = ''", () => {});
        }
    }
);

db.query(
    "CREATE TABLE IF NOT EXISTS settings (setting_key VARCHAR(50) PRIMARY KEY, setting_value VARCHAR(255))",
    (err) => {
        if (!err) {
            db.query("INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('admin_code', '000000')");
        }
    }
);

// ✅ Auth Routes
app.post('/api/auth/verify', (req, res) => {
    const { code } = req.body;
    db.query("SELECT setting_value FROM settings WHERE setting_key = 'admin_code'", (err, result) => {
        if (err) return res.status(500).send(err);
        if (result.length > 0 && result[0].setting_value === code) {
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'Invalid Admin Code' });
        }
    });
});

app.post('/api/auth/update', (req, res) => {
    const { newCode } = req.body;
    db.query("UPDATE settings SET setting_value = ? WHERE setting_key = 'admin_code'", [newCode], (err) => {
        if (err) return res.status(500).send(err);
        res.send('Admin code updated successfully ✅');
    });
});

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


// ================== SMART AUTO ALLOCATE ==================
app.post('/api/smart-allocate', (req, res) => {
    // 1. Get all unassigned students
    db.query('SELECT * FROM students WHERE room_id IS NULL', (err, unassignedStudents) => {
        if (err) return res.status(500).send(err);
        if (unassignedStudents.length === 0) return res.send('No unassigned students found ✅');

        // 2. Get all rooms with space
        db.query('SELECT * FROM rooms WHERE occupied_count < capacity', (err, availableRooms) => {
            if (err) return res.status(500).send(err);
            if (availableRooms.length === 0) return res.send('Room Capacity Full ❌');

            // 3. Get mapping of what departments are in what room
            db.query('SELECT room_id, department FROM students WHERE room_id IS NOT NULL', (err, occupants) => {
                if (err) return res.status(500).send(err);

                let roomDepts = {};
                occupants.forEach(occ => {
                    if (!roomDepts[occ.room_id]) roomDepts[occ.room_id] = new Set();
                    if (occ.department) roomDepts[occ.room_id].add(occ.department);
                });

                let updates = [];
                let roomCapacities = {};
                let roomIsEmpty = {};
                availableRooms.forEach(r => {
                    roomCapacities[r.id] = r.capacity - r.occupied_count;
                    roomIsEmpty[r.id] = (r.occupied_count === 0);
                });

                let deptGroups = {};
                unassignedStudents.forEach(s => {
                    let d = s.department || 'UNKNOWN';
                    if (!deptGroups[d]) deptGroups[d] = [];
                    deptGroups[d].push(s);
                });

                let sortedDepts = Object.keys(deptGroups).sort((a,b) => deptGroups[b].length - deptGroups[a].length);

                for (let dept of sortedDepts) {
                    for (let student of deptGroups[dept]) {
                        let assignedRoomId = null;
                        let targetDept = student.department;

                        // Pass 1: Same Department Room
                        for (let r of availableRooms) {
                            if (roomCapacities[r.id] > 0 && roomDepts[r.id] && roomDepts[r.id].has(targetDept)) {
                                assignedRoomId = r.id;
                                break;
                            }
                        }

                        // Pass 2: Completely Empty Room
                        if (!assignedRoomId) {
                            for (let r of availableRooms) {
                                if (roomCapacities[r.id] > 0 && roomIsEmpty[r.id]) {
                                    assignedRoomId = r.id;
                                    break;
                                }
                            }
                        }

                        // Pass 3: Random Available Space
                        if (!assignedRoomId) {
                            for (let r of availableRooms) {
                                if (roomCapacities[r.id] > 0) {
                                    assignedRoomId = r.id;
                                    break;
                                }
                            }
                        }

                        if (assignedRoomId) {
                            roomCapacities[assignedRoomId]--;
                            roomIsEmpty[assignedRoomId] = false;
                            
                            if (!roomDepts[assignedRoomId]) roomDepts[assignedRoomId] = new Set();
                            if (targetDept) roomDepts[assignedRoomId].add(targetDept);

                            updates.push(new Promise((resolve, reject) => {
                                db.query('UPDATE students SET room_id = ? WHERE id = ?', [assignedRoomId, student.id], (err) => {
                                    if (err) return reject(err);
                                    db.query('UPDATE rooms SET occupied_count = occupied_count + 1 WHERE id = ?', [assignedRoomId], (err2) => {
                                        if (err2) return reject(err2);
                                        resolve();
                                    });
                                });
                            }));
                        }
                    }
                }

                Promise.all(updates).then(() => {
                    res.send(`Auto Assigned ${updates.length} students successfully ✅`);
                }).catch(err => res.status(500).send(err));
            });
        });
    });
});

// ================== SMART SHUFFLE ==================
app.post('/api/smart-shuffle', (req, res) => {
    // 1. Get all ASSIGNED students
    db.query('SELECT * FROM students WHERE room_id IS NOT NULL', (err, assignedStudents) => {
        if (err) return res.status(500).send(err);
        if (assignedStudents.length === 0) return res.send('No assigned students found ✅');

        // 2. Get all rooms
        db.query('SELECT * FROM rooms', (err, rooms) => {
            if (err) return res.status(500).send(err);
            if (rooms.length === 0) return res.send('No rooms available ❌');

            let updates = [];
            let roomCapacities = {};
            let roomIsEmpty = {};
            let roomDepts = {};

            // Reset capacities assuming all assigned students are temporarily unassigned in memory
            rooms.forEach(r => {
                roomCapacities[r.id] = r.capacity; 
                roomIsEmpty[r.id] = true;
                roomDepts[r.id] = new Set();
            });

            // Group assigned students by dept
            let deptGroups = {};
            assignedStudents.forEach(s => {
                let d = s.department || 'UNKNOWN';
                if (!deptGroups[d]) deptGroups[d] = [];
                deptGroups[d].push(s);
            });

            let sortedDepts = Object.keys(deptGroups).sort((a,b) => deptGroups[b].length - deptGroups[a].length);

            // Calculate new assignments
            for (let dept of sortedDepts) {
                for (let student of deptGroups[dept]) {
                    let assignedRoomId = null;
                    let targetDept = student.department;

                    // Pass 1: Same Department Room
                    for (let r of rooms) {
                        if (roomCapacities[r.id] > 0 && roomDepts[r.id].has(targetDept)) {
                            assignedRoomId = r.id;
                            break;
                        }
                    }

                    // Pass 2: Completely Empty Room
                    if (!assignedRoomId) {
                        for (let r of rooms) {
                            if (roomCapacities[r.id] > 0 && roomIsEmpty[r.id]) {
                                assignedRoomId = r.id;
                                break;
                            }
                        }
                    }

                    // Pass 3: Random Available Space
                    if (!assignedRoomId) {
                        for (let r of rooms) {
                            if (roomCapacities[r.id] > 0) {
                                assignedRoomId = r.id;
                                break;
                            }
                        }
                    }

                    if (assignedRoomId) {
                        roomCapacities[assignedRoomId]--;
                        roomIsEmpty[assignedRoomId] = false;
                        if (targetDept) roomDepts[assignedRoomId].add(targetDept);

                        updates.push(new Promise((resolve, reject) => {
                            db.query('UPDATE students SET room_id = ? WHERE id = ?', [assignedRoomId, student.id], (err) => {
                                if (err) return reject(err);
                                resolve();
                            });
                        }));
                    }
                }
            }

            Promise.all(updates).then(() => {
                // Update occupied_count of all rooms to reflect actual currently assigned students
                db.query(`
                    UPDATE rooms r
                    SET occupied_count = (SELECT COUNT(*) FROM students s WHERE s.room_id = r.id)
                `, (err) => {
                    if (err) return res.status(500).send(err);
                    res.send(`Smart Shuffled ${updates.length} students successfully ✅`);
                });
            }).catch(err => res.status(500).send(err));
        });
    });
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
const db = require('./config/db');

db.query(
    'ALTER TABLE students CHANGE username usn VARCHAR(255)',
    (err, result) => {
        if (err) {
            if (err.code === 'ER_BAD_FIELD_ERROR') {
                console.log('Column username does not exist, it might already be usn.');
            } else {
                console.error('Migration Error:', err);
            }
        } else {
            console.log('Migration Successful: renamed username to usn.');
        }
        process.exit(0);
    }
);

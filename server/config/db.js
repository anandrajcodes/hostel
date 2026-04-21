const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root123',   // your password
    database: 'hostel_db',
    port: 3307             // IMPORTANT
});

db.connect((err) => {
    if (err) {
        console.log('DB Error:', err);
    } else {
        console.log('MySQL Connected ✅');
    }
});

module.exports = db;
const db = require('./config/db');

const DEPT_MAP = {
    'CSE': 'CS',
    'ISE': 'IS',
    'MECH': 'ME',
    'ECE': 'EC',
    'CV': 'CV',
    'ETE': 'ET',
    'AI/ML': 'AI',
    'CSD': 'CD',
    'CG': 'CG',
    'CY': 'CY',
    'MATH': 'MT',
    'BT': 'BT'
};

db.query("SELECT id, department, usn FROM students WHERE usn IS NULL OR usn = '' OR usn NOT LIKE '1DS24%'", async (err, students) => {
    if (err) {
        console.error("Error fetching students:", err);
        process.exit(1);
    }

    if (students.length === 0) {
        console.log("All students already have correct USNs.");
        process.exit(0);
    }

    console.log(`Found ${students.length} students needing USN fixes.`);

    for (const student of students) {
        let dept = student.department || 'CSE'; // Default if null
        let abbrev = DEPT_MAP[dept] || 'CS';

        // Find max sequence for this department
        const maxQuery = `SELECT usn FROM students WHERE usn LIKE '1DS24${abbrev}%' ORDER BY usn DESC LIMIT 1`;
        
        await new Promise((resolve, reject) => {
            db.query(maxQuery, (err, res) => {
                if (err) return reject(err);
                
                let seq = 1;
                if (res.length > 0 && res[0].usn) {
                    const lastUSN = res[0].usn;
                    const numPart = lastUSN.replace(`1DS24${abbrev}`, '');
                    const num = parseInt(numPart, 10);
                    if (!isNaN(num)) {
                        seq = num + 1;
                    }
                }
                
                const newUSN = `1DS24${abbrev}${String(seq).padStart(3, '0')}`;
                
                db.query("UPDATE students SET usn = ? WHERE id = ?", [newUSN, student.id], (err) => {
                    if (err) return reject(err);
                    console.log(`Updated student ID ${student.id} to USN: ${newUSN}`);
                    resolve();
                });
            });
        });
    }

    console.log("Migration Complete.");
    process.exit(0);
});

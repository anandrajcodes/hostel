const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Replacements for USN (Case sensitive replacements first)
content = content.replace(/Username/g, 'USN');
content = content.replace(/username/g, 'usn'); 
// The word username might have been converted to usn in check-username -> check-usn
// unique_username -> unique_usn

// 2. Fix Payment Completion Redirect Bug in handlePaymentComplete
// It was:
// setLoggedInStudent({ ...loggedInStudent, paid_status: 'Pending' });
// setAppView("student_profile");
// Wait, the user said it gets stuck because it didn't redirect or wait properly.
// Let's manually replace the handlePaymentComplete function block.
const handlePaymentCompleteStr = `const handlePaymentComplete = async () => {
    try {
      const res = await axios.post(\`\${API}/api/students/pay/\${loggedInStudent.id}\`);
      if (res.data.success) {
        toast.success(res.data.message);
        setLoggedInStudent({ ...loggedInStudent, paid_status: 'Payment Pending for Approval' });
        setAppView("student_profile");
        fetchData(); // Refresh list silently
      } else {
        toast.error("Failed to mark payment as pending");
      }
    } catch (err) {
      toast.error("Network Error during payment update");
    }
  };`;

// We use regex to replace the old handlePaymentComplete
content = content.replace(/const handlePaymentComplete = async \(\) => \{[\s\S]*?catch \(err\) \{[\s\S]*?toast\.error\("Network Error during payment update"\);\s*\}\s*\};/, handlePaymentCompleteStr);

// 3. Replace 'Pending' payment status with 'Payment Pending for Approval' ONLY where appropriate
// We'll replace exact string matches of the exact state 'Pending'
content = content.replace(/=== 'Pending'/g, "=== 'Payment Pending for Approval'");
content = content.replace(/!== 'Pending'/g, "!== 'Payment Pending for Approval'");
content = content.replace(/paid_status: 'Pending'/g, "paid_status: 'Payment Pending for Approval'");

// 4. Update the color logic in student_profile for 'Payment Pending for Approval'
// In the style block for payment-status-card:
// background: loggedInStudent.paid_status === 'Paid' ? "#e8f8f5" : loggedInStudent.paid_status === 'Payment Pending for Approval' ? "#fef5e7" : "#fdedec"
// border: `1px solid ${... === 'Paid' ? "#1abc9c" : ... === 'Payment Pending for Approval' ? "#f39c12" : "#e74c3c"}`
// It's already handling it correctly because we replaced === 'Pending' with === 'Payment Pending for Approval'!

// 5. Update the text label for Payment Verification Pending ⏳
content = content.replace(/Payment Verification Pending ⏳/g, "Payment Pending for Approval ⏳");
content = content.replace(/Pending Verification/g, "Payment Pending for Approval"); // In the Admin dashboard labels

// 6. Fix "Payment Pending 🔴" logic
// Wait, if it's Not Paid, it says Payment Pending 🔴. The user said:
// Profile Page After Payment Completion: Payment Status should display "Payment Pending for Approval" in yellow/orange.
// Hide the Pay Now button while approval is pending.
// It is already hidden if !== 'Not Paid'. The code was:
// loggedInStudent.paid_status === 'Not Paid' && (<button Pay Now ... />)
// Wait, the default was 'Not Paid'. The script replaced 'Pending' with 'Payment Pending for Approval'. So it's fine.

fs.writeFileSync(filePath, content);
console.log('App.js terminology updated.');

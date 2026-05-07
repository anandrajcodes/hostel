const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add state variable
if (!content.includes('adminViewingStudent')) {
    content = content.replace(
        'const [loggedInStudent, setLoggedInStudent] = useState(null);',
        'const [loggedInStudent, setLoggedInStudent] = useState(null);\n  const [adminViewingStudent, setAdminViewingStudent] = useState(null);'
    );
}

// 2. Add button in row-actions
const targetButtonBlock = `<button onClick={() => setEditData({ id: s.id, name: s.name, department: s.department || "", email: s.email, duration: s.duration || "6 Months", paid_status: s.paid_status || 'Not Paid' })} title="Edit Student">✏️</button>`;
const newButtonBlock = `<button onClick={() => { setAdminViewingStudent(s); setAdminView("view_profile"); }} title="View Profile">👤</button>
                          ${targetButtonBlock}`;

content = content.replace(targetButtonBlock, newButtonBlock);

// 3. Add adminView === 'view_profile' section
const viewProfileModule = `
            {/* VIEW PROFILE MODULE */}
            {adminView === 'view_profile' && adminViewingStudent && (
              <div className="dashboard-grid" style={{ display: "block" }}>
                <section className="ui-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <button className="auth-btn-outline" onClick={() => { setAdminView("student_details"); setAdminViewingStudent(null); }} style={{ padding: "8px 15px" }}>⬅ Back to List</button>
                    <h3 style={{ margin: 0 }}>Student Profile View</h3>
                  </div>

                  <div className="profile-container fade-in" style={{ padding: 0 }}>
                    <div className="profile-card" style={{ maxWidth: "100%", margin: 0 }}>
                      <div className="profile-header-banner"></div>
                      
                      <div className="profile-avatar-section">
                         <div className="profile-avatar-wrapper">
                            {adminViewingStudent.dp ? <img src={\`\${API}/uploads/\${adminViewingStudent.dp}\`} alt="dp" /> : <div className="avatar-placeholder">{adminViewingStudent.name.charAt(0)}</div>}
                         </div>
                         <h2 className="profile-name">{adminViewingStudent.name}</h2>
                         <span className="profile-department-badge">{adminViewingStudent.department}</span>
                      </div>

                      <div className="profile-content-grid">
                         <div className="profile-section room-section">
                            <h3 className="profile-section-title">Room Allocation</h3>
                            {adminViewingStudent.room_id ? (
                              <div className="room-details-card">
                                 <div className="room-info">
                                   <span className="room-number-display">Room {rooms.find(r => r.id === adminViewingStudent.room_id)?.room_number}</span>
                                 </div>
                                 <div className="room-icon">🚪</div>
                              </div>
                            ) : (
                              <div className="room-pending-card">
                                 <span>Not Assigned</span>
                                 <p>Student is currently unassigned.</p>
                              </div>
                            )}

                            <h3 className="profile-section-title" style={{ marginTop: "20px" }}>Payment Status</h3>
                            <div className={\`payment-status-card \${adminViewingStudent.paid_status === 'Paid' ? 'paid' : adminViewingStudent.paid_status === 'Payment Pending for Approval' ? 'pending' : 'unpaid'}\`} style={{
                              padding: "15px",
                              borderRadius: "10px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              background: adminViewingStudent.paid_status === 'Paid' ? "#e8f8f5" : adminViewingStudent.paid_status === 'Payment Pending for Approval' ? "#fef5e7" : "#fdedec",
                              border: \`1px solid \${adminViewingStudent.paid_status === 'Paid' ? "#1abc9c" : adminViewingStudent.paid_status === 'Payment Pending for Approval' ? "#f39c12" : "#e74c3c"}\`
                            }}>
                              <div>
                                <span style={{ fontSize: "1rem", color: "#555" }}>Duration: {adminViewingStudent.duration || "6 Months"}</span>
                                <h4 style={{ color: adminViewingStudent.paid_status === 'Paid' ? "#16a085" : adminViewingStudent.paid_status === 'Payment Pending for Approval' ? "#d35400" : "#c0392b", fontSize: "1.2rem", margin: "5px 0 0 0" }}>
                                  {adminViewingStudent.paid_status === 'Paid' ? "Payment Completed ✅" : adminViewingStudent.paid_status === 'Payment Pending for Approval' ? "Payment Pending for Approval ⏳" : "Payment Pending 🔴"}
                                </h4>
                              </div>
                            </div>
                         </div>

                         <div className="profile-section contact-section">
                            <h3 className="profile-section-title">Contact Details</h3>
                            <div className="contact-details-list">
                               <div className="contact-item">
                                  <span className="contact-label">Email</span>
                                  <span className="contact-value">{adminViewingStudent.email}</span>
                               </div>
                               <div className="contact-item">
                                  <span className="contact-label">Phone</span>
                                  <span className="contact-value">{adminViewingStudent.phone}</span>
                               </div>
                               <div className="contact-item">
                                  <span className="contact-label">Gender</span>
                                  <span className="contact-value">{adminViewingStudent.gender}</span>
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="profile-footer">
                         <span>Account USN: <strong>{adminViewingStudent.usn}</strong></span>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}
`;

const anchor = `{/* ROOM MANAGEMENT MODULE */}`;
if (!content.includes("VIEW PROFILE MODULE")) {
    content = content.replace(anchor, viewProfileModule + '\n            ' + anchor);
}

fs.writeFileSync(filePath, content);
console.log('App.js view profile injected successfully.');

import React, { useEffect, useState } from "react";
import axios from "axios";

// ✅ TOAST IMPORTS
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  // ROUTING & VIEW STATES
  const [appView, setAppView] = useState("welcome"); // "welcome", "role", "student", "admin_auth", "dashboard"
  const [doorOpen, setDoorOpen] = useState(false);
  const [adminCodeInput, setAdminCodeInput] = useState("");
  const [newAdminCode, setNewAdminCode] = useState("");

  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedRoom, setSelectedRoom] = useState(null);

  // Added Department, Duration, Paid Status to models
  const [student, setStudent] = useState({ name: "", department: "", phone: "", email: "", gender: "Male", dp: null, usn: "", password: "", duration: "6 Months", paid_status: "Not Paid" });
  const [loginData, setLoginData] = useState({ usn: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [adminView, setAdminView] = useState("overview");
  const [oldAdminCode, setOldAdminCode] = useState("");
  const [loggedInStudent, setLoggedInStudent] = useState(null);
  const [adminViewingStudent, setAdminViewingStudent] = useState(null);
  const [usnAvailable, setUSNAvailable] = useState(null);
  const [room, setRoom] = useState({ room_number: "", capacity: "" });
  const [alloc, setAlloc] = useState({ student_id: "", room_id: "" });
  const [moveData, setMoveData] = useState({ student_id: "", room_id: "" });
  const [editData, setEditData] = useState({ id: "", name: "", department: "", email: "", duration: "", paid_status: "Not Paid", dp: null });

  const API = "http://localhost:5000";

  const fetchData = async () => {
    try {
      const s = await axios.get(`${API}/api/students`);
      const r = await axios.get(`${API}/api/rooms`);
      setStudents(s.data);
      setRooms(r.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  // API Methods
  const checkUSN = async () => {
    if (!student.usn) return;
    try {
      const res = await axios.get(`${API}/api/students/check-usn/${student.usn}`);
      setUSNAvailable(res.data.available);
      if (!res.data.available) toast.error("USN is already taken");
    } catch (err) { console.error(err); }
  };

  const addStudent = async () => {
    const formData = new FormData();
    formData.append('name', student.name);
    formData.append('department', student.department);
    formData.append('phone', student.phone);
    formData.append('email', student.email);
    formData.append('gender', student.gender);
    formData.append('password', student.password);
    formData.append('duration', student.duration);
    formData.append('paid_status', student.paid_status);
    if (student.dp) formData.append('dp', student.dp);

    try {
      const res = await axios.post(`${API}/api/students/add`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      
      const successMsg = res.data.usn ? `Registration Successful! Your USN is: ${res.data.usn}` : res.data.message;
      toast.success(successMsg, { autoClose: false });

      if (appView.startsWith("student_signup")) {
        setAppView("student_login");
      }
      setStudent({ name: "", department: "", phone: "", email: "", gender: "Male", dp: null, usn: "", password: "", duration: "6 Months", paid_status: "Not Paid" });
      fetchData();
    } catch (err) {
      if (err.response && err.response.data) toast.error(err.response.data);
      else toast.error("Registration failed");
    }
  };

  const loginStudent = async () => {
    if (!loginData.usn || !loginData.password) return toast.error("Please enter credentials");
    try {
      const res = await axios.post(`${API}/api/students/login`, loginData);
      if (res.data.success) {
        setLoggedInStudent(res.data.student);
        setAppView("student_profile");
        toast.success("Login Successful");
        setLoginData({ usn: "", password: "" });
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error("Login Error");
    }
  };

  const addRoom = async () => {
    const res = await axios.post(`${API}/api/rooms/add`, room);
    toast.success(res.data);
    setRoom({ room_number: "", capacity: "" });
    fetchData();
  };

  const allocate = async () => {
    const res = await axios.post(`${API}/api/allocate`, alloc);
    toast.success(res.data);
    setAlloc({ student_id: "", room_id: "" });
    fetchData();
  };

  const autoAssign = async () => {
    try {
      toast.info("⚡ Auto Allocating students...");
      const res = await axios.post(`${API}/api/smart-allocate`);
      toast.success(res.data);
      fetchData();
    } catch (err) {
      toast.error("Auto Allocation Error");
    }
  };

  const smartShuffle = async () => {
    try {
      toast.info("🔀 Smart Shuffling students by department...");
      const res = await axios.post(`${API}/api/smart-shuffle`);
      toast.success(res.data);
      fetchData();
    } catch (err) {
      toast.error("Smart Shuffle Error");
    }
  };

  const deallocate = async (id) => {
    const res = await axios.post(`${API}/api/deallocate`, { student_id: id });
    toast.success(res.data);
    fetchData();
  };

  const deleteStudent = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    const res = await axios.delete(`${API}/api/students/${id}`);
    toast.success(res.data);
    fetchData();
  };

  const moveStudent = async () => {
    if (!moveData.student_id || !moveData.room_id) return;
    const res = await axios.post(`${API}/api/allocate`, moveData);
    toast.success(res.data);
    setMoveData({ student_id: "", room_id: "" });
    fetchData();
  };

  const updateStudent = async () => {
    if (!editData.id) return toast.error("No student selected ❌");

    const formData = new FormData();
    formData.append('name', editData.name);
    formData.append('email', editData.email);
    formData.append('department', editData.department);
    formData.append('duration', editData.duration);
    formData.append('paid_status', editData.paid_status);
    if (editData.dp) formData.append('dp', editData.dp);

    const res = await axios.put(`${API}/api/students/${editData.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    toast.success(res.data);
    setEditData({ id: "", name: "", department: "", email: "", duration: "", paid_status: false, dp: null });
    fetchData();
  };

  // Auth Methods
  const handleEnterDoors = () => {
    setDoorOpen(true);
    setTimeout(() => {
      setAppView("role");
    }, 1200); // Trigger view switch after CSS animation completes
  };

  const handleVerifyAdmin = async () => {
    try {
      const res = await axios.post(`${API}/api/auth/verify`, { code: adminCodeInput });
      if (res.data.success) {
        setAppView("dashboard");
        setAdminCodeInput("");
        toast.success("Access Granted! Welcome Admin.");
      } else {
        toast.error("Invalid Secret Code");
      }
    } catch (err) {
      toast.error("Network Error verifying admin");
    }
  };

  const handleUpdateAdminCode = async () => {
    try {
      const res = await axios.post(`${API}/api/auth/update`, { oldCode: oldAdminCode, newCode: newAdminCode });
      if (res.data.success) {
        toast.success(res.data.message);
        setOldAdminCode("");
        setNewAdminCode("");
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error("Failed to update admin code");
    }
  };

  const handlePaymentComplete = async () => {
    try {
      const res = await axios.post(`${API}/api/students/pay/${loggedInStudent.id}`);
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
  };

  const handleApprovePayment = async (id) => {
    try {
      const res = await axios.post(`${API}/api/students/pay/approve/${id}`);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchData();
      }
    } catch (err) {
      toast.error("Failed to approve payment");
    }
  };

  const handleDeclinePayment = async (id) => {
    try {
      const res = await axios.post(`${API}/api/students/pay/decline/${id}`);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchData();
      }
    } catch (err) {
      toast.error("Failed to decline payment");
    }
  };

  return (
    <div className="app-container" style={{ minHeight: "100vh", position: "relative", overflowX: "hidden" }}>

      {/* 🚀 1. WELCOME ANIMATION VIEW */}
      {appView === "welcome" && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", backgroundColor: "#000", overflow: "hidden" }}>

          <div style={{ position: "absolute", zIndex: 10, width: "100%", height: "100%", display: "flex", pointerEvents: "none" }}>
            <div className={`door-left ${doorOpen ? 'open' : ''}`}>
              <div className="door-handle-left"></div>
            </div>
            <div className={`door-right ${doorOpen ? 'open' : ''}`}>
              <div className="door-handle-right"></div>
            </div>
          </div>

          <div style={{ position: "relative", zIndex: 20, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", height: "100vh" }}>
            {!doorOpen && (
              <>
                <h1 className="welcome-title">WELCOME TO HOSTEL HUB</h1>
                <button className="btn-enter" onClick={handleEnterDoors}>ENTER</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 🚀 2. ROLE SELECTION VIEW */}
      {appView === "role" && (
        <div className="auth-split-container fade-in">
          <div className="auth-form-side">
            <div className="auth-header">
              <div className="brand" style={{ marginBottom: "10px", display: "flex", alignItems: "center", gap: "10px", color: "#634091" }}>
                <div className="logo-icon" style={{ width: "35px", height: "35px", fontSize: "1.2rem", background: "#634091", color: "#fff", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>H</div>
                <span style={{ fontSize: "1.8rem", fontWeight: "700" }}>HostelHub</span>
              </div>
              <h1 style={{ fontSize: "2.8rem", color: "#222", fontWeight: "700", marginTop: "30px" }}>Select Your Role</h1>
              <p style={{ color: "#666", fontSize: "1.1rem", marginTop: "10px" }}>Please select how you want to access the system.</p>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "40px", width: "100%", maxWidth: "400px" }}>
              <button className="auth-btn-primary" style={{ padding: "20px", fontSize: "1.5rem" }} onClick={() => setAppView("student")}>
                🎓 Student Portal
              </button>
              <button className="auth-btn-outline" style={{ padding: "20px", fontSize: "1.5rem" }} onClick={() => setAppView("admin_auth")}>
                🛡️ Admin Subsystem
              </button>
            </div>
          </div>
          <div className="auth-image-side">
             <div className="auth-image-content">
               <h2>Your Campus Life, Managed.</h2>
               <p>Experience seamless hostel allocations and robust management tools.</p>
             </div>
          </div>
        </div>
      )}

      {/* 🚀 3. STUDENT PORTAL VIEW (AUTH CHOICE) */}
      {appView === "student" && (
        <div className="auth-split-container fade-in">
          <button className="admin-lock-btn" onClick={() => setAppView("admin_auth")} title="Admin Login">🔐</button>
          
          <div className="auth-form-side">
            <div className="auth-header">
              <div className="brand" style={{ marginBottom: "10px", display: "flex", alignItems: "center", gap: "10px", color: "#634091" }}>
                <div className="logo-icon" style={{ width: "35px", height: "35px", fontSize: "1.2rem", background: "#634091", color: "#fff", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>H</div>
                <span style={{ fontSize: "1.8rem", fontWeight: "700" }}>HostelHub</span>
              </div>
              <h1 style={{ fontSize: "2.8rem", color: "#222", fontWeight: "700", marginTop: "30px" }}>Student Portal</h1>
              <p style={{ color: "#666", fontSize: "1.1rem", marginTop: "10px" }}>Sign up for accommodation or log in to your dashboard.</p>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "40px", width: "100%", maxWidth: "400px" }}>
              <button className="auth-btn-primary" onClick={() => setAppView("student_login")}>Sign in</button>
              <button className="auth-btn-outline" onClick={() => setAppView("student_signup_step1")}>Sign up</button>
              <div style={{ textAlign: "center", marginTop: "20px" }}>
                <button className="auth-btn-link" onClick={() => setAppView("role")}>← Back to Roles</button>
              </div>
            </div>
          </div>
          <div className="auth-image-side">
             <div className="auth-image-content">
               <h2>Welcome to your campus home.</h2>
               <p>Join thousands of students who have found their perfect room.</p>
             </div>
          </div>
        </div>
      )}

      {/* 🚀 3.1. STUDENT SIGNUP STEP 1 */}
      {appView === "student_signup_step1" && (
        <div className="auth-split-container fade-in">
          <div className="auth-form-side">
            <div className="auth-header">
              <div className="brand" style={{ marginBottom: "10px", display: "flex", alignItems: "center", gap: "10px", color: "#634091" }}>
                <div className="logo-icon" style={{ width: "35px", height: "35px", fontSize: "1.2rem", background: "#634091", color: "#fff", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>H</div>
                <span style={{ fontSize: "1.8rem", fontWeight: "700" }}>HostelHub</span>
              </div>
              <h1 style={{ fontSize: "2.5rem", color: "#222", fontWeight: "700", marginTop: "20px" }}>Create an account</h1>
              <p style={{ color: "#666", fontSize: "1.1rem", marginTop: "10px" }}>Step 1: Please enter your personal details</p>
            </div>
            
            <div className="auth-form" style={{ marginTop: "30px" }}>
              <div className="auth-input-group">
                <label>Full Name</label>
                <input type="text" placeholder="John Doe" value={student.name} onChange={e => setStudent({ ...student, name: e.target.value })} />
              </div>
              
              <div className="auth-input-group">
                <label>Department</label>
                <select value={student.department} onChange={e => setStudent({ ...student, department: e.target.value })}>
                  <option value="">Select Department</option>
                  {['CSE', 'ISE', 'ECE', 'CV', 'MECH', 'ETE', 'AI/ML', 'CSD', 'CG', 'CY', 'MATH', 'BT'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="auth-input-group">
                <label>Stay Duration</label>
                <select value={student.duration} onChange={e => setStudent({ ...student, duration: e.target.value })}>
                  <option value="6 Months">6 Months</option>
                  <option value="12 Months">12 Months</option>
                </select>
              </div>

              <div className="auth-input-group">
                <label>Email Address</label>
                <input type="email" placeholder="john@example.com" value={student.email} onChange={e => setStudent({ ...student, email: e.target.value })} />
              </div>

              <div className="auth-input-group">
                <label>Phone Number</label>
                <input type="tel" placeholder="+1 234 567 890" value={student.phone} onChange={e => setStudent({ ...student, phone: e.target.value })} />
              </div>

              <div className="auth-input-group" style={{ marginBottom: "30px" }}>
                <label>Profile Picture</label>
                <input type="file" accept="image/*" onChange={e => setStudent({ ...student, dp: e.target.files[0] })} style={{ padding: "10px 0", background: "transparent", border: "none" }} />
              </div>
              
              <div style={{ display: "flex", gap: "15px" }}>
                <button className="auth-btn-outline" style={{ flex: 1 }} onClick={() => setAppView("student")}>Cancel</button>
                <button className="auth-btn-primary" style={{ flex: 2 }} onClick={() => {
                  if (!student.name || !student.department) return toast.error("Name and Department required");
                  setAppView("student_signup_step2");
                }}>Next Step</button>
              </div>
              
              <p className="auth-bottom-text">Already have an account? <span onClick={() => setAppView("student_login")}>Sign in</span></p>
            </div>
          </div>
          <div className="auth-image-side">
             <div className="auth-image-content">
               <h2>Almost there!</h2>
               <p>Your journey to a better campus life begins here.</p>
             </div>
          </div>
        </div>
      )}

      {/* 🚀 3.2. STUDENT SIGNUP STEP 2 */}
      {appView === "student_signup_step2" && (
        <div className="auth-split-container fade-in">
          <div className="auth-form-side">
            <div className="auth-header">
              <div className="brand" style={{ marginBottom: "10px", display: "flex", alignItems: "center", gap: "10px", color: "#634091" }}>
                <div className="logo-icon" style={{ width: "35px", height: "35px", fontSize: "1.2rem", background: "#634091", color: "#fff", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>H</div>
                <span style={{ fontSize: "1.8rem", fontWeight: "700" }}>HostelHub</span>
              </div>
              <h1 style={{ fontSize: "2.5rem", color: "#222", fontWeight: "700", marginTop: "20px" }}>Set your credentials</h1>
              <p style={{ color: "#666", fontSize: "1.1rem", marginTop: "10px" }}>Step 2: Choose a secure password. Your USN will be auto-generated.</p>
            </div>
            
            <div className="auth-form" style={{ marginTop: "30px" }}>
              <div className="auth-input-group">
                <label>Password</label>
                <div style={{ position: "relative" }}>
                  <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={student.password} onChange={e => setStudent({ ...student, password: e.target.value })} style={{ width: "100%" }} />
                  <span onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "15px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#666" }}>
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </span>
                </div>
              </div>
              
              <div style={{ display: "flex", gap: "15px", marginTop: "20px" }}>
                <button className="auth-btn-outline" style={{ flex: 1 }} onClick={() => setAppView("student_signup_step1")}>Back</button>
                <button className="auth-btn-primary" style={{ flex: 2 }} onClick={() => {
                  if (!student.password) return toast.error("Password required");
                  setAppView("student_signup_step3");
                }}>Next Step (Payment)</button>
              </div>
            </div>
          </div>
          <div className="auth-image-side">
             <div className="auth-image-content">
               <h2>Secure your account.</h2>
               <p>Your credentials will keep your personal and accommodation details safe.</p>
             </div>
          </div>
        </div>
      )}

      {/* 🚀 3.3. STUDENT SIGNUP STEP 3 (PAYMENT) */}
      {appView === "student_signup_step3" && (
        <div className="auth-split-container fade-in">
          <div className="auth-form-side">
            <div className="auth-header">
              <div className="brand" style={{ marginBottom: "10px", display: "flex", alignItems: "center", gap: "10px", color: "#634091" }}>
                <div className="logo-icon" style={{ width: "35px", height: "35px", fontSize: "1.2rem", background: "#634091", color: "#fff", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>H</div>
                <span style={{ fontSize: "1.8rem", fontWeight: "700" }}>HostelHub</span>
              </div>
              <h1 style={{ fontSize: "2.5rem", color: "#222", fontWeight: "700", marginTop: "20px" }}>Secure Your Room</h1>
              <p style={{ color: "#666", fontSize: "1.1rem", marginTop: "10px" }}>Step 3: Complete Payment for {student.duration}</p>
            </div>
            
            <div className="auth-form" style={{ marginTop: "30px" }}>
              <div style={{ background: "#f8f9fa", border: "1px solid #e9ecef", borderRadius: "12px", padding: "20px", marginBottom: "25px" }}>
                <h3 style={{ fontSize: "1.3rem", color: "#333", marginBottom: "15px" }}>Fee Breakdown</h3>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "1.1rem", color: "#555" }}>
                  <span>Duration Selected:</span>
                  <span style={{ fontWeight: "600", color: "#222" }}>{student.duration}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.1rem", color: "#555", borderBottom: "1px solid #ddd", paddingBottom: "15px", marginBottom: "15px" }}>
                  <span>Hostel Fee:</span>
                  <span style={{ fontWeight: "600", color: "#222" }}>
                    {student.duration === "6 Months" ? "₹ 60,000" : "₹ 1,00,000"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.4rem", fontWeight: "700", color: "#16a085" }}>
                  <span>Total Amount:</span>
                  <span>{student.duration === "6 Months" ? "₹ 60,000" : "₹ 1,00,000"}</span>
                </div>
              </div>
              
              <div className="auth-input-group" style={{ marginBottom: "25px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", padding: "15px", border: "2px solid #e0e0e0", borderRadius: "10px", cursor: "pointer", fontSize: "1.1rem", fontWeight: "600", transition: "0.2s" }}>
                  <input type="checkbox" style={{ width: "22px", height: "22px", cursor: "pointer", margin: 0 }} checked={student.paid_status === 'Payment Pending for Approval'} onChange={e => setStudent({ ...student, paid_status: e.target.checked ? 'Pending' : 'Not Paid' })} />
                  I have completed the payment
                </label>
              </div>
              
              <div style={{ display: "flex", gap: "15px" }}>
                <button className="auth-btn-outline" style={{ flex: 1 }} onClick={() => setAppView("student_signup_step2")}>Back</button>
                <button className="auth-btn-primary" style={{ flex: 2, background: student.paid_status === 'Payment Pending for Approval' ? "#16a085" : "#ccc", cursor: student.paid_status === 'Payment Pending for Approval' ? "pointer" : "not-allowed" }} disabled={student.paid_status !== 'Payment Pending for Approval'} onClick={() => {
                  if (student.paid_status !== 'Payment Pending for Approval') return toast.error("Please complete the payment to register.");
                  addStudent();
                }}>Complete Registration</button>
              </div>
            </div>
          </div>
          <div className="auth-image-side" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "40px" }}>
             <div style={{ background: "#fff", padding: "30px", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", textAlign: "center", maxWidth: "400px" }}>
               <h2 style={{ color: "#333", fontSize: "1.8rem", marginBottom: "20px" }}>Scan to Pay</h2>
               <img src={`${API}/uploads/qr.png`} alt="QR Code" style={{ width: "100%", height: "auto", borderRadius: "10px", border: "1px solid #eee" }} onError={(e) => { e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg'; }} />
               <p style={{ marginTop: "20px", color: "#666", fontSize: "1.1rem" }}>Open your UPI app and scan this QR code to complete your payment.</p>
             </div>
          </div>
        </div>
      )}

      {/* 🚀 3.3. STUDENT LOGIN */}
      {appView === "student_login" && (
        <div className="auth-split-container fade-in">
          <div className="auth-form-side">
            <div className="auth-header">
              <div className="brand" style={{ marginBottom: "10px", display: "flex", alignItems: "center", gap: "10px", color: "#634091" }}>
                <div className="logo-icon" style={{ width: "35px", height: "35px", fontSize: "1.2rem", background: "#634091", color: "#fff", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>H</div>
                <span style={{ fontSize: "1.8rem", fontWeight: "700" }}>HostelHub</span>
              </div>
              <h1 style={{ fontSize: "2.5rem", color: "#222", fontWeight: "700", marginTop: "20px" }}>Welcome back</h1>
              <p style={{ color: "#666", fontSize: "1.1rem", marginTop: "10px" }}>Please enter your details</p>
            </div>
            
            <div className="auth-form" style={{ marginTop: "30px" }}>
              <div className="auth-input-group">
                <label>USN</label>
                <input type="text" placeholder="Enter your usn" value={loginData.usn} onChange={e => setLoginData({ ...loginData, usn: e.target.value })} />
              </div>
              
              <div className="auth-input-group">
                <label>Password</label>
                <div style={{ position: "relative" }}>
                  <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={loginData.password} onChange={e => setLoginData({ ...loginData, password: e.target.value })} style={{ width: "100%" }} />
                  <span onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "15px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#666" }}>
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </span>
                </div>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", fontSize: "0.95rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "#444", cursor: "pointer" }}>
                  <input type="checkbox" style={{ width: "auto", margin: 0 }} /> Remember for 30 days
                </label>
                <span style={{ color: "#634091", fontWeight: "600", cursor: "pointer" }}>Forgot password</span>
              </div>
              
              <button className="auth-btn-primary" onClick={loginStudent} style={{ marginBottom: "15px", width: "100%" }}>Sign in</button>
              
              <button className="auth-btn-outline" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", width: "100%" }} onClick={() => toast.info("Google Login not implemented")}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="G" style={{ width: "20px" }} />
                Sign in with Google
              </button>
              
              <p className="auth-bottom-text">Don't have an account? <span onClick={() => setAppView("student_signup_step1")}>Sign up</span></p>
              <div style={{ textAlign: "center", marginTop: "10px" }}>
                <span onClick={() => setAppView("student")} style={{ color: "#888", cursor: "pointer", fontSize: "0.9rem" }}>← Back</span>
              </div>
            </div>
          </div>
          <div className="auth-image-side">
             <div className="auth-image-content">
               <h2>We've missed you!</h2>
               <p>Log in to view your accommodation details and updates.</p>
             </div>
          </div>
        </div>
      )}

      {/* 🚀 3.4. STUDENT PROFILE PAGE */}
      {appView === "student_profile" && loggedInStudent && (
        <div className="profile-container fade-in">
          <div className="profile-card">
            <div className="profile-header-banner">
               <button className="btn-logout" onClick={() => { setLoggedInStudent(null); setAppView("student"); }}>Logout</button>
            </div>
            
            <div className="profile-avatar-section">
               <div className="profile-avatar-wrapper">
                  {loggedInStudent.dp ? <img src={`${API}/uploads/${loggedInStudent.dp}`} alt="dp" /> : <div className="avatar-placeholder">{loggedInStudent.name.charAt(0)}</div>}
               </div>
               <h2 className="profile-name">{loggedInStudent.name}</h2>
               <span className="profile-department-badge">{loggedInStudent.department}</span>
            </div>

            <div className="profile-content-grid">
               <div className="profile-section room-section">
                  <h3 className="profile-section-title">Room Allocation</h3>
                  {loggedInStudent.room_id ? (
                    <div className="room-details-card">
                       <div className="room-info">
                         <span className="room-number-display">Room {loggedInStudent.room_number}</span>
                         <span className="room-stats">Capacity: {loggedInStudent.capacity} • Occupied: {loggedInStudent.occupied_count}</span>
                       </div>
                       <div className="room-icon">🚪</div>
                    </div>
                  ) : (
                    <div className="room-pending-card">
                       <span>Not Assigned Yet</span>
                       <p>Your room allocation is currently pending. Please check back later.</p>
                    </div>
                  )}

                  <h3 className="profile-section-title" style={{ marginTop: "20px" }}>Payment Status</h3>
                  <div className={`payment-status-card ${loggedInStudent.paid_status === 'Paid' ? 'paid' : loggedInStudent.paid_status === 'Payment Pending for Approval' ? 'pending' : 'unpaid'}`} style={{
                    padding: "15px",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: loggedInStudent.paid_status === 'Paid' ? "#e8f8f5" : loggedInStudent.paid_status === 'Payment Pending for Approval' ? "#fef5e7" : "#fdedec",
                    border: `1px solid ${loggedInStudent.paid_status === 'Paid' ? "#1abc9c" : loggedInStudent.paid_status === 'Payment Pending for Approval' ? "#f39c12" : "#e74c3c"}`
                  }}>
                    <div>
                      <span style={{ fontSize: "1rem", color: "#555" }}>Duration: {loggedInStudent.duration || "6 Months"}</span>
                      <h4 style={{ color: loggedInStudent.paid_status === 'Paid' ? "#16a085" : loggedInStudent.paid_status === 'Payment Pending for Approval' ? "#d35400" : "#c0392b", fontSize: "1.2rem", margin: "5px 0 0 0" }}>
                        {loggedInStudent.paid_status === 'Paid' ? "Payment Completed ✅" : loggedInStudent.paid_status === 'Payment Pending for Approval' ? "Payment Pending for Approval ⏳" : "Payment Pending 🔴"}
                      </h4>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                      {loggedInStudent.paid_status === 'Not Paid' && (
                        <button className="auth-btn-primary" style={{ padding: "8px 15px", fontSize: "1rem" }} onClick={() => setAppView("student_payment")}>
                          Pay Now
                        </button>
                      )}
                    </div>
                  </div>
               </div>

               <div className="profile-section contact-section">
                  <h3 className="profile-section-title">Contact Details</h3>
                  <div className="contact-details-list">
                     <div className="contact-item">
                        <span className="contact-label">Email</span>
                        <span className="contact-value">{loggedInStudent.email}</span>
                     </div>
                     <div className="contact-item">
                        <span className="contact-label">Phone</span>
                        <span className="contact-value">{loggedInStudent.phone}</span>
                     </div>
                     <div className="contact-item">
                        <span className="contact-label">Gender</span>
                        <span className="contact-value">{loggedInStudent.gender}</span>
                     </div>
                  </div>
               </div>
            </div>

            <div className="profile-footer">
               <span>Account USN: <strong>{loggedInStudent.usn}</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 3.5. LOGGED-IN STUDENT PAYMENT PAGE */}
      {appView === "student_payment" && loggedInStudent && (
        <div className="auth-split-container fade-in">
          <div className="auth-form-side">
            <div className="auth-header">
              <div className="brand" style={{ marginBottom: "10px", display: "flex", alignItems: "center", gap: "10px", color: "#634091" }}>
                <div className="logo-icon" style={{ width: "35px", height: "35px", fontSize: "1.2rem", background: "#634091", color: "#fff", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>H</div>
                <span style={{ fontSize: "1.8rem", fontWeight: "700" }}>HostelHub</span>
              </div>
              <h1 style={{ fontSize: "2.5rem", color: "#222", fontWeight: "700", marginTop: "20px" }}>Secure Your Room</h1>
              <p style={{ color: "#666", fontSize: "1.1rem", marginTop: "10px" }}>Complete Payment for {loggedInStudent.duration || "6 Months"}</p>
            </div>
            
            <div className="auth-form" style={{ marginTop: "30px" }}>
              <div style={{ background: "#f8f9fa", border: "1px solid #e9ecef", borderRadius: "12px", padding: "20px", marginBottom: "25px" }}>
                <h3 style={{ fontSize: "1.3rem", color: "#333", marginBottom: "15px" }}>Fee Breakdown</h3>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "1.1rem", color: "#555" }}>
                  <span>Duration Selected:</span>
                  <span style={{ fontWeight: "600", color: "#222" }}>{loggedInStudent.duration || "6 Months"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.1rem", color: "#555", borderBottom: "1px solid #ddd", paddingBottom: "15px", marginBottom: "15px" }}>
                  <span>Hostel Fee:</span>
                  <span style={{ fontWeight: "600", color: "#222" }}>
                    {loggedInStudent.duration === "12 Months" ? "₹ 1,00,000" : "₹ 60,000"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.4rem", fontWeight: "700", color: "#16a085" }}>
                  <span>Total Amount:</span>
                  <span>{loggedInStudent.duration === "12 Months" ? "₹ 1,00,000" : "₹ 60,000"}</span>
                </div>
              </div>
              
              <div className="auth-input-group" style={{ marginBottom: "25px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", padding: "15px", border: "2px solid #e0e0e0", borderRadius: "10px", cursor: "pointer", fontSize: "1.1rem", fontWeight: "600", transition: "0.2s" }}>
                  <input type="checkbox" style={{ width: "22px", height: "22px", cursor: "pointer", margin: 0 }} onChange={(e) => {
                     // We just use a local state or dom state here. Since it's a dedicated page, we don't need to save it to loggedInStudent until they click Mark as Paid.
                     document.getElementById("markPaidBtn").disabled = !e.target.checked;
                     document.getElementById("markPaidBtn").style.background = e.target.checked ? "#16a085" : "#ccc";
                     document.getElementById("markPaidBtn").style.cursor = e.target.checked ? "pointer" : "not-allowed";
                  }} />
                  I have completed the payment
                </label>
              </div>
              
              <div style={{ display: "flex", gap: "15px" }}>
                <button className="auth-btn-outline" style={{ flex: 1 }} onClick={() => setAppView("student_profile")}>Cancel</button>
                <button id="markPaidBtn" className="auth-btn-primary" style={{ flex: 2, background: "#ccc", cursor: "not-allowed" }} disabled onClick={handlePaymentComplete}>
                  Mark as Paid
                </button>
              </div>
            </div>
          </div>
          <div className="auth-image-side" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "40px" }}>
             <div style={{ background: "#fff", padding: "30px", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", textAlign: "center", maxWidth: "400px" }}>
               <h2 style={{ color: "#333", fontSize: "1.8rem", marginBottom: "20px" }}>Scan to Pay</h2>
               <img src={`${API}/uploads/qr.png`} alt="QR Code" style={{ width: "100%", height: "auto", borderRadius: "10px", border: "1px solid #eee" }} onError={(e) => { e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg'; }} />
               <p style={{ marginTop: "20px", color: "#666", fontSize: "1.1rem" }}>Open your UPI app and scan this QR code to complete your payment.</p>
             </div>
          </div>
        </div>
      )}

      {/* 🚀 4. ADMIN AUTHENTICATION VIEW */}
      {appView === "admin_auth" && (
        <div className="center-view fade-in">
          <div className="admin-auth-box">
            <h2 style={{ marginBottom: "15px" }}>Admin Subsystem</h2>
            <p style={{ color: "#555" }}>Please verify your identity sequence:</p>
            <input type="password" placeholder="••••••" value={adminCodeInput} onChange={e => setAdminCodeInput(e.target.value)} />

            <div style={{ display: "flex", gap: "15px", marginTop: "30px" }}>
              <button className="btn btn-outline" style={{ flex: 1, padding: "12px", fontSize: "1.3rem" }} onClick={() => setAppView("role")}>Return</button>
              <button className="btn btn-dark" style={{ flex: 1, padding: "12px", fontSize: "1.3rem" }} onClick={handleVerifyAdmin}>Verify</button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 5. EXISTING DASHBOARD VIEW (ADMIN) */}
      {appView === "dashboard" && (
        <>
          <nav className="side-nav">
            <div className="brand">
              <div className="logo-icon">H</div>
              <span>Hostel<b>Hub</b></span>
            </div>
            <div className="nav-links">
              <div className={`nav-link ${adminView === 'overview' ? 'active' : ''}`} onClick={() => setAdminView('overview')}>Overview</div>
              <div className={`nav-link ${adminView === 'payment_requests' ? 'active' : ''}`} onClick={() => setAdminView('payment_requests')}>Payment Requests</div>
              <div className={`nav-link ${adminView === 'add_student' ? 'active' : ''}`} onClick={() => setAdminView('add_student')}>Add Student</div>
              <div className={`nav-link ${adminView === 'student_details' ? 'active' : ''}`} onClick={() => setAdminView('student_details')}>Student Details</div>
              <div className={`nav-link ${adminView === 'room_management' ? 'active' : ''}`} onClick={() => setAdminView('room_management')}>Room Management</div>
              <div className={`nav-link ${adminView === 'settings' ? 'active' : ''}`} onClick={() => setAdminView('settings')}>Change Passcode</div>
              <div className="nav-link" onClick={() => { setAppView("role"); setAdminView("overview"); }} style={{ marginTop: 'auto', color: '#e74c3c' }}>Exit Admin</div>
            </div>
          </nav>

          <main className="content fade-in">
            <header className="main-header">
              <div>
                <h1>
                  {adminView === 'overview' && "Dashboard Overview"}
                  {adminView === 'payment_requests' && "Pending Payment Verifications"}
                  {adminView === 'add_student' && "Add New Student"}
                  {adminView === 'student_details' && "Student Details"}
                  {adminView === 'room_management' && "Room Management"}
                  {adminView === 'settings' && "Security Settings"}
                </h1>
                <p className="subtitle">Welcome back, Administrator</p>
              </div>
              {adminView === 'student_details' && (
                <div className="header-search">
                  <input type="text" placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
              )}
            </header>

            {/* OVERVIEW MODULE */}
            {adminView === 'overview' && (
              <>
                <div className="stats-row">
                  <div className="stat-card">
                    <span className="stat-label">Total Occupancy</span>
                    <div className="stat-value">{students.length}</div>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Total Rooms</span>
                    <div className="stat-value">{rooms.length}</div>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Availability</span>
                    <div className="stat-value">{rooms.filter(r => r.occupied_count < r.capacity).length}</div>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Full Rooms</span>
                    <div className="stat-value">{rooms.filter(r => r.occupied_count === r.capacity).length}</div>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Unassigned Students</span>
                    <div className="stat-value">{students.filter(s => !s.room_id).length}</div>
                  </div>
                </div>
              </>
            )}

            {/* SECURITY/SETTINGS MODULE */}
            {adminView === 'settings' && (
              <div className="dashboard-grid" style={{ marginTop: '30px', display: 'block', maxWidth: '500px' }}>
                <section className="ui-card" style={{ background: "#4a154b", color: "#fff" }}>
                  <h3 style={{ color: "#fff" }}>Change Admin Passcode</h3>
                  <div className="form-stack">
                    <input type="password" placeholder="Current Passcode" value={oldAdminCode} onChange={e => setOldAdminCode(e.target.value)} />
                    <input type="password" placeholder="New Passcode" value={newAdminCode} onChange={e => setNewAdminCode(e.target.value)} />
                    <button className="btn btn-outline" style={{ background: "#fff", color: "#4a154b", border: "none" }} onClick={handleUpdateAdminCode}>Verify & Update</button>
                  </div>
                </section>
              </div>
            )}

            {/* PAYMENT REQUESTS MODULE */}
            {adminView === 'payment_requests' && (
              <div className="dashboard-grid" style={{ display: "block" }}>
                <section className="ui-card">
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "15px 10px", fontWeight: "700", fontSize: "1.3rem", borderBottom: "2px solid #eee", marginBottom: "15px", color: "#444" }}>
                    <span style={{ marginLeft: "15px" }}>Student Details</span>
                    <span style={{ marginRight: "10px" }}>Verification Actions</span>
                  </div>

                  <div className="table-wrapper">
                    {students.filter(s => s.paid_status === 'Payment Pending for Approval').length === 0 ? (
                      <div style={{ padding: "30px", textAlign: "center", color: "#777", fontSize: "1.2rem" }}>No pending payment requests at the moment.</div>
                    ) : (
                      students.filter(s => s.paid_status === 'Payment Pending for Approval').map(s => (
                        <div className="table-row" key={s.id}>
                          <div className="user-info">
                            <div className="avatar">
                              {s.dp ? <img src={`${API}/uploads/${s.dp}`} alt="dp" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : s.name.charAt(0)}
                            </div>
                            <div>
                              <div className="user-name">{s.name}</div>
                              <div className="user-meta" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                <span style={{ padding: "2px 6px", background: "#fef5e7", color: "#d35400", borderRadius: "4px", fontSize: "0.9rem", fontWeight: "bold" }}>Payment Pending for Approval</span>
                                <span>USN: {s.usn}</span>
                                <span>Room: {s.room_id ? rooms.find(r => r.id === s.room_id)?.room_number : 'N/A'}</span>
                              </div>
                              <div style={{ marginTop: "5px", fontSize: "1rem", color: "#444" }}>
                                <strong>Duration:</strong> {s.duration || "6 Months"} &nbsp;&bull;&nbsp; 
                                <strong>Amount:</strong> {s.duration === "12 Months" ? "₹ 1,00,000" : "₹ 60,000"}
                              </div>
                            </div>
                          </div>

                          <div className="row-actions">
                            <button onClick={() => handleApprovePayment(s.id)} title="Approve Payment" style={{ color: "#16a085", borderColor: "#16a085" }}>✅ Approve</button>
                            <button onClick={() => handleDeclinePayment(s.id)} title="Decline Payment" style={{ color: "#c0392b", borderColor: "#c0392b" }}>❌ Decline</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>
            )}

            {/* ADD STUDENT MODULE */}
            {adminView === 'add_student' && (
              <div className="dashboard-grid" style={{ display: "block", maxWidth: "600px" }}>
                <section className="ui-card">
                  <h3>Admin Registration</h3>
                  <div className="form-stack">
                    <input placeholder="Name" value={student.name} onChange={e => setStudent({ ...student, name: e.target.value })} />
                    <select value={student.department} onChange={e => setStudent({ ...student, department: e.target.value })}>
                      <option value="">Select Department</option>
                      {['CSE', 'ISE', 'ECE', 'CV', 'MECH', 'ETE', 'AI/ML', 'CSD', 'CG', 'CY', 'MATH', 'BT'].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <select value={student.duration} onChange={e => setStudent({ ...student, duration: e.target.value })}>
                      <option value="6 Months">6 Months Stay</option>
                      <option value="12 Months">12 Months Stay</option>
                    </select>
                    <input placeholder="Email" value={student.email} onChange={e => setStudent({ ...student, email: e.target.value })} />
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", background: "#f9f9f9", borderRadius: "10px", cursor: "pointer", fontSize: "1.1rem", border: "1px solid #ddd" }}>
                      <input type="checkbox" style={{ width: "20px", height: "20px" }} checked={student.paid_status === 'Paid'} onChange={e => setStudent({ ...student, paid_status: e.target.checked ? 'Paid' : 'Not Paid' })} />
                      Mark as Paid
                    </label>
                    <input type="file" accept="image/*" onChange={e => setStudent({ ...student, dp: e.target.files[0] })} />
                    <button className="btn btn-dark" onClick={addStudent}>Register Student</button>
                  </div>
                </section>
              </div>
            )}

            {/* STUDENT DETAILS MODULE */}
            {adminView === 'student_details' && (
              <div className="dashboard-grid" style={{ gridTemplateColumns: (editData.id || moveData.student_id) ? "2fr 1fr" : "1fr" }}>
                <section className="ui-card">
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "15px 10px", fontWeight: "700", fontSize: "1.3rem", borderBottom: "2px solid #eee", marginBottom: "15px", color: "#444" }}>
                    <span style={{ marginLeft: "15px" }}>Resident Details</span>
                    <span style={{ marginRight: "10px" }}>Payment | Actions</span>
                  </div>

                  <div className="table-wrapper">
                    {students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || (s.department && s.department.toLowerCase().includes(search.toLowerCase()))).map(s => (
                      <div className="table-row" key={s.id}>
                        <div className="user-info">
                          <div className="avatar">
                            {s.dp ? <img src={`${API}/uploads/${s.dp}`} alt="dp" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : s.name.charAt(0)}
                          </div>
                          <div>
                            <div className="user-name">{s.name}</div>
                            <div className="user-meta" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                              <span style={{ padding: "2px 6px", background: "#eef", borderRadius: "4px", fontSize: "0.9rem", color: "#44b", fontWeight: "bold" }}>{s.department || "NO DEPT"}</span>
                              <span>{s.email}</span>
                            </div>
                          </div>
                        </div>

                        <div className="row-actions" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span className={`tag ${s.room_id ? 'tag-active' : 'tag-pending'}`}>
                            {s.room_id ? `Room ${rooms.find(r => r.id === s.room_id)?.room_number}` : 'Unassigned'}
                          </span>

                          {/* PAYMENT APPROVAL TOGGLE */}
                          <label title={s.paid_status === 'Paid' ? "Payment Paid" : "Payment Not Paid"} style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", marginLeft: "10px", marginRight: "10px" }}>
                            <input 
                              type="checkbox" 
                              checked={s.paid_status === 'Paid'} 
                              onChange={(e) => {
                                if (e.target.checked) handleApprovePayment(s.id);
                                else handleDeclinePayment(s.id);
                              }} 
                              style={{ display: "none" }} 
                            />
                            <div style={{
                              width: "44px", height: "24px", borderRadius: "24px",
                              background: s.paid_status === 'Paid' ? "#16a085" : "#c0392b",
                              position: "relative", transition: "all 0.3s ease",
                              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.1)"
                            }}>
                              <div style={{
                                width: "18px", height: "18px", background: "#fff", borderRadius: "50%",
                                position: "absolute", top: "3px",
                                left: s.paid_status === 'Paid' ? "23px" : "3px",
                                transition: "all 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55)",
                                boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
                              }}></div>
                            </div>
                          </label>

                          {s.room_id && <button onClick={() => deallocate(s.id)} title="Deallocate">×</button>}
                          <button onClick={() => deleteStudent(s.id)} title="Delete">🗑</button>
                          <button onClick={() => setMoveData({ ...moveData, student_id: s.id })} title="Move Room">⇄</button>
                          <button onClick={() => { setAdminViewingStudent(s); setAdminView("view_profile"); }} title="View Profile">👤</button>
                          <button onClick={() => setEditData({ id: s.id, name: s.name, department: s.department || "", email: s.email, duration: s.duration || "6 Months", paid_status: s.paid_status || 'Not Paid' })} title="Edit Student">✏️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="panel-column">
                  {editData.id && (
                    <section className="ui-card">
                      <h3>Edit Student</h3>
                      <div className="form-stack">
                        <input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} />
                        <select value={editData.department} onChange={e => setEditData({ ...editData, department: e.target.value })}>
                          <option value="">Select Department</option>
                          {['CSE', 'ISE', 'ECE', 'CV', 'MECH', 'ETE', 'AI/ML', 'CSD', 'CG', 'CY', 'MATH', 'BT'].map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <select value={editData.duration} onChange={e => setEditData({ ...editData, duration: e.target.value })}>
                          <option value="6 Months">6 Months</option>
                          <option value="12 Months">12 Months</option>
                        </select>
                        <select value={editData.paid_status} onChange={e => setEditData({ ...editData, paid_status: e.target.value })}>
                          <option value="Not Paid">Not Paid</option>
                          <option value="Pending">Pending</option>
                          <option value="Paid">Paid</option>
                        </select>
                        <input value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} />
                        <input type="file" accept="image/*" onChange={(e) => setEditData({ ...editData, dp: e.target.files[0] })} />
                        <button className="btn btn-dark" onClick={updateStudent}>Update</button>
                        <button className="btn btn-outline" onClick={() => setEditData({ id: "", name: "", department: "", email: "", dp: null })}>Cancel</button>
                      </div>
                    </section>
                  )}

                  {moveData.student_id && (
                    <section className="ui-card fade-in" style={{ border: "2px solid #55a" }}>
                      <h3>Confirm Room Move</h3>
                      <div className="form-stack">
                        <select style={{ padding: "12px", fontSize: "1.2rem", borderRadius: "8px" }} value={moveData.room_id} onChange={(e) => setMoveData({ ...moveData, room_id: e.target.value })}>
                          <option value="">Select New Room</option>
                          {rooms.filter(r => r.occupied_count < r.capacity).map(r => (
                            <option key={r.id} value={r.id}>Room {r.room_number}</option>
                          ))}
                        </select>
                        <button className="btn btn-dark" style={{ fontSize: "1.2rem", padding: "12px 20px" }} onClick={moveStudent}>Move Component</button>
                        <button className="btn btn-outline" onClick={() => setMoveData({ student_id: "", room_id: "" })}>Cancel</button>
                      </div>
                    </section>
                  )}
                </div>
              </div>
            )}

            
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
                            {adminViewingStudent.dp ? <img src={`${API}/uploads/${adminViewingStudent.dp}`} alt="dp" /> : <div className="avatar-placeholder">{adminViewingStudent.name.charAt(0)}</div>}
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
                            <div className={`payment-status-card ${adminViewingStudent.paid_status === 'Paid' ? 'paid' : adminViewingStudent.paid_status === 'Payment Pending for Approval' ? 'pending' : 'unpaid'}`} style={{
                              padding: "15px",
                              borderRadius: "10px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              background: adminViewingStudent.paid_status === 'Paid' ? "#e8f8f5" : adminViewingStudent.paid_status === 'Payment Pending for Approval' ? "#fef5e7" : "#fdedec",
                              border: `1px solid ${adminViewingStudent.paid_status === 'Paid' ? "#1abc9c" : adminViewingStudent.paid_status === 'Payment Pending for Approval' ? "#f39c12" : "#e74c3c"}`
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

            {/* ROOM MANAGEMENT MODULE */}
            {adminView === 'room_management' && (
              <div className="dashboard-grid">
                <div className="panel-column">
                  <section className="ui-card">
                    <h3>Create New Room</h3>
                    <div className="form-stack">
                      <input placeholder="Room Number" value={room.room_number} onChange={e => setRoom({ ...room, room_number: e.target.value })} />
                      <input placeholder="Capacity" value={room.capacity} onChange={e => setRoom({ ...room, capacity: e.target.value })} />
                      <button className="btn btn-outline" onClick={addRoom}>Add Room</button>
                    </div>
                  </section>

                  <section className="ui-card">
                    <h3>Quick Assignment</h3>
                    <div className="form-stack">
                      <select value={alloc.student_id} onChange={e => setAlloc({ ...alloc, student_id: e.target.value })}>
                        <option value="">Select Resident</option>
                        {students.filter(s => !s.room_id).map(s => <option key={s.id} value={s.id}>{s.name} ({s.department})</option>)}
                      </select>
                      <select value={alloc.room_id} onChange={e => setAlloc({ ...alloc, room_id: e.target.value })}>
                        <option value="">Select Room</option>
                        {rooms.filter(r => r.occupied_count < r.capacity).map(r => (
                          <option key={r.id} value={r.id}>Room {r.room_number}</option>
                        ))}
                      </select>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <button className="btn btn-dark" style={{ flex: 1 }} onClick={allocate}>Assign Room</button>
                      </div>
                      <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                        <button className="btn btn-outline" style={{ flex: 1, background: "#f1c40f", border: "none", color: "#222", padding: "10px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", transition: "0.2s" }} onClick={autoAssign}>⚡ Auto Assign</button>
                        <button className="btn btn-outline" style={{ flex: 1, background: "#3498db", border: "none", color: "#fff", padding: "10px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", transition: "0.2s" }} onClick={smartShuffle}>🔀 Smart Shuffle</button>
                      </div>
                    </div>
                  </section>
                </div>

                <div className="list-column">
                  <section className="ui-card">
                    <h3>Room Occupancy Map</h3>
                    <div className="room-grid">
                      {rooms.map(r => (
                        <div key={r.id}
                          className={`room-pill ${selectedRoom?.id === r.id ? "active" : ""}`}
                          onClick={() => setSelectedRoom(r)}>
                          Room {r.room_number} <span style={{ marginLeft: "5px", fontSize: "0.9rem", opacity: 0.8 }}>({r.occupied_count}/{r.capacity})</span>
                        </div>
                      ))}
                    </div>

                    {selectedRoom && (
                      <div style={{ marginTop: "20px", padding: "15px", background: "#f9f9f9", borderRadius: "10px" }}>
                        <h4 style={{ fontSize: "1.3rem", marginBottom: "15px" }}>Residents of Room {selectedRoom.room_number}</h4>
                        {students.filter(s => s.room_id === selectedRoom.id).length === 0 && <p style={{ color: "#777" }}>This room is empty.</p>}
                        {students.filter(s => s.room_id === selectedRoom.id).map(s => (
                          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                            <div className="avatar" style={{ width: "30px", height: "30px", fontSize: "1rem" }}>
                              {s.dp ? <img src={`${API}/uploads/${s.dp}`} alt="dp" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : s.name.charAt(0)}
                            </div>
                            <span style={{ fontSize: "1.2rem", fontWeight: "600" }}>{s.name}</span>
                            <span style={{ fontSize: "1rem", color: "#666" }}>({s.department || "N/A"})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              </div>
            )}
          </main>
        </>
      )}

      {/* ✅ TOAST CONTAINER ADDED */}
      <ToastContainer position="top-right" autoClose={2000} />

      {/* ✅ INJECTED CUSTOM CSS STYLES */}
      <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
          
          * {
            font-family: 'Inter', sans-serif;
          }

          /* NEW ANIMATIONS & VIEWS */
          .fade-in {
             animation: fadeIn 0.6s ease forwards;
          }
          @keyframes fadeIn {
             from { opacity: 0; transform: translateY(10px); }
             to { opacity: 1; transform: translateY(0); }
          }
          
          /* DOORS CSS */
          .door-left, .door-right {
             width: 50%;
             height: 100vh;
             background: url('/wood.png') center/cover;
             box-shadow: inset 0 0 80px rgba(0,0,0,0.9);
             border-right: 4px solid #1a0a00;
             transition: transform 1.4s cubic-bezier(0.77, 0, 0.175, 1);
             position: relative;
          }
          .door-right {
             border-left: 4px solid #1a0a00;
             border-right: none;
             box-shadow: inset 0 0 80px rgba(0,0,0,0.9);
             background-position: right center;
          }
          .door-left.open {
             transform: translateX(-100%);
          }
          .door-right.open {
             transform: translateX(100%);
          }
          .door-handle-left, .door-handle-right {
             position: absolute;
             top: 50%;
             width: 25px;
             height: 180px;
             background: linear-gradient(to right, #d4af37, #fdf0a6, #b28a2a);
             border-radius: 12px;
             box-shadow: 5px 5px 15px rgba(0,0,0,0.9), inset -2px -2px 6px rgba(0,0,0,0.4), inset 2px 2px 6px rgba(255,255,255,0.6);
             transform: translateY(-50%);
             z-index: 10;
          }
          .door-handle-left { right: 35px; }
          .door-handle-right { left: 35px; }
          
          .welcome-title {
             color: #fff;
             font-size: 4rem;
             font-weight: 800;
             text-shadow: 0 5px 25px rgba(0,0,0,0.9);
             margin-bottom: 40px;
             letter-spacing: 6px;
             text-align: top;
              transform: translateY(-100px);
          }
          
          .btn-enter {
             padding: 16px 50px;
             font-size: 1.8rem;
             color: #fff;
             background: #d4af37;
             border: none;
             border-radius: 12px;
             cursor: pointer;
             box-shadow: 0 0 25px rgba(212, 175, 55, 0.5);
             transition: all 0.3s ease;
             font-weight: bold;
             letter-spacing: 2px;
          }
          .btn-enter:hover {
             transform: scale(1.08) translateY(-3px);
             box-shadow: 0 0 40px rgba(212, 175, 55, 0.9);
             background: #f1c40f;
          }

          /* ADMIN AUTH */
          .center-view {
             width: 100vw; height: 100vh;
             display: flex; flex-direction: column;
             justify-content: center; align-items: center;
             background: #f4f7f6;
             position: absolute; inset: 0; z-index: 100;
          }
          .admin-auth-box {
             background: #fff; padding: 45px; border-radius: 20px;
             text-align: center; width: 450px;
             box-shadow: 0 20px 50px rgba(0,0,0,0.15);
          }
          .admin-auth-box input {
             width: 100%; padding: 18px; font-size: 1.8rem; text-align: center;
             letter-spacing: 8px; margin-top: 20px; border-radius: 12px; border: 2px solid #ccc;
             transition: all 0.2s;
             outline: none;
          }
          .admin-auth-box input:focus {
             border-color: #222; box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          
          /* AUTH SPLIT LAYOUT (NEW) */
          .auth-split-container {
             display: flex;
             width: 100vw;
             height: 100vh;
             position: absolute;
             inset: 0;
             z-index: 100;
             background: #fff;
             overflow: hidden;
          }
          .auth-form-side {
             flex: 1;
             display: flex;
             flex-direction: column;
             justify-content: center;
             padding: 50px 10%;
             background: #fff;
             position: relative;
             overflow-y: auto;
          }
          .auth-image-side {
             flex: 1;
             background: #a282c8;
             display: flex;
             align-items: center;
             justify-content: center;
             padding: 40px;
             position: relative;
          }
          .auth-image-side::before {
             content: '';
             position: absolute;
             top: 0; left: 0; width: 100%; height: 100%;
             background-image: radial-gradient(circle at top right, rgba(255,255,255,0.2) 0%, transparent 40%),
                               radial-gradient(circle at bottom left, rgba(255,255,255,0.1) 0%, transparent 40%);
             pointer-events: none;
          }
          .auth-image-content {
             text-align: center;
             color: #fff;
             max-width: 80%;
             z-index: 2;
          }
          .auth-image-content h2 {
             font-size: 3rem;
             margin-bottom: 20px;
             font-weight: 700;
             line-height: 1.2;
             text-shadow: 0 4px 15px rgba(0,0,0,0.1);
          }
          .auth-image-content p {
             font-size: 1.4rem;
             opacity: 0.9;
             line-height: 1.5;
          }
          
          /* AUTH FORM ELEMENTS */
          .auth-form {
             width: 100%;
             max-width: 450px;
          }
          .auth-input-group {
             margin-bottom: 20px;
          }
          .auth-input-group label {
             display: block;
             font-weight: 500;
             margin-bottom: 8px;
             color: #444;
             font-size: 0.95rem;
          }
          .auth-input-group input, .auth-input-group select {
             width: 100%;
             padding: 14px 16px;
             border-radius: 8px;
             border: 1px solid #e0e0e0;
             background: #f9f9fa;
             font-size: 1rem;
             color: #333;
             transition: all 0.2s ease;
          }
          .auth-input-group input:focus, .auth-input-group select:focus {
             outline: none;
             border-color: #634091;
             background: #fff;
             box-shadow: 0 0 0 4px rgba(99, 64, 145, 0.1);
          }
          
          .auth-btn-primary {
             background: #634091;
             color: #fff;
             border: none;
             padding: 14px 20px;
             border-radius: 8px;
             font-size: 1.1rem;
             font-weight: 600;
             cursor: pointer;
             transition: all 0.2s ease;
             box-shadow: 0 4px 6px rgba(99, 64, 145, 0.2);
          }
          .auth-btn-primary:hover {
             background: #503178;
             transform: translateY(-2px);
             box-shadow: 0 6px 12px rgba(99, 64, 145, 0.3);
          }
          .auth-btn-outline {
             background: transparent;
             color: #444;
             border: 1px solid #d1d5db;
             padding: 14px 20px;
             border-radius: 8px;
             font-size: 1.1rem;
             font-weight: 600;
             cursor: pointer;
             transition: all 0.2s ease;
          }
          .auth-btn-outline:hover {
             background: #f3f4f6;
             color: #222;
          }
          .auth-btn-link {
             background: transparent;
             border: none;
             color: #666;
             font-size: 1rem;
             cursor: pointer;
             text-decoration: underline;
          }
          .auth-bottom-text {
             text-align: center;
             margin-top: 25px;
             color: #666;
             font-size: 0.95rem;
          }
          .auth-bottom-text span {
             color: #634091;
             font-weight: 600;
             cursor: pointer;
          }
          .auth-bottom-text span:hover {
             text-decoration: underline;
          }
          
          .admin-lock-btn {
             position: absolute; top: 30px; left: 40px;
             font-size: 2rem; background: transparent; border: none; cursor: pointer;
             opacity: 0.4; transition: 0.3s;
             z-index: 10;
          }
          .admin-lock-btn:hover { opacity: 1; transform: scale(1.15) rotate(5deg); }

          /* 🚀 PROFILE CARD REDESIGN */
          .profile-container {
             width: 100vw;
             min-height: 100vh;
             background: #f4f2f7;
             display: flex;
             align-items: center;
             justify-content: center;
             padding: 40px 20px;
             position: absolute;
             inset: 0;
             z-index: 100;
          }
          .profile-card {
             width: 100%;
             max-width: 800px;
             background: #fff;
             border-radius: 20px;
             box-shadow: 0 20px 60px rgba(0,0,0,0.08);
             overflow: hidden;
             position: relative;
          }
          .profile-header-banner {
             height: 150px;
             background: linear-gradient(135deg, #a282c8, #634091);
             position: relative;
          }
          .btn-logout {
             position: absolute;
             top: 20px;
             right: 20px;
             background: rgba(255,255,255,0.2);
             border: 1px solid rgba(255,255,255,0.4);
             color: #fff;
             padding: 8px 16px;
             border-radius: 20px;
             font-weight: 600;
             cursor: pointer;
             transition: all 0.2s;
          }
          .btn-logout:hover {
             background: #fff;
             color: #e74c3c;
          }
          .profile-avatar-section {
             text-align: center;
             margin-top: -75px;
             position: relative;
             z-index: 2;
          }
          .profile-avatar-wrapper {
             width: 150px;
             height: 150px;
             margin: 0 auto;
             border-radius: 50%;
             border: 6px solid #fff;
             background: #fff;
             box-shadow: 0 8px 20px rgba(0,0,0,0.1);
             overflow: hidden;
          }
          .profile-avatar-wrapper img {
             width: 100%;
             height: 100%;
             object-fit: cover;
          }
          .avatar-placeholder {
             width: 100%;
             height: 100%;
             background: #e2e8f0;
             color: #64748b;
             display: flex;
             align-items: center;
             justify-content: center;
             font-size: 4rem;
             font-weight: 700;
          }
          .profile-name {
             font-size: 2.2rem;
             font-weight: 800;
             color: #1e293b;
             margin-top: 15px;
             margin-bottom: 8px;
          }
          .profile-department-badge {
             display: inline-block;
             padding: 6px 16px;
             background: #f1eef6;
             color: #634091;
             font-weight: 700;
             font-size: 1.1rem;
             border-radius: 20px;
             letter-spacing: 0.5px;
          }
          
          .profile-content-grid {
             padding: 40px;
             display: grid;
             grid-template-columns: 1fr 1fr;
             gap: 30px;
          }
          @media (max-width: 768px) {
             .profile-content-grid { grid-template-columns: 1fr; }
          }
          
          .profile-section {
             background: #f8fafc;
             border-radius: 16px;
             padding: 25px;
             border: 1px solid #e2e8f0;
          }
          .profile-section-title {
             font-size: 1.2rem;
             color: #64748b;
             font-weight: 600;
             text-transform: uppercase;
             letter-spacing: 1px;
             margin-bottom: 20px;
             display: flex;
             align-items: center;
             gap: 10px;
          }
          .profile-section-title::before {
             content: '';
             display: block;
             width: 8px;
             height: 24px;
             background: #634091;
             border-radius: 4px;
          }
          
          .room-details-card {
             display: flex;
             justify-content: space-between;
             align-items: center;
             background: #fff;
             padding: 20px;
             border-radius: 12px;
             box-shadow: 0 4px 15px rgba(0,0,0,0.05);
          }
          .room-number-display {
             display: block;
             font-size: 2.5rem;
             font-weight: 800;
             color: #0f172a;
             line-height: 1;
             margin-bottom: 8px;
          }
          .room-stats {
             color: #64748b;
             font-size: 0.95rem;
             font-weight: 500;
          }
          .room-icon {
             font-size: 4.5rem;
             opacity: 0.8;
          }
          .room-pending-card {
             background: #fffbeb;
             border: 1px solid #fef3c7;
             padding: 25px;
             border-radius: 12px;
             text-align: center;
             color: #92400e;
          }
          .room-pending-card span {
             display: block;
             font-size: 1.4rem;
             font-weight: 700;
             margin-bottom: 5px;
          }
          .room-pending-card p {
             font-size: 0.95rem;
             opacity: 0.9;
          }
          
          .contact-details-list {
             display: flex;
             flex-direction: column;
             gap: 15px;
          }
          .contact-item {
             display: flex;
             flex-direction: column;
             gap: 4px;
             background: #fff;
             padding: 12px 15px;
             border-radius: 10px;
             box-shadow: 0 2px 8px rgba(0,0,0,0.02);
          }
          .contact-label {
             font-size: 0.85rem;
             color: #64748b;
             font-weight: 600;
             text-transform: uppercase;
          }
          .contact-value {
             font-size: 1.1rem;
             color: #1e293b;
             font-weight: 500;
             word-break: break-all;
          }
          
          .profile-footer {
             background: #f1f5f9;
             padding: 15px;
             text-align: center;
             font-size: 0.9rem;
             color: #64748b;
             border-top: 1px solid #e2e8f0;
          }

          /* DASHBOARD CSS RECOVERY */
          .user-info { gap: 15px !important; }
          .user-name { font-size: 1.4rem !important; font-weight: 700 !important; color: #222 !important; }
          .user-meta { font-size: 1.1rem !important; color: #555 !important; }
          .avatar { width: 50px !important; height: 50px !important; font-size: 1.6rem !important; display: flex !important; align-items: center !important; justify-content: center !important; overflow: hidden; }
          .table-row { padding: 15px !important; align-items: center !important; }
          .row-actions { display: flex !important; align-items: center !important; gap: 8px !important; }
          .row-actions button { font-size: 1.4rem !important; padding: 8px 14px !important; border-radius: 8px !important; border: 1px solid #ccc !important; background: #fff !important; cursor: pointer !important; transition: all 0.2s ease-in-out !important; display: flex !important; align-items: center !important; justify-content: center !important; }
          .row-actions button:hover { transform: scale(1.15) !important; box-shadow: 0 4px 8px rgba(0,0,0,0.1) !important; border-color: #888 !important; }
          .tag { font-size: 1.1rem !important; padding: 6px 12px !important; border-radius: 20px !important; }
          
          /* ENLARGED LEFT PANEL (FORMS & CARDS) */
          .ui-card { padding: 25px !important; border-radius: 14px !important; box-shadow: 0 4px 15px rgba(0,0,0,0.05) !important; }
          .ui-card h3 { font-size: 1.5rem !important; margin-bottom: 20px !important; font-weight: 700 !important; color: #222 !important; }
          .form-stack { gap: 18px !important; }
          .form-stack input, .form-stack select { padding: 14px 16px !important; font-size: 1.25rem !important; border-radius: 10px !important; border: 1px solid #ddd !important; background: #fbfbfb !important; }
          .form-stack .btn { padding: 14px 20px !important; font-size: 1.3rem !important; font-weight: bold !important; border-radius: 10px !important; transition: all 0.2s ease-in-out !important; margin-top: 5px !important; cursor: pointer; }
          .form-stack .btn:hover { transform: translateY(-3px) !important; box-shadow: 0 6px 12px rgba(0,0,0,0.15) !important; }
          
          /* GLOBAL TYPOGRAPHY INCREASES */
          body { font-size: 16px; }
          .auth-input-group label { font-size: 1.1rem; margin-bottom: 8px; }
          .auth-input-group input, .auth-input-group select { font-size: 1.15rem; padding: 16px; }
          .auth-btn-primary, .auth-btn-outline { font-size: 1.2rem; padding: 16px; }
          .stat-label { font-size: 1.1rem; }
          .stat-value { font-size: 2.2rem; }
          .nav-link { font-size: 1.15rem; padding: 16px 20px; }
      `}</style>
    </div>
  );
}

export default App;
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

  // Added Department to models
  const [student, setStudent] = useState({ name: "", department: "", phone: "", email: "", gender: "Male", dp: null });
  const [room, setRoom] = useState({ room_number: "", capacity: "" });
  const [alloc, setAlloc] = useState({ student_id: "", room_id: "" });
  const [moveData, setMoveData] = useState({ student_id: "", room_id: "" });
  const [editData, setEditData] = useState({ id: "", name: "", department: "", email: "", dp: null });

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
  const addStudent = async () => {
    const formData = new FormData();
    formData.append('name', student.name);
    formData.append('department', student.department);
    formData.append('phone', student.phone);
    formData.append('email', student.email);
    formData.append('gender', student.gender);
    if (student.dp) formData.append('dp', student.dp);

    const res = await axios.post(`${API}/api/students/add`, formData, { headers: { 'Content-Type': 'multipart/form-data' }});
    toast.success(res.data);
    setStudent({ name: "", department: "", phone: "", email: "", gender: "Male", dp: null });
    fetchData();
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
    } catch(err) {
      toast.error("Auto Allocation Error");
    }
  };

  const smartShuffle = async () => {
    try {
      toast.info("🔀 Smart Shuffling students by department...");
      const res = await axios.post(`${API}/api/smart-shuffle`);
      toast.success(res.data);
      fetchData();
    } catch(err) {
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
    if (editData.dp) formData.append('dp', editData.dp);

    const res = await axios.put(`${API}/api/students/${editData.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' }});
    toast.success(res.data);
    setEditData({ id: "", name: "", department: "", email: "", dp: null });
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
      const res = await axios.post(`${API}/api/auth/update`, { newCode: newAdminCode });
      toast.success(res.data);
      setNewAdminCode("");
    } catch (err) {
      toast.error("Failed to update admin code");
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
        <div className="role-view fade-in">
          <div className="role-content">
            <div className="brand" style={{ marginBottom: "25px", justifyContent: "center", display: "flex", alignItems: "center", gap: "15px", color: "#fff", textShadow: "0 2px 10px rgba(0,0,0,0.5)"}}>
               <div className="logo-icon" style={{ width: "60px", height: "60px", fontSize: "2rem", background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.4)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>H</div>
               <span style={{ fontSize: "3.5rem" }}>Hostel<b>Hub</b></span>
             </div>
            <h2 style={{ fontSize: "2.8rem", marginBottom: "50px", color: "#fff", textShadow: "0 4px 15px rgba(0,0,0,0.6)", fontWeight: "600", textAlign: "center" }}>Select Your Role</h2>
            <div style={{ display: "flex", gap: "50px", justifyContent: "center" }}>
              <button className="role-btn" onClick={() => setAppView("student")}>
                <span style={{ fontSize: "4.5rem", marginBottom: "10px" }}>🎓</span>
                <span>Student</span>
              </button>
              <button className="role-btn admin-role-btn" onClick={() => setAppView("admin_auth")}>
                <span style={{ fontSize: "4.5rem", marginBottom: "10px" }}>🛡️</span>
                <span>Admin</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 3. STUDENT PORTAL VIEW (REGISTRATION) */}
      {appView === "student" && (
         <div className="student-portal fade-in">
           <button className="admin-lock-btn" onClick={() => setAppView("admin_auth")} title="Admin Login">🔐</button>
           
           <div className="student-registration-box">
             <div className="brand" style={{ marginBottom: "25px", justifyContent: "center", display: "flex", alignItems: "center", gap: "10px" }}>
               <div className="logo-icon" style={{ width: "40px", height: "40px", fontSize: "1.5rem" }}>H</div>
               <span style={{ fontSize: "2rem" }}>Hostel<b>Hub</b> Enrollment</span>
             </div>
             
             <div className="form-stack">
               <input placeholder="Full Name" value={student.name} onChange={e => setStudent({...student, name: e.target.value})} />
               <select value={student.department} onChange={e => setStudent({...student, department: e.target.value})}>
                 <option value="">Select Department</option>
                 {['CSE', 'ISE', 'ECE', 'CV', 'MECH', 'ETE', 'AI/ML', 'CSD', 'CG', 'CY', 'MATH', 'BT'].map(d=><option key={d} value={d}>{d}</option>)}
               </select>
               <input placeholder="Phone Number" value={student.phone} onChange={e => setStudent({...student, phone: e.target.value})} />
               <input placeholder="Email Address" value={student.email} onChange={e => setStudent({...student, email: e.target.value})} />
               <div style={{ padding: "10px", border: "1px solid #ddd", borderRadius: "8px", background: "#fbfbfb" }}>
                  <span style={{color: '#666', marginRight: '10px'}}>Profile Picture:</span>
                  <input type="file" accept="image/*" onChange={e => setStudent({...student, dp: e.target.files[0]})} style={{border:"none", padding: "0", background:"transparent"}} />
               </div>
               
               <button className="btn btn-dark" style={{ marginTop: "15px", padding: "15px", fontSize: "1.3rem" }} onClick={() => {
                 if(!student.name || !student.department) return toast.error("Name and Department required");
                 addStudent();
               }}>Submit Registration</button>
             </div>
             <p style={{ marginTop: "20px", textAlign: "center", color: "#666", fontSize: "1.1rem" }}>
               Your details will be forwarded to the Admin for room allocation.
             </p>
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
              <div className="nav-link active">Overview</div>
              <div className="nav-link" onClick={() => setAppView("role")}>Exit Admin</div>
            </div>
          </nav>

          <main className="content fade-in">
            <header className="main-header">
              <div>
                <h1>Dashboard</h1>
                <p className="subtitle">Welcome back, Administrator</p>
              </div>
              <div className="header-search">
                <input type="text" placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </header>

            {/* STATS */}
            <div className="stats-row">
              <div className="stat-card">
                <span className="stat-label">Total Occupancy</span>
                <div className="stat-value">{students.length}</div>
              </div>
              <div className="stat-card">
                <span className="stat-label">Room Capacity</span>
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

            <div className="dashboard-grid">
              <div className="panel-column">

                <section className="ui-card">
                  <h3>Admin Registration</h3>
                  <div className="form-stack">
                    <input placeholder="Name" value={student.name} onChange={e => setStudent({...student, name: e.target.value})} />
                    <select value={student.department} onChange={e => setStudent({...student, department: e.target.value})}>
                      <option value="">Select Department</option>
                      {['CSE', 'ISE', 'ECE', 'CV', 'MECH', 'ETE', 'AI/ML', 'CSD', 'CG', 'CY', 'MATH', 'BT'].map(d=><option key={d} value={d}>{d}</option>)}
                    </select>
                    <input placeholder="Email" value={student.email} onChange={e => setStudent({...student, email: e.target.value})} />
                    <input type="file" accept="image/*" onChange={e => setStudent({...student, dp: e.target.files[0]})} />
                    <button className="btn btn-dark" onClick={addStudent}>Register</button>
                  </div>
                </section>

                <section className="ui-card">
                  <h3>Create New Room</h3>
                  <div className="form-stack">
                    <input placeholder="Room Number" value={room.room_number} onChange={e => setRoom({...room, room_number: e.target.value})} />
                    <input placeholder="Capacity" value={room.capacity} onChange={e => setRoom({...room, capacity: e.target.value})} />
                    <button className="btn btn-outline" onClick={addRoom}>Add Room</button>
                  </div>
                </section>

                <section className="ui-card">
                  <h3>Quick Assignment</h3>
                  <div className="form-stack">
                    <select value={alloc.student_id} onChange={e => setAlloc({...alloc, student_id: e.target.value})}>
                      <option value="">Select Resident</option>
                      {students.filter(s => !s.room_id).map(s => <option key={s.id} value={s.id}>{s.name} ({s.department})</option>)}
                    </select>
                    <select value={alloc.room_id} onChange={e => setAlloc({...alloc, room_id: e.target.value})}>
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

                {/* EDIT PANEL */}
                {editData.id && (
                  <section className="ui-card">
                    <h3>Edit Student</h3>
                    <input value={editData.name} onChange={(e)=>setEditData({...editData,name:e.target.value})}/>
                    <select value={editData.department} onChange={e => setEditData({...editData, department: e.target.value})}>
                      <option value="">Select Department</option>
                      {['CSE', 'ISE', 'ECE', 'CV', 'MECH', 'ETE', 'AI/ML', 'CSD', 'CG', 'CY', 'MATH', 'BT'].map(d=><option key={d} value={d}>{d}</option>)}
                    </select>
                    <input value={editData.email} onChange={(e)=>setEditData({...editData,email:e.target.value})}/>
                    <input type="file" accept="image/*" onChange={(e)=>setEditData({...editData, dp: e.target.files[0]})} />
                    <button className="btn btn-dark" onClick={updateStudent}>Update</button>
                  </section>
                )}

                {/* ADMIN CODE CHANGE */}
                <section className="ui-card" style={{ background: "#4a154b", color: "#fff" }}>
                  <h3 style={{ color: "#fff" }}>Change Passcode</h3>
                  <div className="form-stack">
                    <input type="password" placeholder="New Code" value={newAdminCode} onChange={e => setNewAdminCode(e.target.value)} />
                    <button className="btn btn-outline" style={{ background: "#fff", color: "#4a154b", border: "none" }} onClick={handleUpdateAdminCode}>Update Code</button>
                  </div>
                </section>

              </div>

              <div className="list-column">
                <section className="ui-card">
                  <div style={{display:"flex", justifyContent:"space-between", padding:"15px 10px", fontWeight:"700", fontSize: "1.3rem", borderBottom: "2px solid #eee", marginBottom: "15px", color: "#444"}}>
                    <span style={{ marginLeft: "15px" }}>Resident Details</span>
                    <span style={{ marginRight: "10px" }}>Delete | Move | Edit</span>
                  </div>

                  <div className="table-wrapper">
                    {students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || (s.department && s.department.toLowerCase().includes(search.toLowerCase()))).map(s => (
                      <div className="table-row" key={s.id}>
                        <div className="user-info">
                          <div className="avatar">
                            {s.dp ? <img src={`${API}/uploads/${s.dp}`} alt="dp" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} /> : s.name.charAt(0)}
                          </div>
                          <div>
                            <div className="user-name">{s.name}</div>
                            <div className="user-meta" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                <span style={{ padding: "2px 6px", background: "#eef", borderRadius: "4px", fontSize: "0.9rem", color: "#44b", fontWeight: "bold" }}>{s.department || "NO DEPT"}</span>
                                <span>{s.email}</span>
                            </div>
                          </div>
                        </div>

                        <div className="row-actions">
                          <span className={`tag ${s.room_id ? 'tag-active' : 'tag-pending'}`}>
                            {s.room_id ? `Room ${rooms.find(r => r.id === s.room_id)?.room_number}` : 'Unassigned'}
                          </span>

                          {s.room_id && <button onClick={()=>deallocate(s.id)}>×</button>}
                          <button onClick={()=>deleteStudent(s.id)}>🗑</button>
                          <button onClick={()=>setMoveData({...moveData,student_id:s.id})}>⇄</button>
                          <button onClick={()=>setEditData({id:s.id,name:s.name,department:s.department||"",email:s.email})}>✏️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
                
                {moveData.student_id && (
                  <section className="ui-card fade-in" style={{ marginTop: "2rem", border: "2px solid #55a" }}>
                    <h3>Confirm Room Move</h3>
                    <div style={{ display: "flex", gap: "15px" }}>
                      <select style={{ flex: 1, padding: "12px", fontSize: "1.2rem", borderRadius: "8px" }} value={moveData.room_id} onChange={(e)=>setMoveData({...moveData, room_id:e.target.value})}>
                        <option value="">Select New Room</option>
                        {rooms.filter(r => r.occupied_count < r.capacity).map(r => (
                          <option key={r.id} value={r.id}>Room {r.room_number}</option>
                        ))}
                      </select>
                      <button className="btn btn-dark" style={{ fontSize: "1.2rem", padding: "12px 20px" }} onClick={moveStudent}>Move Component</button>
                    </div>
                  </section>
                )}

                <section className="ui-card" style={{marginTop:"2rem"}}>
                  <h3>Room Occupancy Map</h3>
                  <div className="room-grid">
                    {rooms.map(r => (
                      <div key={r.id}
                        className={`room-pill ${selectedRoom?.id===r.id?"active":""}`}
                        onClick={()=>setSelectedRoom(r)}>
                        Room {r.room_number} <span style={{ marginLeft: "5px", fontSize: "0.9rem", opacity: 0.8 }}>({r.occupied_count}/{r.capacity})</span>
                      </div>
                    ))}
                  </div>

                  {selectedRoom && (
                    <div style={{ marginTop: "20px", padding: "15px", background: "#f9f9f9", borderRadius: "10px" }}>
                      <h4 style={{ fontSize: "1.3rem", marginBottom: "15px" }}>Residents of Room {selectedRoom.room_number}</h4>
                      {students.filter(s=>s.room_id===selectedRoom.id).length === 0 && <p style={{ color: "#777" }}>This room is empty.</p>}
                      {students.filter(s=>s.room_id===selectedRoom.id).map(s=>(
                        <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                             <div className="avatar" style={{ width: "30px", height: "30px", fontSize: "1rem" }}>
                                {s.dp ? <img src={`${API}/uploads/${s.dp}`} alt="dp" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} /> : s.name.charAt(0)}
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
          </main>
        </>
      )}

      {/* ✅ TOAST CONTAINER ADDED */}
      <ToastContainer position="top-right" autoClose={2000} />

      {/* ✅ INJECTED CUSTOM CSS STYLES */}
      <style>{`
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
             text-align: center;
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

          /* ROLE VIEW */
          .role-view {
             width: 100vw; height: 100vh;
             background: url('/hostel_bg.png') center/cover no-repeat;
             position: absolute; inset: 0; z-index: 100;
             display: flex; flex-direction: column;
             justify-content: center; align-items: center;
             overflow: hidden;
          }
          .role-view::before {
             content: "";
             position: absolute;
             inset: 0;
             background: inherit;
             filter: blur(12px) brightness(0.7);
             z-index: -1;
             transform: scale(1.05);
          }
          .role-content {
             position: relative;
             z-index: 10;
             display: flex; flex-direction: column;
             align-items: center;
             background: rgba(255, 255, 255, 0.15);
             padding: 60px 100px;
             border-radius: 20px;
             backdrop-filter: blur(25px);
             -webkit-backdrop-filter: blur(25px);
             border: 1px solid rgba(255, 255, 255, 0.4);
             box-shadow: 0 30px 80px rgba(0,0,0,0.6);
          }
          .center-view {
             width: 100vw; height: 100vh;
             display: flex; flex-direction: column;
             justify-content: center; align-items: center;
             background: #f4f7f6;
             position: absolute; inset: 0; z-index: 100;
          }
          .role-btn {
             padding: 40px 60px;
             font-size: 2.5rem;
             font-weight: 700;
             border-radius: 20px;
             border: none;
             cursor: pointer;
             background: rgba(255, 255, 255, 0.95);
             box-shadow: 0 15px 35px rgba(0,0,0,0.25);
             transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
             color: #222;
             display: flex;
             flex-direction: column;
             align-items: center;
             gap: 15px;
             min-width: 280px;
          }
          .role-btn:hover {
             transform: translateY(-12px) scale(1.05);
             box-shadow: 0 25px 50px rgba(0,0,0,0.4);
             background: #fff;
          }
          .admin-role-btn {
             background: rgba(20, 20, 20, 0.9);
             color: #fff;
             border: 1px solid rgba(255,255,255,0.2);
          }
          .admin-role-btn:hover {
             background: #000;
          }

          /* STUDENT UI */
          .student-portal {
             height: 100vh; width: 100vw;
             display: flex; align-items: center; justify-content: center;
             background: #eceff1; position: absolute; inset: 0; z-index: 100;
          }
          .student-registration-box {
             background: #fff; padding: 45px; border-radius: 20px;
             width: 550px; box-shadow: 0 20px 45px rgba(0,0,0,0.1);
          }
          .admin-lock-btn {
             position: absolute; top: 30px; right: 40px;
             font-size: 2.5rem; background: transparent; border: none; cursor: pointer;
             opacity: 0.3; transition: 0.3s;
          }
          .admin-lock-btn:hover { opacity: 1; transform: scale(1.15) rotate(5deg); }

          /* ADMIN AUTH */
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
      `}</style>
    </div>
  );
}

export default App;
import React, { useEffect, useState } from "react";
import axios from "axios";

// ✅ TOAST IMPORTS ADDED
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [search, setSearch] = useState("");
  
  const [selectedRoom, setSelectedRoom] = useState(null);

  const [student, setStudent] = useState({ name: "", phone: "", email: "", gender: "Male", dp: null });
  const [room, setRoom] = useState({ room_number: "", capacity: "" });
  const [alloc, setAlloc] = useState({ student_id: "", room_id: "" });

  const [moveData, setMoveData] = useState({ student_id: "", room_id: "" });

  const [editData, setEditData] = useState({
    id: "",
    name: "",
    email: "",
    dp: null
  });

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

  const addStudent = async () => {
    const formData = new FormData();
    formData.append('name', student.name);
    formData.append('phone', student.phone);
    formData.append('email', student.email);
    formData.append('gender', student.gender);
    if (student.dp) formData.append('dp', student.dp);

    const res = await axios.post(`${API}/api/students/add`, formData, { headers: { 'Content-Type': 'multipart/form-data' }});
    toast.success(res.data); // ✅ updated
    setStudent({ name: "", phone: "", email: "", gender: "Male", dp: null });
    fetchData();
  };

  const addRoom = async () => {
    const res = await axios.post(`${API}/api/rooms/add`, room);
    toast.success(res.data); // ✅ updated
    setRoom({ room_number: "", capacity: "" });
    fetchData();
  };

  const allocate = async () => {
    const res = await axios.post(`${API}/api/allocate`, alloc);
    toast.success(res.data); // ✅ updated
    setAlloc({ student_id: "", room_id: "" });
    fetchData();
  };

  const deallocate = async (id) => {
    const res = await axios.post(`${API}/api/deallocate`, { student_id: id });
    toast.success(res.data); // ✅ updated
    fetchData();
  };

  const deleteStudent = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this student?");
    if (!confirmDelete) return;

    const res = await axios.delete(`${API}/api/students/${id}`);
    toast.success(res.data); // ✅ updated
    fetchData();
  };

  const moveStudent = async () => {
    if (!moveData.student_id || !moveData.room_id) return;

    const res = await axios.post(`${API}/api/allocate`, moveData);
    toast.success(res.data); // ✅ updated

    setMoveData({ student_id: "", room_id: "" });
    fetchData();
  };

  const updateStudent = async () => {
    if (!editData.id) {
      toast.error("No student selected ❌"); // ✅ updated
      return;
    }

    const formData = new FormData();
    formData.append('name', editData.name);
    formData.append('email', editData.email);
    if (editData.dp) formData.append('dp', editData.dp);

    const res = await axios.put(`${API}/api/students/${editData.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' }});

    toast.success(res.data); // ✅ updated
    setEditData({ id: "", name: "", email: "", dp: null });
    fetchData();
  };

  return (
    <div className="app-container">
      <nav className="side-nav">
        <div className="brand">
          <div className="logo-icon">H</div>
          <span>Hostel<b>Hub</b></span>
        </div>
        <div className="nav-links">
          <div className="nav-link active">Overview</div>
          <div className="nav-link">Directory</div>
          <div className="nav-link">Settings</div>
        </div>
      </nav>

      <main className="content">
        <header className="main-header">
          <div>
            <h1>Dashboard</h1>
            <p className="subtitle">Welcome back, Administrator</p>
          </div>
          <div className="header-search">
            <input 
              type="text" 
              placeholder="Search students..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
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
            <div className="stat-value">
              {rooms.filter(r => r.occupied_count < r.capacity).length}
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-label">Full Rooms</span>
            <div className="stat-value">
              {rooms.filter(r => r.occupied_count === r.capacity).length}
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-label">Unassigned Students</span>
            <div className="stat-value">
              {students.filter(s => !s.room_id).length}
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="panel-column">

            <section className="ui-card">
              <h3>Register Student</h3>
              <div className="form-stack">
                <input placeholder="Name" value={student.name} onChange={e => setStudent({...student, name: e.target.value})} />
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
                  {students.filter(s => !s.room_id).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select value={alloc.room_id} onChange={e => setAlloc({...alloc, room_id: e.target.value})}>
                  <option value="">Select Room</option>
                  {rooms.filter(r => r.occupied_count < r.capacity).map(r => (
                    <option key={r.id} value={r.id}>Room {r.room_number}</option>
                  ))}
                </select>
                <button className="btn btn-dark" onClick={allocate}>Assign Room</button>
              </div>
            </section>

            {/* MOVE PANEL */}
            {moveData.student_id && (
              <section className="ui-card">
                <h3>Move Student</h3>
                <div className="form-stack">
                  <select value={moveData.room_id} onChange={(e)=>setMoveData({...moveData, room_id:e.target.value})}>
                    <option value="">Select New Room</option>
                    {rooms.filter(r => r.occupied_count < r.capacity).map(r => (
                      <option key={r.id} value={r.id}>Room {r.room_number}</option>
                    ))}
                  </select>
                  <button className="btn btn-dark" onClick={moveStudent}>Confirm Move</button>
                </div>
              </section>
            )}

            {/* EDIT PANEL */}
            {editData.id && (
              <section className="ui-card">
                <h3>Edit Student</h3>
                <input value={editData.name} onChange={(e)=>setEditData({...editData,name:e.target.value})}/>
                <input value={editData.email} onChange={(e)=>setEditData({...editData,email:e.target.value})}/>
                <input type="file" accept="image/*" onChange={(e)=>setEditData({...editData, dp: e.target.files[0]})} />
                <button className="btn btn-dark" onClick={updateStudent}>Update</button>
              </section>
            )}

          </div>

          <div className="list-column">
            <section className="ui-card">

              <div style={{display:"flex", justifyContent:"space-between", padding:"15px 10px", fontWeight:"700", fontSize: "1.3rem", borderBottom: "2px solid #eee", marginBottom: "15px", color: "#444"}}>
                <span style={{ marginLeft: "15px" }}>Name</span>
                <span style={{ marginRight: "10px" }}>Delete | Move | Edit</span>
              </div>

              <div className="table-wrapper">
                {students.filter(s => s.name.toLowerCase().includes(search.toLowerCase())).map(s => (
                  <div className="table-row" key={s.id}>
                    <div className="user-info">
                      <div className="avatar">
                        {s.dp ? <img src={`${API}/uploads/${s.dp}`} alt="dp" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} /> : s.name.charAt(0)}
                      </div>
                      <div>
                        <div className="user-name">{s.name}</div>
                        <div className="user-meta">{s.email}</div>
                      </div>
                    </div>

                    <div className="row-actions">
                      <span className={`tag ${s.room_id ? 'tag-active' : 'tag-pending'}`}>
                        {s.room_id ? `Room ${rooms.find(r => r.id === s.room_id)?.room_number}` : 'Unassigned'}
                      </span>

                      {s.room_id && <button onClick={()=>deallocate(s.id)}>×</button>}
                      <button onClick={()=>deleteStudent(s.id)}>🗑</button>
                      <button onClick={()=>setMoveData({...moveData,student_id:s.id})}>⇄</button>
                      <button onClick={()=>setEditData({id:s.id,name:s.name,email:s.email})}>✏️</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ROOM STATUS */}
            <section className="ui-card" style={{marginTop:"2rem"}}>
              <h3>Room Status</h3>

              <div className="room-grid">
                {rooms.map(r => (
                  <div key={r.id}
                    className={`room-pill ${selectedRoom?.id===r.id?"active":""}`}
                    onClick={()=>setSelectedRoom(r)}>
                    Room {r.room_number}
                  </div>
                ))}
              </div>

              {selectedRoom && (
                <div>
                  <h4>Students in {selectedRoom.room_number}</h4>
                  {students.filter(s=>s.room_id===selectedRoom.id).map(s=>(
                    <div key={s.id}>{s.name}</div>
                  ))}
                </div>
              )}
            </section>

          </div>
        </div>

        {/* ✅ TOAST CONTAINER ADDED */}
        <ToastContainer 
          position="top-right"
          autoClose={2000}
        />

        {/* ✅ INJECTED CUSTOM STYLES TO ENLARGE NAME PALETTE & BUTTONS */}
        <style>{`
          .user-info {
            gap: 15px !important;
          }
          .user-name {
            font-size: 1.4rem !important;
            font-weight: 700 !important;
            color: #222 !important;
          }
          .user-meta {
            font-size: 1.1rem !important;
            color: #555 !important;
          }
          .avatar {
            width: 50px !important;
            height: 50px !important;
            font-size: 1.6rem !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .table-row {
            padding: 15px !important;
            align-items: center !important;
          }
          .row-actions {
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
          }
          .row-actions button {
            font-size: 1.4rem !important;
            padding: 8px 14px !important;
            border-radius: 8px !important;
            border: 1px solid #ccc !important;
            background: #fff !important;
            cursor: pointer !important;
            transition: all 0.2s ease-in-out !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .row-actions button:hover {
            transform: scale(1.15) !important;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1) !important;
            border-color: #888 !important;
          }
          .tag {
            font-size: 1.1rem !important;
            padding: 6px 12px !important;
            border-radius: 20px !important;
          }
          
          /* ✅ ENLARGED LEFT PANEL (FORMS & CARDS) */
          .ui-card {
            padding: 25px !important;
            border-radius: 14px !important;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05) !important;
          }
          .ui-card h3 {
            font-size: 1.5rem !important;
            margin-bottom: 20px !important;
            font-weight: 700 !important;
            color: #222 !important;
          }
          .form-stack {
            gap: 18px !important;
          }
          .form-stack input, .form-stack select {
            padding: 14px 16px !important;
            font-size: 1.25rem !important;
            border-radius: 10px !important;
            border: 1px solid #ddd !important;
            background: #fbfbfb !important;
          }
          .form-stack .btn {
            padding: 14px 20px !important;
            font-size: 1.3rem !important;
            font-weight: bold !important;
            border-radius: 10px !important;
            transition: all 0.2s ease-in-out !important;
            margin-top: 5px !important;
          }
          .form-stack .btn:hover {
            transform: translateY(-3px) !important;
            box-shadow: 0 6px 12px rgba(0,0,0,0.15) !important;
          }
        `}</style>
      </main>
    </div>
  );
}

export default App;
import * as XLSX from "xlsx";
import React, { useState, useEffect } from "react";

const BASE_URL = "https://productivity-crm-backend-bafw.onrender.com";

/* ================= FORMAT ================= */

function formatDate(d) {
  return new Date(d).toLocaleDateString();
}

/* ================= MAIN APP ================= */

export default function CRMApp() {

  const [isAuth, setIsAuth] = useState(!!localStorage.getItem("userId"));
  const [isAdmin, setIsAdmin] = useState(false);
  const [page, setPage] = useState("upload");
  const [records, setRecords] = useState([]);

  useEffect(() => {

    const userId = localStorage.getItem("userId");
    const role = localStorage.getItem("role");

    if (!userId) return;

    setIsAdmin(role === "admin");

    const url = role === "admin"
      ? `${BASE_URL}/records`
      : `${BASE_URL}/records/${userId}`;

    fetch(url)
      .then(res => res.json())
      .then(setRecords);

  }, [isAuth]);

/* ================= LOAD BY DATE ================= */

  const loadByDate = (date) => {

    const userId = localStorage.getItem("userId");
    const role = localStorage.getItem("role");

    if (!date) return alert("Select date");

    if (role === "admin") {
      fetch(`${BASE_URL}/admin-records-by-date?date=${date}`)
        .then(res => res.json())
        .then(setRecords);
    } else {
      fetch(`${BASE_URL}/records-by-date?date=${date}&userId=${userId}`)
        .then(res => res.json())
        .then(setRecords);
    }
  };

/* ================= LOGOUT ================= */

  const logout = () => {
    localStorage.clear();
    setIsAuth(false);
  };

  if (!isAuth) return <Login onLogin={(role)=>{
    setIsAuth(true);
    setIsAdmin(role==="admin");
  }} />;

  return (
    <div style={layout}>

      {/* SIDEBAR */}
      <div style={sidebar}>

        <h2 style={{color:"#fff"}}>CRM Panel</h2>

        <div style={menuItem} onClick={()=>setPage("upload")}>
          ➕ Add Productivity
        </div>

        <div style={menuItem} onClick={()=>setPage("records")}>
          📊 Records
        </div>

        <div style={menuItem} onClick={logout}>
          🚪 Logout
        </div>

      </div>

      {/* MAIN AREA */}
      <div style={mainArea}>

        {/* TOP BAR */}
        <div style={topBar}>
          <h3>Dashboard {isAdmin && "(Admin)"}</h3>
          <span>👤 {localStorage.getItem("name")}</span>
        </div>

        {/* CONTENT */}
        <div style={contentCard}>

          {page==="upload" && <Upload setRecords={setRecords} />}
          {page==="records" && (
            <Records 
              records={records} 
              loadByDate={loadByDate} 
            />
          )}

        </div>

      </div>

    </div>
  );
}

/* ================= LOGIN ================= */

function Login({ onLogin }) {

  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [show,setShow]=useState(false);

  const login = () => {

    fetch(`${BASE_URL}/login`,{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({email,password})
    })
    .then(res=>res.json())
    .then(data=>{

      if(!data.success){
        alert("Invalid login");
        return;
      }

      localStorage.setItem("userId",data.user.id);
      localStorage.setItem("role",data.user.role);
      localStorage.setItem("name",data.user.name);

      onLogin(data.user.role);
    });
  };

  return (
    <div style={loginPage}>

      <div style={loginCard}>

        <h2 style={welcome}>Hi, Welcome Back</h2>
        <p style={subText}>Enter your credentials to continue</p>

        <input 
          style={loginInput}
          placeholder="Email"
          onChange={e=>setEmail(e.target.value)}
        />

        <div style={{position:"relative"}}>

          <input 
            style={loginInput}
            type={show?"text":"password"}
            placeholder="Password"
            onChange={e=>setPassword(e.target.value)}
          />

          <span 
            style={eyeIcon}
            onClick={()=>setShow(!show)}
          >👁</span>

        </div>

        <button style={signBtn} onClick={login}>
          Sign In
        </button>

      </div>
    </div>
  );
}

/* ================= UPLOAD ================= */

function Upload({ setRecords }) {

  const [date,setDate]=useState("");
  const [task,setTask]=useState("");

  const submit = () => {

    const userId = localStorage.getItem("userId");
    const role = localStorage.getItem("role");

    fetch(`${BASE_URL}/records`,{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({date,task,userId})
    })
    .then(()=>{

      const url = role==="admin"
        ? `${BASE_URL}/records`
        : `${BASE_URL}/records/${userId}`;

      fetch(url).then(res=>res.json()).then(setRecords);

      setDate("");
      setTask("");
    });
  };

  return (
    <div>

      <h3>Add Productivity</h3>

      <input 
        type="date" 
        style={inputBox}
        value={date}
        onChange={e=>setDate(e.target.value)}
      />

      <textarea 
        style={inputBox}
        rows="4"
        placeholder="What did you work on?"
        value={task}
        onChange={e=>setTask(e.target.value)}
      />

      <button style={modernBtn} onClick={submit}>
        Save Productivity
      </button>

    </div>
  );
}

/* ================= RECORDS ================= */

function Records({ records, loadByDate }) {

  const [date,setDate]=useState("");

  const exportExcel = () => {

    if(!records.length) return alert("No data");

    const ws = XLSX.utils.json_to_sheet(records);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Productivity");
    XLSX.writeFile(wb,"records.xlsx");
  };

  return (
    <div>

      <div style={filterRow}>

        <input 
          type="date" 
          style={inputBox}
          onChange={e=>setDate(e.target.value)}
        />

        <button style={modernBtn} onClick={()=>loadByDate(date)}>
          Load
        </button>

        <button style={excelBtn} onClick={exportExcel}>
          Export Excel
        </button>

      </div>

      <table style={tableStyle}>
        <thead>
          <tr>
            <th>User</th>
            <th>Date</th>
            <th>Task</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r,i)=>(
            <tr key={i}>
              <td>{r.name}</td>
              <td>{formatDate(r.date)}</td>
              <td>{r.task}</td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}

/* ================= STYLES ================= */

const layout = {
  display:"flex",
  height:"100vh",
  background:"#f1f5f9"
};

const sidebar = {
  width:220,
  background:"#1e293b",
  padding:20,
  display:"flex",
  flexDirection:"column",
  gap:14
};

const menuItem = {
  color:"#fff",
  padding:"12px 14px",
  background:"#334155",
  borderRadius:10,
  cursor:"pointer"
};

const mainArea = {
  flex:1,
  display:"flex",
  flexDirection:"column"
};

const topBar = {
  background:"#fff",
  padding:"14px 24px",
  display:"flex",
  justifyContent:"space-between",
  boxShadow:"0 2px 10px rgba(0,0,0,0.05)"
};

const contentCard = {
  margin:25,
  background:"#fff",
  padding:25,
  borderRadius:16,
  boxShadow:"0 15px 30px rgba(0,0,0,0.08)",
  flex:1
};

/* LOGIN */

const loginPage = {
  height:"100vh",
  display:"flex",
  justifyContent:"center",
  alignItems:"center",
  background:"#f1f5f9"
};

const loginCard = {
  width:360,
  padding:40,
  background:"#fff",
  borderRadius:16,
  boxShadow:"0 20px 40px rgba(0,0,0,0.08)"
};

const welcome = {
  color:"#6d28d9",
  textAlign:"center"
};

const subText = {
  textAlign:"center",
  color:"#64748b",
  marginBottom:25
};

const loginInput = {
  width:"100%",
  padding:14,
  borderRadius:10,
  border:"1px solid #d1d5db",
  marginBottom:16
};

const signBtn = {
  width:"100%",
  padding:14,
  background:"#6d28d9",
  color:"#fff",
  border:"none",
  borderRadius:12,
  cursor:"pointer"
};

const eyeIcon = {
  position:"absolute",
  right:14,
  top:14,
  cursor:"pointer"
};

/* COMMON */

const inputBox = {
  width:"100%",
  padding:12,
  borderRadius:10,
  border:"1px solid #d1d5db",
  marginBottom:12
};

const modernBtn = {
  padding:"12px 18px",
  background:"#4f46e5",
  color:"#fff",
  border:"none",
  borderRadius:10,
  cursor:"pointer"
};

const excelBtn = {
  padding:"12px 18px",
  background:"#16a34a",
  color:"#fff",
  border:"none",
  borderRadius:10,
  cursor:"pointer"
};

const filterRow = {
  display:"flex",
  gap:10,
  flexWrap:"wrap",
  marginBottom:20
};

const tableStyle = {
  width:"100%",
  borderCollapse:"collapse"
};

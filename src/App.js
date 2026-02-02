import * as XLSX from "xlsx";
import React, { useState, useEffect } from "react";

const BASE_URL = "https://productivity-crm-backend-bafw.onrender.com";

/* ================= FORMAT ================= */

function formatDate(d) {
  const date = new Date(d);
  return date.toLocaleDateString();
}

/* ================= MAIN ================= */

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

/* ================= DATE LOAD ================= */

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

  if (!isAuth) return <Login onLogin={(role)=> {
    setIsAuth(true);
    setIsAdmin(role==="admin");
  }} />;

  return (
    <div style={{ padding: 30 }}>

      <h2>CRM Dashboard {isAdmin && " (Admin)"}</h2>

      <button onClick={()=>setPage("upload")}>Upload</button>
      <button onClick={()=>setPage("records")}>Records</button>
      <button onClick={logout}>Logout</button>

      {page==="upload" && <Upload setRecords={setRecords} />}
      {page==="records" && <Records records={records} loadByDate={loadByDate} />}

    </div>
  );
}

/* ================= LOGIN ================= */

function Login({ onLogin }) {

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPass, setShowPass] = React.useState(false);

  const login = () => {

    fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })
      .then(res => res.json())
      .then(data => {

        if (!data.success) {
          alert("Invalid login");
          return;
        }

        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("role", data.user.role);
        localStorage.setItem("name", data.user.name);

        onLogin(data.user.role);
      });
  };

  return (
    <div style={loginPage}>

      <div style={loginCard}>

        {/* LOGO */}
        <div style={{ textAlign: "center", marginBottom: 10 }}>
          <img 
            src="https://via.placeholder.com/120x40?text=DatascienceIRC" 
            alt="logo"
          />
        </div>

        <h2 style={welcome}>Hi, Welcome Back</h2>
        <p style={subText}>Enter your credentials to continue</p>

        <input
          style={loginInput}
          placeholder="Email Address / Username"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <div style={{ position: "relative" }}>
          <input
            style={loginInput}
            type={showPass ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          <span
            onClick={() => setShowPass(!showPass)}
            style={eyeIcon}
          >
            👁
          </span>
        </div>

        <div style={row}>

          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input type="checkbox" defaultChecked />
            Keep me logged in
          </label>

          <span style={forgot}>Forgot Password?</span>

        </div>

        <button style={signBtn} onClick={login}>
          Sign In
        </button>

        <p style={{ marginTop: 15, textAlign: "center" }}>
          Don’t have an account?
        </p>

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

      <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
      <textarea value={task} onChange={e=>setTask(e.target.value)} />
      <button onClick={submit}>Save</button>
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

      <input type="date" onChange={e=>setDate(e.target.value)} />
      <button onClick={()=>loadByDate(date)}>Load</button>
      <button onClick={exportExcel}>Export Excel</button>

      <table border="1" cellPadding="5">
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

const loginPage = {
  height: "100vh",
  background: "#f1f5f9",
  display: "flex",
  justifyContent: "center",
  alignItems: "center"
};

const loginCard = {
  width: 380,
  background: "#fff",
  padding: 40,
  borderRadius: 16,
  boxShadow: "0 20px 40px rgba(0,0,0,0.08)"
};

const welcome = {
  textAlign: "center",
  color: "#6d28d9",
  marginBottom: 6
};

const subText = {
  textAlign: "center",
  color: "#64748b",
  marginBottom: 25
};

const loginInput = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  fontSize: 15,
  marginBottom: 16,
  outline: "none"
};

const row = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: 14,
  marginBottom: 20
};

const forgot = {
  color: "#6d28d9",
  cursor: "pointer",
  fontWeight: 500
};

const signBtn = {
  width: "100%",
  padding: "14px",
  background: "#6d28d9",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer"
};

const eyeIcon = {
  position: "absolute",
  right: 14,
  top: 14,
  cursor: "pointer",
  opacity: 0.6
};

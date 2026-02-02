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

  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");

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
    <div>
      <h3>Login</h3>
      <input placeholder="Email" onChange={e=>setEmail(e.target.value)} />
      <input placeholder="Password" type="password" onChange={e=>setPassword(e.target.value)} />
      <button onClick={login}>Login</button>
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

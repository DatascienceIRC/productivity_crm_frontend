import React,{useState,useEffect, useCallback} from "react";
import * as XLSX from "xlsx";

const BASE="https://productivity-crm-backend-bafw.onrender.com";

const authHeader = () => ({
  Authorization: "Bearer " + localStorage.getItem("token")
});

const safeFetch = async (url, options = {}) => {
  const res = await fetch(url, {
    headers: {
      ...authHeader(),
      ...(options.headers || {})
    },
    ...options
  });

  if (res.status === 401 || res.status === 403) {
    localStorage.clear();
    window.location.reload(); // auto logout
    return null;
  }

  return res.json();
};

export default function App(){

const [auth,setAuth]=useState(!!localStorage.getItem("token"));
const [role,setRole]=useState(localStorage.getItem("role"));
const [page,setPage]=useState("dashboard");
const [records,setRecords]=useState([]);
const [users,setUsers]=useState([]);
const [report,setReport]=useState([]);

const loadRecords = useCallback(() => {
  const url =
    role === "admin"
      ? `${BASE}/records`
      : `${BASE}/records/${localStorage.getItem("userId")}`;

safeFetch(url).then(data => {
  if (data) setRecords(data);
});
}, [role]);


useEffect(() => {
  if (auth) loadRecords();
}, [auth, loadRecords]);

// ✅ Auto logout if token missing
useEffect(() => {
  const token = localStorage.getItem("token");
  if (!token) {
    setAuth(false);
  }
}, []);



if(!auth) return <Login onLogin={(r)=>{setAuth(true);setRole(r)}}/>

return(
<div style={{display:"flex",height:"100vh"}}>

{/* SIDEBAR */}
<div style={side}>

<h2>CRM</h2>

<Menu icon="📊" label="Dashboard" set={setPage}/>
<Menu icon="➕" label="Add" set={setPage}/>
<Menu icon="📋" label="Records" set={setPage}/>
<Menu icon="📅" label="Reports" set={setPage}/>
{role==="admin" && <Menu icon="👥" label="Users" set={setPage}/>}

<button onClick={()=>{
  localStorage.clear();
  window.location.reload();
}}>Logout</button>

</div>

{/* CONTENT */}
<div style={{flex:1,padding:30,background:"#f1f5f9"}}>

{page==="dashboard" && <h2>Welcome {localStorage.getItem("name")}</h2>}

{page==="add" && <Add reload={loadRecords}/>}

{page==="records" && 
<Records records={records} setRecords={setRecords}/>}

{page==="reports" && 
<Reports report={report} setReport={setReport}/>}

{page==="users" && role==="admin" &&
<Users users={users} setUsers={setUsers}/>}

</div>
</div>
)
}

/* ===== COMPONENTS ===== */

function Menu({icon,label,set}){
return <div onClick={()=>set(label.toLowerCase())} style={menu}>
{icon} {label}
</div>
}

/* LOGIN */

function Login({onLogin}){

const [email,setEmail]=useState("");
const [password,setPassword]=useState("");

const login=()=>{
fetch(`${BASE}/login`,{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({email,password})
})
.then(r=>r.json())
.then(d=>{
if(!d.success) return alert("Invalid");
localStorage.setItem("token", d.token);
localStorage.setItem("userId", d.user.id);
localStorage.setItem("role", d.user.role);
localStorage.setItem("name", d.user.name);

onLogin(d.user.role);
});
}


return(
<div style={loginPage}>
<div style={loginCard}>
<h2>CRM Login</h2>
<input placeholder="Email" onChange={e=>setEmail(e.target.value)} />
<input type="password" placeholder="Password" onChange={e=>setPassword(e.target.value)} />
<button onClick={login}>Login</button>
</div>
</div>
)
}

/* ADD */

function Add({reload}){

const [date,setDate]=useState("");
const [task,setTask]=useState("");

const save = () => {

  // ✅ Validation
  if (!date || !task.trim()) return alert("Fill all fields");

  safeFetch(`${BASE}/records`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date, task })
  }).then(() => reload());
};

return(
<div>
<h3>Add Productivity</h3>
<input type="date" onChange={e=>setDate(e.target.value)} />
<textarea onChange={e=>setTask(e.target.value)} />
<button onClick={save}>Save</button>
</div>
)
}

/* RECORDS */

function Records({records,setRecords}){

const [search,setSearch]=useState("");
const [month,setMonth]=useState("");

const filter = () => {
  safeFetch(`${BASE}/filter-records?search=${search}&month=${month}`)
  .then(data => {
    if (data) setRecords(data);
  });
};

const excel = () => {
  const ws = XLSX.utils.json_to_sheet(records);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, "records.xlsx");
};


return(
<div>
<h3>Records</h3>

<input placeholder="Search task" onChange={e=>setSearch(e.target.value)}/>
<input type="month" onChange={e=>setMonth(e.target.value)}/>
<button onClick={filter}>Filter</button>
<button onClick={excel}>Export</button>

<table border="1">
<thead>
<tr><th>User</th><th>Date</th><th>Task</th></tr>
</thead>
<tbody>
{records.map((r,i)=>(
<tr key={i}>
<td>{r.name}</td>
<td>{new Date(r.date).toLocaleDateString()}</td>
<td>{r.task}</td>
</tr>
))}
</tbody>
</table>
</div>
)
}

/* REPORTS */

function Reports({report,setReport}){

const load = () => {
  safeFetch(`${BASE}/monthly-report`)
  .then(data => {
    if (data) setReport(data);
  });
};

return(
<div>
<h3>Monthly Report</h3>
<button onClick={load}>Load</button>

<table border="1">
<thead>
<tr><th>User</th><th>Month</th><th>Year</th><th>Total</th></tr>
</thead>
<tbody>
{report.map((r,i)=>(
<tr key={i}>
<td>{r.user}</td>
<td>{r.month}</td>
<td>{r.year}</td>
<td>{r.totalTasks}</td>
</tr>
))}
</tbody>
</table>
</div>
)
}
/* USERS */

function Users({users,setUsers}){

const loadUsers = () => {
  safeFetch(`${BASE}/users`)
  .then(data => {
    if (data) setUsers(data);
  });
};

useEffect(()=>{
  loadUsers();
}, []);

const del = id => {
  safeFetch(`${BASE}/users/${id}`, { method: "DELETE" })
  .then(() => {
    setUsers(prev => prev.filter(u => u._id !== id));
  });
};

return(
<div>
<h3>Users</h3>

<table border="1">
<thead>
<tr><th>Name</th><th>Email</th><th>Role</th><th>Action</th></tr>
</thead>
<tbody>
{users.map(u=>(
<tr key={u._id}>
<td>{u.name}</td>
<td>{u.email}</td>
<td>{u.role}</td>
<td><button onClick={()=>del(u._id)}>Delete</button></td>
</tr>
))}
</tbody>
</table>
</div>
)
}

/* ===== STYLES ===== */

const side={
width:220,
background:"#0f172a",
color:"#fff",
padding:20
};

const menu={
padding:10,
cursor:"pointer"
};

const loginPage={
height:"100vh",
display:"flex",
justifyContent:"center",
alignItems:"center",
background:"#eef2ff"
};

const loginCard={
background:"#fff",
padding:40,
borderRadius:12
};

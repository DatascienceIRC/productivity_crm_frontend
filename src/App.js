import React,{useState,useEffect, useCallback} from "react";
import * as XLSX from "xlsx";

const BASE="https://productivity-crm-backend-bafw.onrender.com";

const safeFetch = async (url, options = {}) => {

  const token = localStorage.getItem("token");

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: "Bearer " + token }),
      ...(options.headers || {})
    }
  });

  // handle non-json responses safely
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};


export default function App(){

const [auth,setAuth]=useState(!!localStorage.getItem("userId"));
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


if(!auth) return <Login onLogin={(r)=>{setAuth(true);setRole(r)}}/>

return (
<div className="flex min-h-screen bg-slate-100">

{/* SIDEBAR */}
<div className="w-64 bg-slate-900 text-white p-6">

<h2 className="text-2xl font-bold mb-8">CRM</h2>

<Nav icon="📊" label="dashboard" set={setPage}/>
<Nav icon="➕" label="add" set={setPage}/>
<Nav icon="📋" label="records" set={setPage}/>
<Nav icon="📅" label="reports" set={setPage}/>

{/* {role==="admin" && <Nav icon="👥" label="users" set={setPage}/>} */}

<button 
className="mt-10 w-full bg-red-500 py-2 rounded hover:bg-red-600"
onClick={()=>{localStorage.clear();setAuth(false)}}
>
Logout
</button>

</div>

{/* CONTENT */}
<div className="flex-1 p-8">

{page==="dashboard" && (
<h2 className="text-3xl font-semibold">
Welcome {localStorage.getItem("name")}
</h2>
)}

{page==="add" && <Add reload={loadRecords}/>}

{page==="records" && <Records records={records} setRecords={setRecords}/>}

{page==="reports" && <Reports report={report} setReport={setReport}/>}

{/* {page==="users" && role==="admin" && <Users users={users} setUsers={setUsers}/>} */}

</div>
</div>
)

}

/* ===== COMPONENTS ===== */

function Nav({icon,label,set}){
return(
<button
onClick={()=>set(label)}
className="w-full text-left px-4 py-2 mb-2 rounded hover:bg-slate-700 transition"
>
{icon} {label.charAt(0).toUpperCase()+label.slice(1)}
</button>
)
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

return (
<div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-600">

<div className="bg-white p-10 rounded-xl shadow-xl w-96">

<h2 className="text-2xl font-bold text-center mb-6">CRM Login</h2>

<input
className="w-full border p-3 rounded mb-4 focus:outline-none focus:ring"
placeholder="Email"
onChange={e=>setEmail(e.target.value)}
/>

<input
type="password"
className="w-full border p-3 rounded mb-6 focus:outline-none focus:ring"
placeholder="Password"
onChange={e=>setPassword(e.target.value)}
/>

<button
onClick={login}
className="w-full bg-indigo-600 text-white py-3 rounded hover:bg-indigo-700"
>
Login
</button>

</div>
</div>
)

}

/* ADD */

function Add({reload}){

const [date,setDate]=useState("");
const [task,setTask]=useState("");

const save = () => {

  if (!date || !task.trim()) return alert("Fill all fields");

  const userId = localStorage.getItem("userId");

  safeFetch(`${BASE}/records`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date, task, userId })   // 👈 SEND userId
  }).then(() => {
    reload();
    setDate("");
    setTask("");
  });
};

return (
<div className="bg-white p-6 rounded-xl shadow max-w-lg">

<h3 className="text-xl font-semibold mb-4">Add Productivity</h3>

<input 
  type="date"
  className="w-full border p-2 rounded mb-4"
  onChange={e => setDate(e.target.value)}
/>

<textarea
  className="w-full border p-2 rounded mb-4"
  placeholder="Task description"
  onChange={e => setTask(e.target.value)}
/>

<button
  onClick={save}
  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
>
Save
</button>

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

return (
<div className="bg-white p-6 rounded-xl shadow">

<h3 className="text-2xl font-semibold mb-6">Records</h3>

{/* FILTER BAR */}
<div className="flex flex-wrap gap-3 mb-6">

<input
  placeholder="Search task..."
  className="border px-3 py-2 rounded-lg w-60 focus:outline-none focus:ring"
  onChange={e=>setSearch(e.target.value)}
/>

<input
  type="month"
  className="border px-3 py-2 rounded-lg focus:outline-none focus:ring"
  onChange={e=>setMonth(e.target.value)}
/>

<button
  onClick={filter}
  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
>
Filter
</button>

<button
  onClick={excel}
  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
>
Export Excel
</button>

</div>

{/* TABLE */}
<div className="overflow-x-auto rounded-lg border">

<table className="min-w-full bg-white">

<thead className="bg-slate-100 text-slate-700">
<tr>
<th className="p-3 text-left font-semibold">User</th>
<th className="p-3 text-left font-semibold">Date</th>
<th className="p-3 text-left font-semibold">Task</th>
</tr>
</thead>

<tbody>
{records.map((r,i)=>(
<tr 
  key={i} 
  className="border-b hover:bg-slate-50 transition"
>
<td className="p-3">{r.name}</td>

<td className="p-3">
{new Date(r.date).toLocaleDateString()}
</td>

<td className="p-3">{r.task}</td>
</tr>
))}
</tbody>

</table>

</div>

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

return (
<div className="bg-white p-6 rounded-xl shadow">

<h3 className="text-2xl font-semibold mb-6">Monthly Reports</h3>

<button
  onClick={load}
  className="mb-6 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
>
Load Report
</button>

<div className="overflow-x-auto rounded-lg border">

<table className="min-w-full bg-white">

<thead className="bg-slate-100 text-slate-700">
<tr>
<th className="p-3 text-left font-semibold">User</th>
<th className="p-3 text-left font-semibold">Month</th>
<th className="p-3 text-left font-semibold">Year</th>
<th className="p-3 text-left font-semibold">Total Tasks</th>
</tr>
</thead>

<tbody>
{report.map((r,i)=>(
<tr 
  key={i}
  className="border-b hover:bg-slate-50 transition"
>
<td className="p-3">{r.user}</td>
<td className="p-3">{r.month}</td>
<td className="p-3">{r.year}</td>
<td className="p-3 font-semibold text-indigo-600">
  {r.totalTasks}
</td>
</tr>
))}
</tbody>

</table>

</div>

{/* 👉 EMPTY STATE MESSAGE HERE */}
{report.length === 0 && (
<p className="text-gray-500 mt-4 text-center">
  No reports loaded yet
</p>
)}

{report.length === 0 && (
<p className="text-gray-400 italic mt-4 text-center">
Click "Load Report" to view monthly summary
</p>
)}
</div>
)

}
/* USERS */
/*
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

return (
<div className="bg-white p-6 rounded-xl shadow">

<h3 className="text-2xl font-semibold mb-6">Users</h3>

<div className="overflow-x-auto rounded-lg border">

<table className="min-w-full bg-white">

<thead className="bg-slate-100 text-slate-700">
<tr>
<th className="p-3 text-left font-semibold">Name</th>
<th className="p-3 text-left font-semibold">Email</th>
<th className="p-3 text-left font-semibold">Role</th>
</tr>
</thead>

<tbody>
{users.map(u => (
<tr 
  key={u._id} 
  className="border-b hover:bg-slate-50 transition"
>
<td className="p-3 font-medium">{u.name}</td>
<td className="p-3 text-gray-600">{u.email}</td>

<td className="p-3">
<span className={`px-3 py-1 rounded-full text-sm font-semibold 
  ${u.role === "admin" 
    ? "bg-indigo-100 text-indigo-700" 
    : "bg-green-100 text-green-700"}`}>
  {u.role}
</span>
</td>

</tr>
))}
</tbody>

</table>

</div>


{users.length === 0 && (
<p className="text-gray-500 mt-4 text-center">
No users found
</p>
)}

</div>
)

}
*/

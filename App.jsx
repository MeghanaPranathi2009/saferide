import {useState,useEffect} from 'react'
import {seed} from './data'
import {loadState,saveState} from './db'

const PAGES=[['dashboard','Dashboard','▦'],['students','Students','☺'],['buses','Buses','⛟'],['journey','Journey Monitor','◎'],['alerts','Safety Alerts','!'],['history','History','↺'],['settings','Settings','⚙']]
const uid=()=>Math.random().toString(36).slice(2,8)
const pick=a=>a[Math.floor(Math.random()*a.length)]
const fmt=t=>new Date(t).toLocaleString([],{dateStyle:'medium',timeStyle:'short'})
const tone=s=>({boarded:'blue',arrived:'green',waiting:'peach',absent:'gray',Active:'green',Idle:'peach',Maintenance:'gray',SOS:'red','Missed boarding':'peach','Unexpected event':'blue',boarding:'blue',arrival:'green',alert:'red',system:'gray'}[s]||'gray')
const ev=(d,type,msg,bus)=>d.events.unshift({id:uid(),t:Date.now(),type,msg,bus})
const warn=(d,type,msg,bus)=>{d.alerts.unshift({id:uid(),t:Date.now(),type,msg,bus,resolved:false});ev(d,'alert',`${type}: ${msg}`,bus)}
const live=d=>d.buses.filter(b=>b.status==='Active').map(b=>b.id)
const SIM={
 board(d){const x=pick(d.students.filter(x=>x.status==='waiting'&&live(d).includes(x.bus)));if(!x)return'No waiting students on active buses.';x.status='boarded';ev(d,'boarding',`${x.name} boarded ${x.bus} at ${x.stop} (simulated)`,x.bus);return`Simulated: ${x.name} boarded ${x.bus}`},
 arrive(d){const x=pick(d.students.filter(x=>x.status==='boarded'));if(!x)return'Nobody is boarded yet — simulate a boarding first.';x.status='arrived';ev(d,'arrival',`${x.name} arrived at school (simulated)`,x.bus);return`Simulated: ${x.name} arrived`},
 missed(d){if(!d.settings.missed)return'Missed-boarding alerts are off in Settings.';const x=pick(d.students.filter(x=>x.status==='waiting'));if(!x)return'No waiting students.';warn(d,'Missed boarding',`${x.name} did not board ${x.bus} at ${x.stop} (simulated)`,x.bus);return'Simulated missed-boarding alert raised'},
 unexpected(d){const b=pick(live(d));if(!b)return'No active bus.';warn(d,'Unexpected event','Unscheduled stop detected (simulated)',b);return'Simulated unexpected event raised'},
 sos(d){if(!d.settings.sos)return'SOS alerts are off in Settings.';const b=pick(live(d));if(!b)return'No active bus.';warn(d,'SOS','Driver pressed SOS (simulated)',b);return'Simulated SOS raised'}
}
const Badge=({children,t})=><span className={'badge '+tone(t||children)}>{children}</span>
const Sim=()=><span className="sim">SIMULATED</span>
const Card=({title,right,children,cls=''})=><section className={'card '+cls}>{(title||right)&&<div className="ch"><h3>{title}</h3>{right}</div>}{children}</section>
const Stat=({label,value,hint,go,to})=><button className="card stat" onClick={()=>go(to)}><span>{label}</span><b>{value}</b><small>{hint}</small></button>
const Table=({head,rows,empty='Nothing to show.'})=><div className="tw">{rows.length?<table><thead><tr>{head.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows}</tbody></table>:<p className="empty">{empty}</p>}</div>

function SimPanel({run}){return <Card title="Demo-event simulator" right={<Sim/>}>
 <p className="muted">These buttons create fake events to demonstrate the system. No real GPS, wristband, SMS or push notification is involved.</p>
 <div className="btns"><button className="btn pri" onClick={()=>run('board')}>Simulate boarding</button><button className="btn" onClick={()=>run('arrive')}>Simulate arrival</button><button className="btn" onClick={()=>run('missed')}>Missed boarding</button><button className="btn" onClick={()=>run('unexpected')}>Unexpected event</button><button className="btn danger" onClick={()=>run('sos')}>SOS</button></div></Card>}

function Dashboard({s,go,run}){
 const open=s.alerts.filter(a=>!a.resolved).length,boarded=s.students.filter(x=>x.status==='boarded').length
 return <><div className="grid4">
  <Stat label="Total students" value={s.students.length} hint="View all" go={go} to="students"/>
  <Stat label="Active buses" value={live(s).length+' / '+s.buses.length} hint="Manage buses" go={go} to="buses"/>
  <Stat label="Boarded now" value={boarded} hint="Journey monitor" go={go} to="journey"/>
  <Stat label="Unresolved alerts" value={open} hint="Review alerts" go={go} to="alerts"/></div>
  <div className="grid2"><SimPanel run={run}/>
  <Card title="Recent activity" right={<button className="link" onClick={()=>go('history')}>All history</button>}>
   <ul className="log">{s.events.slice(0,7).map(e=><li key={e.id}><Badge t={e.type}>{e.type}</Badge><span>{e.msg}</span><time>{fmt(e.t)}</time></li>)}</ul></Card></div>
  <Card title="Boarding progress by bus">{s.buses.map(b=>{const l=s.students.filter(x=>x.bus===b.id),n=l.filter(x=>x.status!=='waiting').length;return <div className="bar" key={b.id}><span>{b.id}</span><i><u style={{width:(l.length?n/l.length*100:0)+'%'}}/></i><em>{n}/{l.length}</em></div>})}</Card></>
}

function Students({s,mut}){
 const [q,setQ]=useState(''),[bus,setBus]=useState('all'),[cls,setCls]=useState('all'),[f,setF]=useState({name:'',cls:'',bus:s.buses[0]?.id||'',stop:''})
 const classes=[...new Set(s.students.map(x=>x.cls))].sort()
 const rows=s.students.filter(x=>(bus==='all'||x.bus===bus)&&(cls==='all'||x.cls===cls)&&(x.name+x.id+x.stop).toLowerCase().includes(q.toLowerCase()))
 const add=e=>{e.preventDefault();if(!f.name.trim()||!f.cls.trim()||!f.stop.trim())return;mut(d=>{d.students.push({id:'STU-'+(Math.max(100,...d.students.map(x=>+x.id.slice(4)||0))+1),name:f.name.trim(),cls:f.cls.trim(),bus:f.bus,stop:f.stop.trim(),status:'waiting'});return'Student added (demo data)'});setF({...f,name:'',cls:'',stop:''})}
 return <><Card title="Add student (demo)"><form className="form" onSubmit={add}>
  <input placeholder="Name (use fictional names)" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/><input placeholder="Class e.g. 6A" value={f.cls} onChange={e=>setF({...f,cls:e.target.value})}/>
  <select value={f.bus} onChange={e=>setF({...f,bus:e.target.value})}>{s.buses.map(b=><option key={b.id}>{b.id}</option>)}</select><input placeholder="Pickup stop" value={f.stop} onChange={e=>setF({...f,stop:e.target.value})}/><button className="btn pri">Add</button></form></Card>
  <Card title={`Students (${rows.length})`}><div className="filters"><input placeholder="Search name, ID or stop…" value={q} onChange={e=>setQ(e.target.value)}/>
   <select value={bus} onChange={e=>setBus(e.target.value)}><option value="all">All buses</option>{s.buses.map(b=><option key={b.id}>{b.id}</option>)}</select>
   <select value={cls} onChange={e=>setCls(e.target.value)}><option value="all">All classes</option>{classes.map(c=><option key={c}>{c}</option>)}</select></div>
   <Table head={['ID','Student','Class','Bus','Pickup stop','Status','']} empty="No students match your filters." rows={rows.map(x=><tr key={x.id}><td>{x.id}</td><td>{x.name}</td><td>{x.cls}</td><td>{x.bus}</td><td>{x.stop}</td><td><Badge>{x.status}</Badge></td><td><button className="link red" onClick={()=>mut(d=>{d.students=d.students.filter(y=>y.id!==x.id);return'Student removed'})}>Remove</button></td></tr>)}/></Card></>
}

function Buses({s,mut}){
 const [f,setF]=useState({id:'',route:'',driver:''})
 const add=e=>{e.preventDefault();const id=f.id.trim().toUpperCase();if(!id||!f.route.trim()||!f.driver.trim())return;mut(d=>{if(d.buses.some(b=>b.id===id))return'That bus ID already exists';d.buses.push({id,route:f.route.trim(),driver:f.driver.trim(),status:'Idle'});return'Bus added'});setF({id:'',route:'',driver:''})}
 return <><Card title="Add bus"><form className="form" onSubmit={add}><input placeholder="Bus ID e.g. BUS-05" value={f.id} onChange={e=>setF({...f,id:e.target.value})}/><input placeholder="Route" value={f.route} onChange={e=>setF({...f,route:e.target.value})}/><input placeholder="Driver (name only)" value={f.driver} onChange={e=>setF({...f,driver:e.target.value})}/><button className="btn pri">Add</button></form></Card>
 <Card title="Fleet"><Table head={['Bus ID','Route','Driver','Students','Status']} rows={s.buses.map(b=><tr key={b.id}><td>{b.id}</td><td>{b.route}</td><td>{b.driver}</td><td>{s.students.filter(x=>x.bus===b.id).length}</td><td><select className={'pill '+tone(b.status)} value={b.status} onChange={e=>mut(d=>{d.buses.find(x=>x.id===b.id).status=e.target.value;return`${b.id} set to ${e.target.value}`})}>{['Active','Idle','Maintenance'].map(o=><option key={o}>{o}</option>)}</select></td></tr>)}/></Card></>
}

function Journey({s,run}){
 const [sel,setSel]=useState('all')
 const buses=s.buses.filter(b=>b.status==='Active'&&(sel==='all'||b.id===sel))
 return <><SimPanel run={run}/>
 <Card title="Live map" right={<Sim/>}><div className="map"><div><b>Map placeholder</b><p>Real GPS tracking is not connected. A map (e.g. Leaflet/Google Maps) can be added once a location source exists.</p></div></div></Card>
 <div className="filters"><select value={sel} onChange={e=>setSel(e.target.value)}><option value="all">All active buses</option>{s.buses.filter(b=>b.status==='Active').map(b=><option key={b.id}>{b.id}</option>)}</select></div>
 <div className="grid2">{buses.length?buses.map(b=>{const l=s.students.filter(x=>x.bus===b.id),arr=l.filter(x=>x.status==='arrived').length,brd=l.filter(x=>x.status==='boarded').length
  const st=l.length&&arr===l.length?'Arrived':brd+arr>0?'In transit':'Not started'
  return <Card key={b.id} title={`${b.id} · ${b.route}`} right={<Badge t={st==='Arrived'?'arrived':st==='In transit'?'boarded':'waiting'}>{st}</Badge>}>
   <p className="muted">Driver: {b.driver} · Boarded {brd+arr}/{l.length} · Arrived {arr}</p>
   <div className="chips">{l.map(x=><span key={x.id} className={'chip '+tone(x.status)} title={x.stop}>{x.name} · {x.status}</span>)}</div></Card>}):<p className="empty">No active buses. Set a bus to Active in Buses.</p>}</div>
 <Card title="Boarding & arrival events"><ul className="log">{s.events.filter(e=>e.type==='boarding'||e.type==='arrival').slice(0,10).map(e=><li key={e.id}><Badge t={e.type}>{e.type}</Badge><span>{e.msg}</span><time>{fmt(e.t)}</time></li>)}</ul></Card></>
}

function Alerts({s,mut,run}){
 const [t,setT]=useState('all'),[st,setSt]=useState('open')
 const rows=s.alerts.filter(a=>(t==='all'||a.type===t)&&(st==='all'||(st==='open')===!a.resolved))
 const res=id=>mut(d=>{const a=d.alerts.find(x=>x.id===id);a.resolved=true;ev(d,'system',`Alert resolved: ${a.type} on ${a.bus}`,a.bus);return'Alert resolved'})
 return <><SimPanel run={run}/><Card title={`Safety alerts (${rows.length})`} right={<button className="btn" onClick={()=>mut(d=>{d.alerts.forEach(a=>a.resolved=true);return'All alerts resolved'})}>Resolve all</button>}>
  <div className="filters"><select value={t} onChange={e=>setT(e.target.value)}><option value="all">All types</option>{['Missed boarding','Unexpected event','SOS'].map(o=><option key={o}>{o}</option>)}</select>
  <select value={st} onChange={e=>setSt(e.target.value)}><option value="open">Unresolved</option><option value="done">Resolved</option><option value="all">All</option></select></div>
  <Table head={['Time','Type','Bus','Details','']} empty="No alerts match. All clear." rows={rows.map(a=><tr key={a.id}><td>{fmt(a.t)}</td><td><Badge>{a.type}</Badge></td><td>{a.bus}</td><td>{a.msg}</td><td>{a.resolved?<span className="muted">Resolved</span>:<button className="btn small" onClick={()=>res(a.id)}>Resolve</button>}</td></tr>)}/></Card></>
}

function History({s}){
 const [q,setQ]=useState(''),[t,setT]=useState('all'),[b,setB]=useState('all'),[d,setD]=useState('')
 const from=d?new Date(d+'T00:00:00').getTime():0
 const rows=s.events.filter(e=>(t==='all'||e.type===t)&&(b==='all'||e.bus===b)&&e.t>=from&&e.msg.toLowerCase().includes(q.toLowerCase()))
 return <Card title={`Journey history (${rows.length})`}><div className="filters"><input placeholder="Search events…" value={q} onChange={e=>setQ(e.target.value)}/>
  <select value={t} onChange={e=>setT(e.target.value)}><option value="all">All types</option>{['boarding','arrival','alert','system'].map(o=><option key={o}>{o}</option>)}</select>
  <select value={b} onChange={e=>setB(e.target.value)}><option value="all">All buses</option>{s.buses.map(x=><option key={x.id}>{x.id}</option>)}</select>
  <input type="date" value={d} onChange={e=>setD(e.target.value)} aria-label="From date"/><button className="btn" onClick={()=>{setQ('');setT('all');setB('all');setD('')}}>Clear</button></div>
  <Table head={['Timestamp','Type','Bus','Event']} empty="No events match your filters." rows={rows.map(e=><tr key={e.id}><td>{fmt(e.t)}</td><td><Badge t={e.type}>{e.type}</Badge></td><td>{e.bus}</td><td>{e.msg}</td></tr>)}/></Card>
}

function Settings({s,mut}){
 const set=(k,v)=>mut(d=>{d.settings[k]=v;return'Settings saved'})
 return <div className="grid2"><Card title="School administrator">
  <label>School name<input value={s.settings.school} onChange={e=>set('school',e.target.value)}/></label>
  <label>Administrator name<input value={s.settings.admin} onChange={e=>set('admin',e.target.value)}/></label>
  <label className="tog"><input type="checkbox" checked={s.settings.missed} onChange={e=>set('missed',e.target.checked)}/> Enable missed-boarding alerts (simulator)</label>
  <label className="tog"><input type="checkbox" checked={s.settings.sos} onChange={e=>set('sos',e.target.checked)}/> Enable SOS alerts (simulator)</label></Card>
 <Card title="Data & integrations"><p className="muted">Demo data is stored only in this browser (localStorage). Firebase is <b>not connected</b>; see <code>src/db.js</code> and the README. Notifications, GPS and wristband integration are <b>not implemented</b>.</p>
  <button className="btn danger" onClick={()=>{if(confirm('Reset all demo data?')){localStorage.clear();location.reload()}}}>Reset demo data</button></Card></div>
}

export default function App(){
 const [s,setS]=useState(()=>loadState()||seed()),[page,setPage]=useState(()=>location.hash.slice(1)||'dashboard'),[menu,setMenu]=useState(false),[toast,setToast]=useState('')
 useEffect(()=>saveState(s),[s])
 useEffect(()=>{const h=()=>setPage(location.hash.slice(1)||'dashboard');addEventListener('hashchange',h);return()=>removeEventListener('hashchange',h)},[])
 useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),2600);return()=>clearTimeout(t)},[toast])
 const go=p=>{location.hash=p;setMenu(false);scrollTo(0,0)}
 const mut=fn=>{const d=structuredClone(s);const m=fn(d);setS(d);if(m)setToast(m)}
 const run=k=>mut(SIM[k])
 const cur=PAGES.find(p=>p[0]===page)||PAGES[0],P={dashboard:Dashboard,students:Students,buses:Buses,journey:Journey,alerts:Alerts,history:History,settings:Settings}[cur[0]]
 const open=s.alerts.filter(a=>!a.resolved).length
 return <div className="app"><aside className={menu?'side open':'side'}><div className="brand"><span>🚌</span><div><b>SafeRide</b><small>{s.settings.school}</small></div></div>
  <nav>{PAGES.map(([k,l,i])=><button key={k} className={k===cur[0]?'on':''} onClick={()=>go(k)}><i>{i}</i>{l}{k==='alerts'&&open>0&&<em>{open}</em>}</button>)}</nav>
  <p className="demo">Demo mode · fictional data · no live tracking</p></aside>
  {menu&&<div className="scrim" onClick={()=>setMenu(false)}/>}
  <main><header><button className="burger" aria-label="Menu" onClick={()=>setMenu(!menu)}>☰</button><div><h1>{cur[1]}</h1><small>Smart Student Journey & Safety Monitoring</small></div><span className="sim">DEMO DATA</span><span className="who">{s.settings.admin}</span></header>
   <div className="page" key={cur[0]}><P s={s} mut={mut} run={run} go={go}/></div></main>
  {toast&&<div className="toast" role="status">{toast}</div>}</div>
}

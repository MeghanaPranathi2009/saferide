// Storage adapter. Today: browser localStorage (demo only). Replace these two functions to go live.
const KEY='saferide-demo-v1'
export const loadState=()=>{try{return JSON.parse(localStorage.getItem(KEY))}catch{return null}}
export const saveState=s=>{try{localStorage.setItem(KEY,JSON.stringify(s))}catch{}}
/* FIREBASE PLAN (not active): `npm i firebase`, then in this file:
   import {initializeApp} from 'firebase/app'; import {getDatabase,ref,onValue,set} from 'firebase/database'
   const app=initializeApp({apiKey:import.meta.env.VITE_FIREBASE_API_KEY, databaseURL:import.meta.env.VITE_FIREBASE_DATABASE_URL, ...})
   const db=getDatabase(app)
   loadState -> onValue(ref(db,'saferide'),snap=>setS(snap.val())); saveState -> set(ref(db,'saferide'),s)
   Suggested tree: /students/{id}, /buses/{id}, /events/{id}, /alerts/{id}. Add Firebase Auth + Database Rules
   (admins only) BEFORE storing any real data. Never put admin/service-account keys in this frontend. */

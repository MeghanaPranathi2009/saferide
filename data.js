// All demo data is FICTIONAL. Never put real student data in this file or in Git.
const S=[['Aarav S.','5A',1,'Maple Gate'],['Diya R.','5B',1,'Temple Rd'],['Kabir M.','6A',1,'Maple Gate'],['Anaya P.','7C',2,'Lake Point'],['Vihaan T.','6B',2,'Pier Stop'],['Isha N.','8A',2,'Lake Point'],['Reyansh K.','8B',3,'Clock Tower'],['Myra D.','9A',3,'Old Market'],['Arjun V.','9C',3,'Clock Tower'],['Saanvi B.','4A',4,'Green Park'],['Ishaan G.','4B',4,'Rose Lane'],['Tara J.','10A',1,'Temple Rd']]
export const seed=()=>({
 settings:{school:'Demo International School',admin:'School Admin',missed:true,sos:true},
 buses:[['BUS-01','North Ridge Loop','R. Kumar','Active'],['BUS-02','Lake View Express','S. Iyer','Active'],['BUS-03','Old Town Circuit','M. Das','Idle'],['BUS-04','Green Park Line','A. Khan','Maintenance']].map(([id,route,driver,status])=>({id,route,driver,status})),
 students:S.map(([name,cls,b,stop],i)=>({id:'STU-'+String(i+101),name,cls,bus:'BUS-0'+b,stop,status:'waiting'})),
 alerts:[{id:'a1',t:Date.now()-36e5,type:'Unexpected event',msg:'Route deviation near Old Market (demo)',bus:'BUS-03',resolved:false}],
 events:[{id:'e1',t:Date.now()-72e5,type:'system',msg:'Demo data loaded',bus:'—'}]
})

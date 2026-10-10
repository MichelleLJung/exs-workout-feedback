const {randomBytes,createHash}=require('node:crypto');
const hash=v=>createHash('sha256').update(v).digest('hex');
const reply=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const prompts=['Effective instruction, demonstration or cue: give an example','Correction, modification or response to participant needs: give an example','One improvement with a specific example','Something you would use in your own teaching'];
function assignments(schedules,state){return Object.entries(schedules).flatMap(([course,data])=>data.sessions.map((s,i)=>{const key=course+':workout-'+(i+1),support=data.teams[s.support],chosen=state.observerAssignments?.[key]||(support.length===2?support:[]);return {...s,key,course,instructors:data.teams[s.teach],observers:Array.isArray(chosen)&&chosen.length===2&&new Set(chosen).size===2&&chosen.every(n=>support.includes(n))?chosen:[]}})).filter(s=>!s.deferred&&state.sessions?.[s.key]!=='Canceled')}
async function handle(req,{enabled,isInstructor=false,store,schedules,state,generation,testMode=true}){
 if(!enabled)return reply({error:'Observer forms are unavailable.'},503);
 const url=new URL(req.url),action=url.searchParams.get('action'),sessions=assignments(schedules,state);
 if(action==='inbox'&&req.method==='GET'){
  if(!isInstructor)return reply({error:'Instructor access is required.'},403);
  const groups=await Promise.all(sessions.map(async s=>{const entry=await store.getWithMetadata(s.key,{type:'json',consistency:'strong'});return (entry?.data?.links||[]).filter(l=>s.observers.includes(l.observer)&&l.submission).flatMap(l=>l.submission.rows)}));
  return reply({observers:groups.flat()});
 }
 if(req.method!=='POST')return reply({error:'Method not allowed.'},405);
 if(req.headers.get('origin')!==url.origin||!req.headers.get('content-type')?.includes('application/json'))return reply({error:'Request is not permitted.'},403);
 const raw=await req.text();if(Buffer.byteLength(raw)>64000)return reply({error:'Submission is too large.'},413);
 let body;try{body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))throw Error()}catch{return reply({error:'Invalid submission.'},400)}
 const session=sessions.find(s=>s.key===body.session);
 if(!session)return reply({error:'This observer assignment is unavailable.'},404);
 if(action==='issue'){
  if(!isInstructor)return reply({error:'Instructor access is required.'},403);
  if(body.generation!==generation)return reply({error:'Load the current online records before creating links.'},409);
  if(session.observers.length!==2)return reply({error:'Choose exactly two support observers and save online first.'},409);
  for(let attempt=0;attempt<5;attempt++){
   const prior=await store.getWithMetadata(session.key,{type:'json',consistency:'strong'}),links=prior?.data?.links||[];
   const next=[...links];for(const observer of session.observers)if(!next.some(l=>l.observer===observer))next.push({observer,token:randomBytes(24).toString('hex')});
   const result=await store.setJSON(session.key,{links:next},prior?{onlyIfMatch:prior.etag}:{onlyIfNew:true});
   if(result.modified)return reply({links:next.filter(l=>session.observers.includes(l.observer)).map(l=>({observer:l.observer,path:'/observer.html#session='+encodeURIComponent(session.key)+'&token='+l.token}))});
  }return reply({error:'Another update is saving. Try again.'},409);
 }
 if(!['details','submit'].includes(action))return reply({error:'Unknown request.'},400);
 if(!/^[a-f0-9]{48}$/.test(body.token||''))return reply({error:'This observer link is invalid.'},404);
 for(let attempt=0;attempt<5;attempt++){
  const prior=await store.getWithMetadata(session.key,{type:'json',consistency:'strong'}),link=prior?.data?.links?.find(l=>hash(l.token)===hash(body.token)&&session.observers.includes(l.observer));
  if(!link)return reply({error:'This link is invalid or the observer assignment has changed. Ask your instructor for a current link.'},404);
  if(action==='details')return reply({observer:link.observer,instructors:session.instructors,date:session.date,time:session.time,course:session.course,prompts,test:testMode,submitted:!!link.submission,answers:link.submission?.rows.map(r=>r.answers)||null});
  if(!Array.isArray(body.answers)||body.answers.length!==session.instructors.length||body.answers.some(row=>!Array.isArray(row)||row.length!==4||row.some(a=>typeof a!=='string'||!a.trim()||a.length>1000)))return reply({error:'Complete all four prompts for each teaching team member (up to 1,000 characters each).'},400);
  const created=new Date().toISOString();const rows=session.instructors.map((student,i)=>({id:'observer-'+hash(session.key+'|'+link.observer+'|'+i),course:session.course,session:session.key,student,observer:link.observer,created,answers:body.answers[i].map(a=>a.trim()),include:false,edited:[],source:'shared-observer'}));
  const result=await store.setJSON(session.key,{links:prior.data.links.map(l=>l.token===link.token?{...l,submission:{rows}}:l)},{onlyIfMatch:prior.etag});
  if(result.modified)return reply({message:'Your observation is saved. Thank you!',submitted:true});
 }return reply({error:'Another update is saving. Please try again.'},409);
}
module.exports={handle,assignments};

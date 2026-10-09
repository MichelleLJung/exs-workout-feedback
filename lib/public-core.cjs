const {createHash,randomBytes}=require('node:crypto');
const {invitation}=require('./invitations-core.cjs');
const invitationPreview=(entry,session)=>{const {html,...message}=invitation(entry,session);return message};
const hash=s=>createHash('sha256').update(s).digest('hex');
const clean=(v,max=1000)=>typeof v==='string'?v.trim().slice(0,max):'';
const rating=v=>v===null?null:Number.isInteger(v)&&v>=1&&v<=5?v:undefined;
const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
async function handle(req,{store,schedules,statuses={},isInstructor=false,enabled=false,emailStatus={mode:'preview',configured:false},testMode=true}){
 if(!enabled)return reply({error:'Shared test forms are unavailable.'},503);
 const url=new URL(req.url),action=url.searchParams.get('action')||'sessions';
 const workouts=Object.entries(schedules).flatMap(([course,data])=>data.sessions.map((s,i)=>({...s,key:course+':workout-'+(i+1),course,instructors:data.teams[s.teach]}))).filter(s=>!s.deferred);
 const sessionKey=url.searchParams.get('session');
 const describe=s=>({key:s.key,instructors:s.instructors,date:s.date,time:s.time,status:statuses[s.key]||'Scheduled'});
 if(req.method==='GET'&&action==='sessions')return reply({test:testMode,sessions:workouts.map(describe)});
 if(req.method==='GET'&&action==='inbox'){
  if(!isInstructor)return reply({error:'Instructor access is required.'},403);
  const groups=await Promise.all(workouts.map(s=>store.getWithMetadata(s.key,{type:'json',consistency:'strong'})));
  const entries=groups.flatMap(g=>g?.data||[]);
  return reply({emailStatus,checkins:entries.map(({id,session,created,name,email,consent,test})=>({id,session,created,name,email,consent,test:test!==false})),feedback:entries.flatMap(e=>e.evaluation?.individual||[]),teamFeedback:entries.flatMap(e=>e.evaluation?.team?[e.evaluation.team]:[]),invitations:entries.filter(e=>e.consent&&statuses[e.session]==='Completed').map(e=>({id:'public:'+e.id,checkin:e.id,session:e.session,email:e.email,status:e.evaluation?'Evaluation submitted':e.delivery?.status==='sent'?'Invitation sent':e.delivery?'Delivery needs review — do not resend':!testMode&&emailStatus.mode==='live'?'Queued for delivery':'Preview only — no email sent',...invitationPreview(e,workouts.find(s=>s.key===e.session)),evaluationPath:'/evaluation.html?session='+encodeURIComponent(e.session)+'&token='+e.token}))});
 }
 if(!['GET','POST'].includes(req.method))return reply({error:'Method not allowed.'},405);
 if(req.method==='POST'&&(req.headers.get('origin')!==url.origin||!req.headers.get('content-type')?.includes('application/json')))return reply({error:'Request is not permitted.'},403);
 let body={};if(req.method==='POST'){const raw=await req.text();if(Buffer.byteLength(raw)>16000)return reply({error:'Submission is too large.'},413);try{body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))throw Error()}catch{return reply({error:'Invalid submission.'},400)}}
 const session=workouts.find(s=>s.key===(body.session||sessionKey));if(!session)return reply({error:'Workout not found.'},404);
 if(action==='checkin'&&req.method==='POST'){
  if(['Completed','Canceled'].includes(statuses[session.key]))return reply({error:'This workout is closed for check-in. Please ask the front desk.'},409);
  const name=clean(body.name,100),email=clean(body.email,254).toLowerCase();
  if(!name||!(testMode?/^[^\s@]+@example\.com$/:/^[^\s@]+@[^\s@]+\.[^\s@]+$/).test(email)||typeof body.consent!=='boolean'||body.website)return reply({error:testMode?'Use a fictional name and an @example.com email in this test preview.':'Enter your name and a valid email address.'},400);
  const id=hash(session.key+'|'+email),token=randomBytes(24).toString('hex');
  for(let attempt=0;attempt<5;attempt++){
   const prior=await store.getWithMetadata(session.key,{type:'json',consistency:'strong'}),entries=prior?.data||[];
   if(entries.some(e=>e.id===id))return reply({error:'This email is already checked in for this workout.'},409);
   if(entries.length>=200)return reply({error:'This workout has reached its check-in limit.'},429);
   const entry={id,token,session:session.key,created:new Date().toISOString(),name,email,consent:body.consent,test:testMode};
   const result=await store.setJSON(session.key,[...entries,entry],prior?{onlyIfMatch:prior.etag}:{onlyIfNew:true});
   if(result.modified)return reply({message:'You’re checked in. Enjoy your workout!',evaluationPath:testMode&&body.consent?'/evaluation.html?session='+encodeURIComponent(session.key)+'&token='+token:null});
  }return reply({error:'Another check-in is saving. Please try again.'},409);
 }
 if(action==='evaluation'){
  const token=body.token||url.searchParams.get('token');if(!/^[a-f0-9]{48}$/.test(token||''))return reply({error:'This evaluation link is invalid.'},404);
  for(let attempt=0;attempt<5;attempt++){
   const prior=await store.getWithMetadata(session.key,{type:'json',consistency:'strong'}),entries=prior?.data||[],entry=entries.find(e=>hash(e.token)===hash(token)&&e.consent);
   if(!entry)return reply({error:'This evaluation link is invalid.'},404);
   if(!testMode&&statuses[session.key]!=='Completed')return reply({error:'Feedback opens after the workout ends.'},409);
   if(req.method==='GET')return reply({session:describe(session),submitted:!!entry.evaluation,test:testMode});
   if(entry.evaluation)return reply({error:'Your evaluation has already been submitted. Thank you.'},409);
   if(!Array.isArray(body.individual)||(body.format==='workout-only'?body.individual.length!==0:body.individual.length!==session.instructors.length)||!Array.isArray(body.teamRatings)||body.teamRatings.length!==3||typeof body.permission!=='boolean')return reply({error:'Complete the evaluation form.'},400);
   if(body.individual.some(r=>!r||!Array.isArray(r.ratings)||r.ratings.length!==6||r.ratings.some(n=>rating(n)===undefined))||body.teamRatings.some(n=>rating(n)===undefined))return reply({error:'Ratings must be 1–5 or not observed.'},400);
   const created=new Date().toISOString(),batch='public-'+entry.id;
   const individual=body.individual.map((r,i)=>({id:batch+'-'+i,batch,course:session.course,student:session.instructors[i],session:session.key,created,ratings:r.ratings,well:clean(r.well),improve:clean(r.improve),permission:body.permission,include:{well:false,improve:false},edited:{}}));
   const team={id:batch+'-team',batch,course:session.course,session:session.key,created,ratings:body.teamRatings,comment:clean(body.teamComment),permission:body.permission,include:{},edited:{}};
   if(!individual.some(r=>r.ratings.some(n=>n!==null)||r.well||r.improve)&&!team.ratings.some(n=>n!==null)&&!team.comment)return reply({error:'Add at least one rating or comment.'},400);
   const next=entries.map(e=>e.id===entry.id?{...e,evaluation:{individual,team}}:e);
   const result=await store.setJSON(session.key,next,{onlyIfMatch:prior.etag});if(result.modified)return reply({message:'Thank you. Your evaluation has been submitted.'});
  }return reply({error:'Another response is saving. Please try again.'},409);
 }
 return reply({error:'Unknown request.'},400);
}
module.exports={handle};

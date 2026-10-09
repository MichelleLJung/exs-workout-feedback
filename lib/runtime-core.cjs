const {randomBytes}=require('node:crypto');
const {blank}=require('./records-core.cjs');
const DEFAULT_KEY='runtime-config-v1';
function validDateTime(s){
 if(typeof s.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s.date))return false;
 const date=new Date(s.date+'T12:00:00Z');if(Number.isNaN(date.getTime())||date.toISOString().slice(0,10)!==s.date)return false;
 const times=typeof s.time==='string'&&s.time.match(/^(\d{1,2}):(\d{2})[–-](\d{1,2}):(\d{2})$/);
 return !!times&&Number(times[1])<24&&Number(times[3])<24&&Number(times[2])<60&&Number(times[4])<60&&(Number(times[3])*60+Number(times[4]))>(Number(times[1])*60+Number(times[2]));
}
function validSchedules(data){
 if(!data||typeof data!=='object'||Object.keys(data).sort().join(',')!=='EXS215,EXS217')return false;
 return Object.values(data).every(c=>c&&Array.isArray(c.teams)&&c.teams.length>=2&&c.teams.length<=20&&c.teams.every(t=>Array.isArray(t)&&t.length>=1&&t.length<=4&&t.every(n=>typeof n==='string'&&n.trim().length>0&&n.length<=100))&&new Set(c.teams.flat()).size===c.teams.flat().length&&Array.isArray(c.sessions)&&c.sessions.length>=1&&c.sessions.length<=40&&c.sessions.every(s=>s&&[s.teach,s.desk,s.support].every(i=>Number.isInteger(i)&&i>=0&&i<c.teams.length)&&new Set([s.teach,s.desk,s.support]).size===3&&Array.isArray(s.participants)&&s.participants.every(i=>Number.isInteger(i)&&i>=0&&i<c.teams.length)&&new Set(s.participants).size===s.participants.length&&!s.participants.some(i=>[s.teach,s.desk,s.support].includes(i))&&(s.deferred===true||validDateTime(s))));
}
async function runtime(store,demo){const saved=await store.getWithMetadata(DEFAULT_KEY,{type:'json',consistency:'strong'});const config=saved?.data||{test:true,generation:'demo'};if(!/^(demo|live-[a-f0-9]{16})$/.test(config.generation)||typeof config.test!=='boolean'||config.test!==(config.generation==='demo')||!config.test&&!validSchedules(config.schedules))throw Error('Invalid runtime configuration');return {config,etag:saved?.etag||null,schedules:config.test?demo:config.schedules,recordKey:config.generation==='demo'?'instructor-records-v1':'instructor-records-'+config.generation,publicStore:config.test?'workout-public-test':'workout-public-'+config.generation};}
async function setup(req,{store,demo,isInstructor,enabled,getPublicStore}){
 const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
 if(!enabled)return json({error:'Online setup is unavailable.'},503);
 if(!isInstructor)return json({error:'Instructor access is required.'},403);
 const active=await runtime(store,demo);
 if(req.method==='GET'&&new URL(req.url).searchParams.get('action')==='backup'){
  const archive=active.config.archive||{generation:active.config.generation,recordKey:active.recordKey,publicStore:active.publicStore};
  const records=await store.getWithMetadata(archive.recordKey,{type:'json',consistency:'strong'}),publicStore=getPublicStore(archive.publicStore);
  const keys=Object.entries(demo).flatMap(([c,v])=>v.sessions.map((_,i)=>c+':workout-'+(i+1)));
  const submissions=await Promise.all(keys.map(async key=>({session:key,entries:(await publicStore.getWithMetadata(key,{type:'json',consistency:'strong'}))?.data||[]})));
  return json({schema:'workout-backup-v1',created:new Date().toISOString(),archive,records:records?.data||blank(),submissions});
 }
 if(req.method==='GET')return json({test:active.config.test,generation:active.config.generation,rosterReady:validSchedules(active.config.draftSchedules),archive:active.config.archive||null});
 if(req.method!=='POST'||req.headers.get('origin')!==new URL(req.url).origin||!req.headers.get('content-type')?.includes('application/json'))return json({error:'Request is not permitted.'},403);
 const raw=await req.text();if(Buffer.byteLength(raw)>64000)return json({error:'Setup file is too large.'},413);
 let body;try{body=JSON.parse(raw)}catch{return json({error:'Invalid setup file.'},400)}
 if(!active.config.test)return json({error:'Live records are already active. This setup cannot clear live data.'},409);
 let next;
 if(body?.action==='roster'){
  if(!validSchedules(body.schedules))return json({error:'The roster or workout schedule is invalid. Use the prepared course-schedules JSON file.'},400);
  next={...active.config,draftSchedules:body.schedules};
 }else if(body?.action==='start-live'){
  if(body.confirmation!=='START LIVE RECORDS'||!validSchedules(active.config.draftSchedules))return json({error:'Load the real roster and type START LIVE RECORDS first.'},400);
  const generation='live-'+randomBytes(8).toString('hex'),key='instructor-records-'+generation;
  const created=await store.setJSON(key,blank(),{onlyIfNew:true});if(!created.modified)return json({error:'Could not prepare fresh records.'},409);
  // Existing instructor records and public test submissions remain intact in their old namespaces.
  next={test:false,generation,schedules:active.config.draftSchedules,archive:{generation:active.config.generation,recordKey:active.recordKey,publicStore:active.publicStore,archivedAt:new Date().toISOString()}};
 }else return json({error:'Unknown setup action.'},400);
 const result=await store.setJSON(DEFAULT_KEY,next,active.etag?{onlyIfMatch:active.etag}:{onlyIfNew:true});
 if(!result.modified)return json({error:'Setup changed on another device. Reload before continuing.'},409);
 return json({test:next.test,generation:next.generation,rosterReady:!!next.draftSchedules,message:next.test?'Real roster staged privately. Test records are still active.':'Fresh live records are ready. Test records remain archived. Load online records again.'});
}
module.exports={runtime,setup,validSchedules};

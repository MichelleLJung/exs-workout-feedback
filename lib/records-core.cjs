const blank=()=>({schema:'schedule-v2',values:{},notes:{},comments:{},priorities:{},participation:{},feedback:[],teamFeedback:[],observers:[],observerAssignments:{},versions:{},snapshots:[],sessions:{},checkins:[],queue:[]});
const valid=s=>s&&s.schema==='schedule-v2'&&['values','notes','comments','priorities','participation','observerAssignments','versions','sessions'].every(k=>s[k]&&typeof s[k]==='object'&&!Array.isArray(s[k]))&&['feedback','teamFeedback','observers','snapshots','checkins','queue'].every(k=>Array.isArray(s[k]))&&Object.values(s.values).every(n=>Number.isInteger(n)&&n>=0&&n<=4);
async function handle(req,{enabled,email,instructorId,user,store}){
 const reply=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 if(!enabled||!email||!instructorId)return reply({error:'Protected online saving has not been activated.'},503);
 if(!user)return reply({error:'Sign in to access instructor records.'},401);
 if(!user.email||user.email.toLowerCase()!==email.toLowerCase()||user.id!==instructorId)return reply({error:'Instructor access is required.'},403);
 const key='instructor-records-v1';
 if(req.method==='GET'){const entry=await store.getWithMetadata(key,{type:'json',consistency:'strong'});return reply({state:entry?.data||blank(),etag:entry?.etag||null})}
 if(req.method!=='PUT')return reply({error:'Method not allowed.'},405);
 if(req.headers.get('origin')!==new URL(req.url).origin)return reply({error:'Request origin is not permitted.'},403);
 if(!req.headers.get('content-type')?.includes('application/json'))return reply({error:'JSON is required.'},415);
 const raw=await req.text();if(Buffer.byteLength(raw)>2000000)return reply({error:'Records are too large. Export and review report snapshots.'},413);
 let body;try{body=JSON.parse(raw)}catch{return reply({error:'Invalid JSON.'},400)};
 if(!valid(body.state)||!(body.etag===null||typeof body.etag==='string'&&body.etag.length<256))return reply({error:'Invalid records or version.'},400);
 const result=await store.setJSON(key,body.state,{...(body.etag?{onlyIfMatch:body.etag}:{onlyIfNew:true}),metadata:{updated:new Date().toISOString()}});
 if(!result.modified)return reply({error:'Records changed on another device. Export your current work, then load the latest records before continuing.'},409);
 return reply({etag:result.etag,saved:new Date().toISOString()});
}
module.exports={handle,blank,valid};

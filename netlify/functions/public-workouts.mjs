import {getUser} from '@netlify/identity';
import {getStore} from '@netlify/blobs';
import core from '../../lib/public-core.cjs';
import demo from '../../lib/demo-schedule.cjs';
import runtimeCore from '../../lib/runtime-core.cjs';
export default async req=>{try{
 const records=getStore({name:'workout-instructor-records',consistency:'strong'});
 const active=await runtimeCore.runtime(records,demo);
 const saved=await records.getWithMetadata(active.recordKey,{type:'json',consistency:'strong'});
 const inbox=new URL(req.url).searchParams.get('action')==='inbox';
 const user=inbox?await getUser():null;
 const isInstructor=!!user&&user.id==='10e15428-183c-4a54-884b-bc90aad67da6'&&user.email?.toLowerCase()===process.env.EXS_ADMIN_EMAIL?.toLowerCase();
 return await core.handle(req,{store:getStore({name:active.publicStore,consistency:'strong'}),schedules:active.schedules,testMode:active.config.test,statuses:saved?.data?.sessions||{},isInstructor,emailStatus:{mode:!active.config.test&&process.env.EMAIL_MODE==='live'&&process.env.EXS_TEST_MODE==='false'?'live':'preview',configured:['SMTP_HOST','SMTP_PORT','SMTP_USER','SMTP_PASS','EMAIL_FROM'].every(k=>!!process.env[k])},enabled:process.env.EXS_CLOUD_ENABLED==='true'});
}catch{return Response.json({error:'The shared test service is unavailable. Please try again shortly.'},{status:503,headers:{'Cache-Control':'no-store'}})}};

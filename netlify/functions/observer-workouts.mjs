import {getUser} from '@netlify/identity';
import {getStore} from '@netlify/blobs';
import core from '../../lib/observers-core.cjs';
import runtimeCore from '../../lib/runtime-core.cjs';
import demo from '../../lib/demo-schedule.cjs';
export default async req=>{try{
 const records=getStore({name:'workout-instructor-records',consistency:'strong'}),active=await runtimeCore.runtime(records,demo);
 const saved=await records.getWithMetadata(active.recordKey,{type:'json',consistency:'strong'}),action=new URL(req.url).searchParams.get('action');
 const user=['issue','inbox','reset-test'].includes(action)?await getUser():null;
 const isInstructor=!!user&&user.id==='10e15428-183c-4a54-884b-bc90aad67da6'&&user.email?.toLowerCase()===process.env.EXS_ADMIN_EMAIL?.toLowerCase();
 return await core.handle(req,{enabled:process.env.EXS_CLOUD_ENABLED==='true',isInstructor,store:getStore({name:active.publicStore+'-observers',consistency:'strong'}),schedules:active.schedules,state:saved?.data||{},generation:active.config.generation,testMode:active.config.test});
}catch{return Response.json({error:'Observer forms are unavailable. Please try again shortly.'},{status:503,headers:{'Cache-Control':'no-store'}})}};

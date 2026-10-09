import {getUser} from '@netlify/identity';
import {getStore} from '@netlify/blobs';
import core from '../../lib/records-core.cjs';
import runtimeCore from '../../lib/runtime-core.cjs';
import demo from '../../lib/demo-schedule.cjs';
export default async req=>{try{
 const store=getStore({name:'workout-instructor-records',consistency:'strong'}),active=await runtimeCore.runtime(store,demo);
 return await core.handle(req,{enabled:process.env.EXS_CLOUD_ENABLED==='true',email:process.env.EXS_ADMIN_EMAIL,instructorId:'10e15428-183c-4a54-884b-bc90aad67da6',user:await getUser(),store,key:active.recordKey,generation:active.config.generation,schedules:active.schedules,testMode:active.config.test});
}catch{return Response.json({error:'Protected saving is unavailable. Your current work has not been saved online.'},{status:503,headers:{'Cache-Control':'no-store'}})}};

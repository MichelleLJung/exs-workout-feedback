import {getUser} from '@netlify/identity';
import {getStore} from '@netlify/blobs';
import core from '../../lib/records-core.cjs';
export default async(req)=>{try{return await core.handle(req,{enabled:process.env.EXS_CLOUD_ENABLED==='true',email:process.env.EXS_ADMIN_EMAIL,instructorId:'10e15428-183c-4a54-884b-bc90aad67da6',user:await getUser(),store:getStore({name:'workout-instructor-records',consistency:'strong'})})}catch{return Response.json({error:'Protected saving is unavailable. Your current work has not been saved online.'},{status:503,headers:{'Cache-Control':'no-store'}})}};

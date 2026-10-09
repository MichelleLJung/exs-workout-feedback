import {getUser} from '@netlify/identity';
import {getStore} from '@netlify/blobs';
import core from '../../lib/runtime-core.cjs';
import demo from '../../lib/demo-schedule.cjs';
export default async req=>{try{const user=await getUser();return await core.setup(req,{store:getStore({name:'workout-instructor-records',consistency:'strong'}),demo,isInstructor:user?.id==='10e15428-183c-4a54-884b-bc90aad67da6'&&!!process.env.EXS_ADMIN_EMAIL&&user?.email?.toLowerCase()===process.env.EXS_ADMIN_EMAIL.toLowerCase(),getPublicStore:name=>getStore({name,consistency:'strong'}),enabled:process.env.EXS_CLOUD_ENABLED==='true'});}catch{return Response.json({error:'Launch setup could not be completed. Existing records were retained.'},{status:503,headers:{'Cache-Control':'no-store'}})}};

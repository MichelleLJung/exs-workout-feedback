import {getUser,admin} from '@netlify/identity';
import {getStore} from '@netlify/blobs';
import core from '../../lib/records-core.cjs';
async function verifiedInstructor(){
 const signedIn=await getUser();
 if(!signedIn?.id||signedIn.email?.toLowerCase()!==process.env.EXS_ADMIN_EMAIL?.toLowerCase())return signedIn;
 const account=await admin.getUser(signedIn.id);
 if(account.id!==signedIn.id||account.email?.toLowerCase()!==signedIn.email?.toLowerCase())return null;
 return account;
}
export default async(req)=>{try{return await core.handle(req,{enabled:process.env.EXS_CLOUD_ENABLED==='true',email:process.env.EXS_ADMIN_EMAIL,user:await verifiedInstructor(),store:getStore({name:'workout-instructor-records',consistency:'strong'})})}catch{return Response.json({error:'Protected saving is unavailable. Your current work has not been saved online.'},{status:503,headers:{'Cache-Control':'no-store'}})}};

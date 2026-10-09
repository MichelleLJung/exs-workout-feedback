import {getIdentityConfig} from '@netlify/identity';
import {getStore} from '@netlify/blobs';
import core from '../../lib/records-core.cjs';
async function verifiedInstructor(req){
 const cookie=req.headers.get('cookie')||'';
 const match=cookie.match(/(?:^|;\s*)nf_jwt=([^;]+)/);
 const bearer=req.headers.get('authorization');
 const token=bearer?.startsWith('Bearer ')?bearer.slice(7):match?decodeURIComponent(match[1]):null;
 if(!token)return null;
 const identity=getIdentityConfig();
 if(!identity?.url)return null;
 const endpoint=identity.url.replace(/\/$/,'')+'/user';
 const response=await fetch(endpoint,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(10000)});
 if(!response.ok)return null;
 const user=await response.json();
 return {email:user.email,confirmedAt:user.confirmed_at};
}
export default async(req)=>{try{return await core.handle(req,{enabled:process.env.EXS_CLOUD_ENABLED==='true',email:process.env.EXS_ADMIN_EMAIL,user:await verifiedInstructor(req),store:getStore({name:'workout-instructor-records',consistency:'strong'})})}catch{return Response.json({error:'Protected saving is unavailable. Your current work has not been saved online.'},{status:503,headers:{'Cache-Control':'no-store'}})}};

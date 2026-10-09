const keys=['SMTP_HOST','SMTP_PORT','SMTP_USER','SMTP_PASS','EMAIL_FROM'];
async function handle(req,{user,env,verify}){
 const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
 if(env.EXS_CLOUD_ENABLED!=='true')return json({error:'Online service is unavailable.'},503);
 if(!user||user.id!=='10e15428-183c-4a54-884b-bc90aad67da6'||!env.EXS_ADMIN_EMAIL||user.email?.toLowerCase()!==env.EXS_ADMIN_EMAIL.toLowerCase())return json({error:'Sign in as the instructor to check email.'},401);
 if(req.method!=='POST')return json({error:'Use the connection check button.'},405);
 if(req.headers.get('origin')!==new URL(req.url).origin)return json({error:'Open the connection check from this site.'},403);
 if(keys.some(k=>!env[k])||![465,587].includes(Number(env.SMTP_PORT)))return json({error:'Email settings are incomplete. Check the saved SMTP settings.'},503);
 try{await verify();return json({verified:true,message:'Email connection verified. No message was sent.'});}
 catch{return json({error:'Email connection could not be verified. Check the account, app password, and SMTP settings. No message was sent.'},503);}
}
module.exports={handle};

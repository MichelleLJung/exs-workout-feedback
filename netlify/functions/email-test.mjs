import {getUser} from '@netlify/identity';
import {getStore} from '@netlify/blobs';
import nodemailer from 'nodemailer';
import {invitationHTML} from '../../lib/invitation-html.cjs';
export default async req=>{
 const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
 const user=await getUser();
 if(process.env.EXS_CLOUD_ENABLED!=='true'||user?.id!=='10e15428-183c-4a54-884b-bc90aad67da6'||user?.email?.toLowerCase()!=='mic2187924@mesacc.edu'||process.env.EXS_ADMIN_EMAIL?.toLowerCase()!==user.email.toLowerCase())return json({error:'Instructor sign-in required.'},401);
 if(req.method!=='POST'||req.headers.get('origin')!==new URL(req.url).origin)return json({error:'Use the instructor test email button.'},403);
 const store=getStore({name:'workout-email-tests',consistency:'strong'}),key='styled-design-test-v1';
 const existing=await store.get(key,{type:'json',consistency:'strong'});
 if(existing)return json({message:existing.status==='sent'?'The test email was already sent. Check your MCC inbox.':'The test send was already attempted. Check your inbox before retrying.'});
 if(['SMTP_HOST','SMTP_PORT','SMTP_USER','SMTP_PASS','EMAIL_FROM'].some(k=>!process.env[k]))return json({error:'Email settings are incomplete.'},503);
 const claimed=await store.setJSON(key,{status:'sending',created:new Date().toISOString()},{onlyIfNew:true});
 if(!claimed.modified)return json({message:'The test send is already being processed.'});
 const port=Number(process.env.SMTP_PORT),transport=nodemailer.createTransport({host:process.env.SMTP_HOST,port,secure:port===465,requireTLS:port===587,auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS},connectionTimeout:5000,greetingTimeout:5000,socketTimeout:10000});
 try{
 const preview='https://exs-workout-feedback.netlify.app/email-preview.html';
 const html=invitationHTML({when:'Example workout · Tuesday, October 20, 2026',time:'8:30–9:15 AM (Arizona time)',link:preview}).replace('<h1 style=', '<p style="margin:0 0 20px;padding:12px;background:#fff3e8;color:#7a3200;font-size:14px;line-height:1.5;"><strong>Design test for Michelle.</strong> This is a sample invitation. The button opens an email preview, not a participant evaluation.</p><h1 style=');
 const result=await transport.sendMail({from:process.env.EMAIL_FROM,to:'mic2187924@mesacc.edu',subject:'MCC Workout Feedback — styled email test',html,text:'Hi Michelle,\n\nThis is your requested design test for the MCC Workout Feedback email. Please check the colors, layout, date and time, and feedback button.\n\nThe button in the HTML version opens a sample preview, not a participant evaluation:\n'+preview+'\n\nNo participant invitations have been sent.\n\nMCC Workout Feedback'});
 await store.setJSON(key,{status:'sent',sent:new Date().toISOString(),messageId:result.messageId});
 return json({message:'Styled test email sent to mic2187924@mesacc.edu. Check your inbox and spam folder.'});
 }catch{await store.setJSON(key,{status:'needs-review'});return json({error:'The sending result is uncertain. Check your inbox before attempting another test.'},503);}finally{transport.close();}
};

import {getStore} from '@netlify/blobs';
import nodemailer from 'nodemailer';
import core from '../../lib/invitations-core.cjs';
import demo from '../../lib/demo-schedule.cjs';
import runtimeCore from '../../lib/runtime-core.cjs';
export const config={schedule:'*/5 * * * *'};
export default async()=>{
 // Both gates remain off in the demo. Enabling real collection is a separate launch step.
 if(process.env.EMAIL_MODE!=='live'||process.env.EXS_TEST_MODE!=='false')return Response.json({mode:'preview',sent:0});
 const required=['SMTP_HOST','SMTP_PORT','SMTP_USER','SMTP_PASS','EMAIL_FROM'];
 if(required.some(k=>!process.env[k])||![465,587].includes(Number(process.env.SMTP_PORT)))return Response.json({error:'Email connection is not configured.',sent:0},{status:503});
 const records=getStore({name:'workout-instructor-records',consistency:'strong'}),active=await runtimeCore.runtime(records,demo);
 if(active.config.test)return Response.json({mode:'preview',sent:0});
 const saved=await records.getWithMetadata(active.recordKey,{type:'json',consistency:'strong'});
 const transport=nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT),secure:Number(process.env.SMTP_PORT)===465,requireTLS:Number(process.env.SMTP_PORT)===587,auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS},connectionTimeout:5000,greetingTimeout:5000,socketTimeout:5000});
 return Response.json(await core.processInvitations({store:getStore({name:active.publicStore,consistency:'strong'}),schedules:active.schedules,statuses:saved?.data?.sessions||{},live:true,testMode:false,deliver:message=>transport.sendMail({from:process.env.EMAIL_FROM,...message})}));
};

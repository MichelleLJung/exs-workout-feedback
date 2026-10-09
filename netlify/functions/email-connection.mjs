import {getUser} from '@netlify/identity';
import nodemailer from 'nodemailer';
import core from '../../lib/email-connection-core.cjs';
export default async req=>{
 try{return await core.handle(req,{user:await getUser(),env:process.env,verify:async()=>{
  const port=Number(process.env.SMTP_PORT);
  const transport=nodemailer.createTransport({host:process.env.SMTP_HOST,port,secure:port===465,requireTLS:port===587,auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS},connectionTimeout:5000,greetingTimeout:5000,socketTimeout:5000});
  try{await transport.verify();}finally{transport.close();}
 }});}catch{return Response.json({error:'Email connection check is unavailable. No message was sent.'},{status:503,headers:{'Cache-Control':'no-store'}});}
};

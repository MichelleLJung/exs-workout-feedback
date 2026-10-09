const assert=require('node:assert/strict');
const {handle}=require('./lib/email-connection-core.cjs');
(async()=>{
 const env={EXS_CLOUD_ENABLED:'true',EXS_ADMIN_EMAIL:'owner@example.com',SMTP_HOST:'smtp.example.com',SMTP_PORT:'465',SMTP_USER:'owner@example.com',SMTP_PASS:'private-password',EMAIL_FROM:'Workout <owner@example.com>'};
 const user={id:'10e15428-183c-4a54-884b-bc90aad67da6',email:env.EXS_ADMIN_EMAIL};let calls=0;
 const req=(method='POST',origin='https://workout.example.com')=>new Request('https://workout.example.com/.netlify/functions/email-connection',{method,headers:{origin}});
 const options={env,user,verify:async()=>{calls++}};
 assert.equal((await handle(req(),{...options,user:null})).status,401);
 assert.equal((await handle(req(),{...options,user:{...user,id:'someone-else'}})).status,401);
 assert.equal((await handle(req(),{...options,user:{...user,email:'different@example.com'}})).status,401);
 assert.equal((await handle(req(),{...options,env:{...env,EXS_CLOUD_ENABLED:'false'}})).status,503);
 assert.equal((await handle(req('GET'),options)).status,405);
 assert.equal((await handle(req('POST','https://other.example.com'),options)).status,403);
 assert.equal((await handle(req(),{...options,env:{...env,SMTP_PASS:''}})).status,503);
 assert.equal(calls,0);
 const result=await handle(req(),options);assert.equal(result.status,200);assert.equal((await result.json()).verified,true);assert.equal(calls,1);
 const failed=await handle(req(),{...options,verify:async()=>{throw Error('private-password')}});assert.equal(failed.status,503);assert.ok(!(await failed.text()).includes('private-password'));
 console.log('Protected email connection checks passed.');
})().catch(e=>{console.error(e);process.exitCode=1});

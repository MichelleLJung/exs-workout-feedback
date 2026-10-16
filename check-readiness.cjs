const assert=require('node:assert/strict');
const {handle}=require('./lib/public-core.cjs');
const {processInvitations}=require('./lib/invitations-core.cjs');
const schedules=require('./lib/demo-schedule.cjs');
(async()=>{
 const records=new Map();
 const store={getWithMetadata:async k=>structuredClone(records.get(k)||null),setJSON:async(k,data,opts={})=>{const prior=records.get(k);if(opts.onlyIfNew&&prior||opts.onlyIfMatch&&prior?.etag!==opts.onlyIfMatch)return {modified:false};const etag=String(Number(prior?.etag||0)+1);records.set(k,{data:structuredClone(data),etag});return {modified:true,etag}}};
 const session='EXS215:workout-1',statuses={},base={enabled:true,store,schedules,statuses,testMode:false,emailStatus:{mode:'live',configured:true}};
 const request=(action,body,query='')=>new Request('https://site.test/.netlify/functions/public-workouts?action='+action+query,body===undefined?{}:{method:'POST',headers:{origin:'https://site.test','content-type':'application/json'},body:JSON.stringify(body)});
 const call=(action,body,query='',extra={})=>handle(request(action,body,query),{...base,...extra});
 for(let i=0;i<40;i++)assert.equal((await call('checkin',{session,name:'Fictional attendee '+i,email:'attendee'+i+'@mail.invalid'})).status,200);
 assert(records.get(session).data.every(e=>e.consent&&e.evaluationExpected&&e.test===false));
 const sent=[];const worker={store,schedules,statuses,live:true,testMode:false,clock:()=>0,deliver:async message=>{sent.push(message);return {messageId:'simulated-'+sent.length}}};
 assert.equal((await processInvitations(worker)).sent,0);
 statuses[session]='Completed';
 const outcome=await processInvitations(worker);assert.equal(outcome.sent,40);assert.equal(new Set(sent.map(m=>m.to)).size,40);
 assert(sent.every(m=>m.html.includes('evaluation.html?session=EXS215%3Aworkout-1')));
 await processInvitations(worker);assert.equal(sent.length,40);
 const first=records.get(session).data[0];
 const payload={session,token:first.token,format:'workout-v2',permission:true,individual:[],teamRatings:[5,4,null,5],helpful:'A clear demonstration.',improvement:'More transition time.'};
 assert.equal((await call('evaluation',payload)).status,200);
 assert.equal((await call('evaluation',payload)).status,409);
 let inbox=await(await call('inbox',undefined,'',{isInstructor:true})).json();
 assert.equal(inbox.checkins.length,40);assert.equal(inbox.teamFeedback.length,1);assert.equal(inbox.invitations.filter(q=>q.status==='Evaluation submitted').length,1);assert.equal(inbox.invitations.filter(q=>q.status==='Accepted by email server').length,39);
 assert.equal(inbox.teamFeedback[0].permission,true);assert.deepEqual(inbox.teamFeedback[0].include,{});
 // A deadline leaves unclaimed messages queued, and the next cycle resumes without duplicating sends.
 const entries=records.get(session).data.map(e=>{delete e.delivery;delete e.evaluation;return e});records.set(session,{data:entries,etag:'100'});
 let clock=0;const budget=await processInvitations({...worker,clock:()=>clock,deliver:async()=>{clock+=5000;return {messageId:'budget'}}});assert.equal(budget.sent,2);assert.equal(records.get(session).data.filter(e=>e.delivery).length,2);
 assert.equal((await processInvitations(worker)).sent,38);
 // A class larger than the batch cap continues on the next cycle.
 const larger=Array.from({length:65},(_,i)=>({...first,id:'batch-'+i,email:'batch'+i+'@mail.invalid',evaluation:undefined,delivery:undefined}));records.set(session,{data:larger,etag:'200'});
 assert.equal((await processInvitations(worker)).sent,50);assert.equal((await processInvitations(worker)).sent,15);
 // Missing email configuration is not described as queued normally.
 records.set(session,{data:[{...first,delivery:undefined,evaluation:undefined}],etag:'300'});
 inbox=await(await call('inbox',undefined,'',{isInstructor:true,emailStatus:{mode:'live',configured:false}})).json();assert.equal(inbox.invitations[0].status,'Blocked — email settings incomplete');
 console.log('Passed: simulated 40-attendee live flow, all-email eligibility, completion gating, unique invitations, evaluation persistence, visible delivery status, 65-person batch continuation and deadline-safe queue continuation. No real email was sent.');
})().catch(e=>{console.error(e);process.exitCode=1});

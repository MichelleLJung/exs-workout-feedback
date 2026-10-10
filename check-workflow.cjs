const fs=require('fs'),vm=require('vm'),assert=require('assert');
const elements={'#course':{value:'EXS215'},'#student':{value:'DemoA'},'#saved':{},'#content':{},'#import':{addEventListener(){}}};
const context=vm.createContext({window:{addEventListener(){}},document:{querySelector:s=>elements[s],querySelectorAll:()=>[],addEventListener(){}},localStorage:{getItem:()=>null,setItem(){}},crypto:require('crypto').webcrypto,console,Date,assert});
for(const file of ['comments.js','schedule-data.js','sessions.js','evaluations.js','reports.js','app.js'])vm.runInContext(fs.readFileSync(__dirname+'/'+file,'utf8'),context);
const check=code=>vm.runInContext(code,context);
check(`assert.equal(schedule().teams.flat().length,13);assert.equal(schedule().sessions.filter(s=>!s.deferred).length,5);assert.equal(assignment('individual'),0);assert(roleDeferred(0));assert(!roleDeferred(1));assert.equal(professional(),null);assert.equal(studentParticipation().length,3);assert.equal(Object.keys(state.values).length,0);`);
check(`assert(addCheckin(0,'real@school.edu',true));assert.equal(state.checkins.length,0);assert.equal(addCheckin(0,'test@example.com',true),'');assert(addCheckin(0,'TEST@example.com',true));setSessionStatus(0,'Delayed');assert.equal(state.queue.length,0);setSessionStatus(0,'Completed');assert.equal(state.queue.length,1);setSessionStatus(0,'Completed');assert.equal(state.queue.length,1);assert(addCheckin(0,'late@example.com',true));setSessionStatus(0,'Canceled');assert.equal(state.queue.length,0);assert(addCheckin(5,'deferred@example.com',true));setSessionStatus(5,'Completed');assert.equal(sessionStatus(5),'Awaiting alternate opportunity');assert.equal(state.queue.length,0);`);
check(`shared.forEach((_,i)=>state.values[key('shared',i)]=3);individual.forEach((_,i)=>state.values[key('individual',i)]=4);assert.equal(teaching(),3.6);`);
elements['#student'].value='DemoB';
check(`assert.equal(state.values[key('shared',0)],3);assert.equal(teaching(),null);`);
elements['#student'].value='DemoC';
check(`assert.equal(state.values[key('shared',0)],undefined);assert(!roleDeferred(0));assert(!roleDeferred(1));state.values[key('role',0)]=4;state.values[key('role',1)]=2;assert.equal(professional(),3);state.participation[key('participation',2)]='Not completed';assert.equal(professional(),3);`);
elements['#student'].value='DemoL';
check(`assert.equal(assignment('individual'),5);assert.equal(assignment(0),4);assert.equal(assignment(1),2);assert(!roleDeferred(0));assert(!roleDeferred(1));assert.equal(teaching(),null);tab='teaching';render();assert($('#content').innerHTML.includes('Awaiting alternate opportunity'));assert(!$('#content').innerHTML.includes('data-score='));`);
elements['#student'].value='DemoE';
check(`assert(roleDeferred(1));assert(!roleDeferred(0));tab='roles';render();assert($('#content').innerHTML.includes('Awaiting alternate opportunity'));`);
elements['#course'].value='EXS217';sync();
function sync(){check('syncStudents()')}
elements['#student'].value='DemoE';
check(`assert.equal(schedule().teams.flat().length,12);assert.equal(schedule().sessions.filter(s=>s.deferred).length,0);assert.equal(state.values[key('shared',0)],undefined);assert.equal(studentParticipation().length,3);assert.equal(schedule().sessions[0].equipment,'Battle ropes / bike');tab='schedule';render();assert($('#content').innerHTML.includes('Thursday, October 22, 2026'));tab='checkin';render();assert($('#content').innerHTML.includes('Thursday, October 29, 2026'));`);
check(`for(const c of ['EXS215','EXS217']){for(const [i,t] of courseSchedules[c].teams.entries()){for(const role of ['teach','desk','support'])assert.equal(courseSchedules[c].sessions.filter(s=>s[role]===i).length,1);}}`);
console.log('Passed: schedule assignments, course/team separation, deferred scoring, active earlier DemoL/DemoM roles, participation, scoring, check-in consent and duplicate/cancellation controls.');

elements['#course'].value='EXS215';elements['#student'].value='DemoA';
context.form=values=>({get:k=>values[k]??null,has:k=>Object.hasOwn(values,k)});
check(`assert.equal(submitParticipant(form({})).length>0,true);assert.equal(state.feedback.length,0);assert.equal(submitParticipant(form({p0q0:'5',p0q1:'',p1q0:'3',p0well:'Useful cue',teamq0:'4',teamcomment:'Good flow',permission:'on'})),'');assert.equal(state.feedback.length,2);assert.equal(state.teamFeedback.length,1);assert.deepEqual(participantResponses()[0].ratings,[5,null,null,null,null,null]);assert.equal(instructors().length,2);assert.equal(assignedObservers().join(','),'DemoG,DemoH');assert.equal(state.feedback[0].session,'EXS215:workout-1');state.feedback[0].include.well=true;state.feedback[0].edited.well='Clear <cue>';state.teamFeedback[0].include.DemoA=true;assert(feedbackReport().includes('Clear &lt;cue&gt;'));assert(feedbackReport().includes('Team answered-item mean'));assert(!feedbackReport().includes('Useful cue'));assert.equal(numericRating(6),null);assert.equal(numericRating(''),null);assert.equal(numericRating(null),null);`);
check(`const answers={observer:'DemoG'};instructors().forEach((_,j)=>observerPrompts.forEach((_,i)=>answers['p'+j+'o'+i]='Example '+i));assert.equal(submitObserver(form(answers)),'');assert.equal(observerResponses().length,1);assert.equal(state.observers.length,2);assert.equal(submitObserver(form(answers)),'');assert.equal(state.observers.length,2);assert(submitObserver(form({...answers,observer:'DemoH',p0o0:''})));state.observers[0].include=true;tab='report';render();assert($('#content').innerHTML.includes('Assessment summary'));assert($('#content').innerHTML.includes('1 of 2 assigned observers'));assert($('#content').innerHTML.includes('Preview version 1'));`);
elements['#student'].value='DemoB';
check(`assert.equal(participantResponses()[0].ratings[0],3);assert(!feedbackReport().includes('Clear &lt;cue&gt;'));assert(!feedbackReport().includes('<strong>Team feedback:</strong>'));`);
elements['#student'].value='DemoC';
check(`assert.equal(supportNames().length,3);assert.equal(assignedObservers().length,3);assert(observerView().includes('id="observer-form"'));state.observerAssignments[sessionKey(teachingIndex())]=['DemoI','DemoK'];assert.equal(assignedObservers().length,3);assert(observerView().includes('id="observer-form"'));assert(!observerView().includes('data-observer-assignment'));`);
elements['#student'].value='DemoI';
check(`assert.equal(instructors().length,3);assert(participantView().includes('name="p2q5"'));`);
console.log('Passed: one evaluation covers all instructors, N/A handling, team context separation, report comment consent/redaction, observer assignment and resubmission, report compilation.');

elements['#course'].value='EXS215';elements['#student'].value='DemoA';
check(`assert(addCheckin(1,'name@example.com',true,''));assert.equal(addCheckin(1,'name@example.com',false,'Sample Guest'),'');assert.equal(state.checkins.at(-1).name,'Sample Guest');assert.equal(state.checkins.at(-1).consent,false);assert.equal(state.checkins.at(-1).test,true);checkinSelection.EXS215=1;assert(checkinView().includes('value="1" selected'));assert(checkinView().includes('name="name"'));setSessionStatus(1,'Completed');assert(!checkinOptions().some(o=>o.i===1));assert(!checkinView().includes('value="1"'));`);
console.log('Passed: check-in names, consent, test marking, retained team selection and exclusion of closed workouts.');

elements['#course'].value='EXS215';elements['#student'].value='DemoA';
check(`const inbox=participantInboxView();assert(inbox.includes('evaluation'));assert(inbox.includes('Good flow'));assert(inbox.includes('Earlier individual feedback'));assert(inbox.includes('data-review-course="EXS215"'));assert(checkinRoster(1).includes('Sample Guest'));assert(!participantInboxView().includes('name@example.com'));`);
console.log('Passed: feedback inbox shows received comments and earlier individual responses; check-in roster shows participant names separately.');

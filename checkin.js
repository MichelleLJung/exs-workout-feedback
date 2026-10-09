const $=s=>document.querySelector(s),course=()=>$('#course').value;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state;
function refresh(){state=JSON.parse(localStorage.getItem('exs-schedule-v2'))||{schema:'schedule-v2',values:{},notes:{},comments:{},priorities:{},participation:{},feedback:[],teamFeedback:[],observers:[],observerAssignments:{},versions:{},snapshots:[],sessions:{},checkins:[],queue:[]};state.sessions ||= {};state.checkins ||= [];state.queue ||= []}
function render(){try{refresh();$('#content').innerHTML=checkinView()}catch{$('#content').innerHTML='<p role="alert">Check-in records could not be opened. Please ask the front desk for help.</p>'}}
document.addEventListener('change',e=>{if(e.target.id==='checkin-session'){checkinSelection[course()]=Number(e.target.value);render()}if(e.target.id==='course')render()});
document.addEventListener('submit',e=>{if(e.target.id!=='checkin-form')return;e.preventDefault();const d=new FormData(e.target);try{refresh();const error=addCheckin(Number(d.get('session')),d.get('email'),d.has('consent'),d.get('name'));if(error){$('#checkin-error').textContent=error;return}localStorage.setItem('exs-schedule-v2',JSON.stringify(state));render();$('#checkin-confirmation').textContent='You’re checked in. Enjoy your workout!';$('#checkin-name')?.focus()}catch{$('#checkin-error').textContent='Check-in could not be saved. Please ask the front desk to try again.'}});
window.addEventListener('storage',e=>{if(e.key==='exs-schedule-v2'){try{refresh();const selected=checkinSelection[course()];if(!checkinOptions().some(o=>o.i===selected))render()}catch{render()}}});
render();

for(const id of ['roster-setup','live-setup'])document.querySelector('#'+id).addEventListener('submit',async e=>{
 e.preventDefault();const output=document.querySelector('#launch-status'),button=e.target.querySelector('button');
 if(cloudTimer||cloudSaving||cloudDirty||cloudBlocked){output.textContent='Save or export current work before preparing live records.';return}
 button.disabled=true;try{
 const data=new FormData(e.target),body=id==='roster-setup'?{action:'roster',schedules:JSON.parse(await data.get('roster').text())}:{action:'start-live',confirmation:data.get('confirmation')};
 const response=await fetch('/.netlify/functions/launch-setup',{method:'POST',headers:{'Content-Type':'application/json',...recordHeaders()},body:JSON.stringify(body)}),result=await response.json();
 output.textContent=result.message||result.error;if(response.ok&&id==='live-setup'){cloudActive=false;cloudGeneration=null;cloudStatus('Loading fresh live records…');e.target.reset();await loadOnline();}
 }catch{output.textContent='Setup could not be completed. Existing records remain intact.'}finally{button.disabled=false}
});

document.querySelector('#archive-export').addEventListener('click',async()=>{const output=document.querySelector('#launch-status');try{const response=await fetch('/.netlify/functions/launch-setup?action=backup',{cache:'no-store',headers:recordHeaders()}),result=await response.json();if(!response.ok)throw Error(result.error);const url=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='workout-complete-test-backup.json';a.click();URL.revokeObjectURL(url);output.textContent='Complete test backup downloaded, including shared check-ins and evaluations.';}catch{output.textContent='Backup could not be downloaded. No data was changed.'}});

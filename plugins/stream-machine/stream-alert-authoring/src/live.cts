(function(){
'use strict';
const config=JSON.parse(document.getElementById('config').textContent);
const card=document.getElementById('card'),stage=document.getElementById('stage');
const name=document.getElementById('name');
const composition=AlertComposition.createComposition(card,config,matchMedia('(prefers-reduced-motion: reduce)').matches);
window.AlertTimeline=composition;
// Fit every label inside its allocated row without truncating untrusted copy.
const ready=document.fonts.ready.then(()=>{
for(const [id,max]of [['brand',12],['event',12],['headline',32],['footer',12]]){
 const node=document.getElementById(id);node.style.fontSize=max+'px';
 for(let size=max;size>6 && (node.scrollHeight>node.clientHeight || node.scrollWidth>node.clientWidth);size--)node.style.fontSize=(size-1)+'px';
}
});
function fit(){const scale=Math.min(1,innerWidth/config.width,innerHeight/config.height);stage.style.transform=`scale(${scale})`;}
fit();addEventListener('resize',fit);
function setName(value){
 name.textContent=value;name.style.fontSize='48px';
 for(let size=48;size>8 && (name.scrollHeight>name.clientHeight || name.scrollWidth>name.clientWidth);size--)name.style.fontSize=(size-1)+'px';
}
window.StreamAlert=AlertAdapter.createAdapter({start(payload,done){setName(payload.displayName);composition.start(done);},stop(){composition.pause();},idle(){composition.idle();}},ready);
if(new URLSearchParams(location.search).get('preview')==='1'){
 document.getElementById('preview').hidden=false;
 const result=document.getElementById('result');
 document.getElementById('replay').onclick=()=>result.textContent=StreamAlert.replay().status;
 document.getElementById('cancel').onclick=()=>result.textContent=StreamAlert.cancel().status;
 ready.then(()=>{result.textContent=StreamAlert.play({type:'follow',displayName:config.sampleFollower,id:'synthetic-001'}).status;});
}
})();

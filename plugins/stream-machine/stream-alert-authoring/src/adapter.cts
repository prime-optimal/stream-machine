(function(root){
'use strict';
function validate(p){
 if(!p || typeof p!=='object' || p.type!=='follow' || typeof p.displayName!=='string' || !p.displayName.trim() || [...p.displayName].length>64) return null;
 if(p.id!==undefined && (typeof p.id!=='string' || p.id.length>128)) return null;
 return Object.freeze({type:'follow',displayName:p.displayName,...(p.id!==undefined?{id:p.id}:{})});
}
function createAdapter(driver,ready=Promise.resolve()){
 let queue=[],current=null,last=null,enabled=false,epoch=0; const ids=new Set();
 function next(){
  if(!enabled || current || !queue.length)return;
  current=queue.shift();last=current;const token=++epoch;
  driver.start(current,()=>{if(token!==epoch)return;driver.idle();current=null;next();});
 }
 function submit(p,replay=false){
  const value=validate(p);if(!value)return {status:'invalid'};
  if(!replay && value.id!==undefined && ids.has(value.id))return {status:'duplicate'};
  if(queue.length>=20)return {status:'queue-full'};
  if(!replay && value.id!==undefined){ids.add(value.id);if(ids.size>100)ids.delete(ids.values().next().value);}
  queue.push(value);next();return {status:'accepted'};
 }
 const api={play:p=>submit(p),replay:()=>last?submit(last,true):{status:'invalid'},cancel(){++epoch;queue=[];current=null;driver.stop();driver.idle();return {status:'cancelled'};},getState(){return {state:!enabled?'loading':current?'playing':'idle',queued:queue.length,current:current?{...current}:null,last:last?{...last}:null,rememberedIds:ids.size,capacity:20};}};
 ready.then(()=>{enabled=true;next();});return Object.freeze(api);
}
root.AlertAdapter={validate,createAdapter};
if(typeof module!=='undefined')module.exports=root.AlertAdapter;
})(typeof window!=='undefined'?window:globalThis);

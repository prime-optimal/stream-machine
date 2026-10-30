(function(root){
'use strict';
// A deterministic paused timeline. Seeking never dispatches events.
function createComposition(card, config, reduced=false, clock=root){
 let time=0, frame=null, finish=null, origin=0;
 function seek(seconds){
  time=Math.max(0,Math.min(config.duration,seconds));
  const visible=time>0 && time<config.duration;
  const edge=Math.min(time/.45,(config.duration-time)/.45,1);
  card.style.opacity=visible?String(reduced?1:Math.max(0,edge)): '0';
  card.style.visibility=visible?'visible':'hidden';
  card.style.transform=reduced?'none':`translateY(${(1-Math.max(0,edge))*18}px)`;
  return time;
 }
 function pause(){if(frame!==null)clock.cancelAnimationFrame(frame);frame=null;}
 function tick(now){seek((now-origin)/1000);if(time>=config.duration){frame=null;const done=finish;finish=null;if(done)done();}else frame=clock.requestAnimationFrame(tick);}
 const api={seek,pause,getTime:()=>time,duration:config.duration,
  start(done){pause();finish=done;origin=clock.performance.now();seek(0);frame=clock.requestAnimationFrame(tick);},
  idle(){pause();finish=null;seek(0);}};
 api.idle();return api;
}
root.AlertComposition={createComposition};
if(typeof module!=='undefined')module.exports=root.AlertComposition;
})(typeof window!=='undefined'?window:globalThis);

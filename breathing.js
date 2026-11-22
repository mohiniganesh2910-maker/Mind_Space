'use strict';
(() => {
 let duration=180000,elapsed=0,anchor=0,state='idle',frame=null,recorded=false;
 const $=id=>document.getElementById(id),circle=$('breathCircle');
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 function render(){const ms=Math.max(0,duration-elapsed),seconds=Math.ceil(ms/1000);$('timer').textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;$('rounds').textContent='Completed rounds: '+Math.floor(elapsed/14000);
 $('start').disabled=state==='running';$('start').textContent=state==='paused'?'Resume':state==='completed'?'Start again':'Start';$('pause').disabled=state!=='running';
 if(state==='idle'){circle.style.transform='scale(1)';$('breathText').textContent='Ready?';$('phaseTime').textContent='Press Start';return;}
 if(state==='completed'){circle.style.transform='scale(1)';$('breathText').textContent='Well done!';$('phaseTime').textContent='Session completed';return;}
 const t=elapsed%14000;let title,left,scale;if(t<4000){title='Breathe In';left=4000-t;scale=.88+.22*(t/4000);}else if(t<8000){title='Hold';left=8000-t;scale=1.1;}else{title='Breathe Out';left=14000-t;scale=1.1-.22*((t-8000)/6000);}
 $('breathText').textContent=title;$('phaseTime').textContent=`${Math.ceil(left/1000)} seconds${state==='paused'?' · paused':''}`;circle.style.transform=`scale(${document.documentElement.dataset.motion==='reduce'?1:scale})`;}
 function complete(){state='completed';frame=null;if(!recorded){recorded=true;const ok=MS.change(d=>d.sessions.push({id:MS.id(),createdAt:new Date().toISOString(),minutes:duration/60000,rounds:Math.floor(elapsed/14000)}));$('roundText').textContent=ok?'You took a moment for yourself. Session saved.':'Session complete. History could not be saved.';}render();}
 function tick(){if(state!=='running')return;elapsed=Math.min(duration,performance.now()-anchor);if(elapsed>=duration){complete();return;}render();frame=requestAnimationFrame(tick);}
 function pause(message='Paused — take your time.'){if(state!=='running')return;elapsed=Math.min(duration,performance.now()-anchor);cancelAnimationFrame(frame);frame=null;if(elapsed>=duration){complete();return;}state='paused';$('roundText').textContent=message;render();}
 function reset(){cancelAnimationFrame(frame);frame=null;elapsed=0;state='idle';recorded=false;$('roundText').textContent='Follow your breathing rhythm';render();}
 $('start').addEventListener('click',()=>{if(state==='running')return;if(state==='completed')reset();state='running';anchor=performance.now()-elapsed;$('roundText').textContent='Follow your breathing rhythm';tick();});$('pause').addEventListener('click',()=>pause());$('reset').addEventListener('click',reset);
 document.querySelectorAll('[data-minutes]').forEach(b=>b.addEventListener('click',()=>{duration=Number(b.dataset.minutes)*60000;document.querySelectorAll('[data-minutes]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));reset();}));
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause('Paused while you were away. Choose Resume when ready.');});window.addEventListener('pagehide',()=>pause());motion.addEventListener('change',render);render();
})();

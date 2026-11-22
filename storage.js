/* Versioned, validated local data. Failed reads never overwrite stored bytes. */
window.MS = (() => {
 'use strict';
 const KEY='mindspace:v2:data',OLD='mindspace:v1:data';
 const moods=['happy','good','okay','stressed','sad'];
 const tags=['Study','Friends','Family','Rest','Personal'];
 const groups=['checkins','sessions','activities','journal','gratitude','focus','grounding','plans'];
 const prefs=()=>({theme:'system',motion:'system',sound:false,drafts:false});
 const empty=()=>({version:2,migrated:true,checkins:[],sessions:[],activities:[],journal:[],gratitude:[],focus:[],grounding:[],plans:[],preferences:prefs(),drafts:{}});
 const id=()=>globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;
 const now=()=>new Date().toISOString();
 const localDay=(value=new Date())=>{const d=new Date(value);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
 const warning=message=>{const e=document.getElementById('storage-warning');if(e){e.hidden=false;e.textContent=message;}};
 const str=(x,max=10000)=>typeof x==='string'&&x.length<=max;
 const stamp=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(x)&&Number.isFinite(Date.parse(x));
 const day=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x))&&new Date(x+'T12:00:00Z').toISOString().slice(0,10)===x;
 const num=(x,min,max)=>Number.isFinite(x)&&x>=min&&x<=max;
 const tagList=x=>Array.isArray(x)&&x.length<=tags.length&&new Set(x).size===x.length&&x.every(t=>tags.includes(t));
 function checkRecord(k,e){
  if(!e||!str(e.id,200)||!e.id||!(stamp(e.createdAt)||(e.createdAt===null&&['journal','gratitude'].includes(k)))||('updatedAt'in e&&!stamp(e.updatedAt))||('importedAt'in e&&!stamp(e.importedAt)))return false;
  if(k==='checkins')return moods.includes(e.mood);
  if(k==='sessions')return [1,3,5].includes(e.minutes)&&Number.isInteger(e.rounds)&&num(e.rounds,0,30);
  if(k==='activities')return str(e.title,500)&&e.title.trim()&&str(e.category,50)&&num(e.minutes,1,180);
  if(k==='journal'||k==='gratitude')return str(e.text)&&e.text.trim()&&(k!=='journal'||[...moods,'unknown'].includes(e.mood))&&(!('tags'in e)||tagList(e.tags))&&(!('favourite'in e)||typeof e.favourite==='boolean');
  if(k==='focus')return num(e.minutes,1,120)&&Number.isInteger(e.minutes)&&e.status==='completed';
  if(k==='grounding')return typeof e.alternative==='boolean'&&Array.isArray(e.skipped)&&e.skipped.every(x=>Number.isInteger(x)&&num(x,0,4))&&(!('responses'in e)||(Array.isArray(e.responses)&&e.responses.length===5&&e.responses.every(x=>str(x,2000))));
  if(k==='plans')return day(e.day)&&str(e.text,120)&&e.text.trim()&&typeof e.completed==='boolean';
  return false;
 }
 function validate(d){
  if(!d||![1,2].includes(d.version)||typeof d.migrated!=='boolean')throw Error('Unsupported backup schema.');
  const list=d.version===1?groups.slice(0,5):groups;
  for(const k of list){if(!Array.isArray(d[k])||d[k].length>20000)throw Error('Invalid '+k+' records.');const seen=new Set;for(const e of d[k]){if(!checkRecord(k,e)||seen.has(e.id))throw Error('Invalid or duplicate '+k+' record.');seen.add(e.id);}}
  if(d.version===2){const p=d.preferences;if(!p||!['light','dark','system'].includes(p.theme)||!['system','reduce','full'].includes(p.motion)||typeof p.sound!=='boolean'||typeof p.drafts!=='boolean')throw Error('Invalid preferences.');if(!d.drafts||typeof d.drafts!=='object'||Array.isArray(d.drafts))throw Error('Invalid drafts.');for(const [kind,v] of Object.entries(d.drafts)){if(!['journal','gratitude'].includes(kind)||!v||!str(v.text)||!stamp(v.updatedAt)||!tagList(v.tags)||!str(v.mood,30)||!['',...moods,'unknown'].includes(v.mood)||!(v.editing===null||str(v.editing,200)))throw Error('Invalid draft.');}const count={};for(const e of d.plans){count[e.day]=(count[e.day]||0)+1;if(count[e.day]>3)throw Error('More than three plan actions on one day.');}}
  return d;
 }
 function upgrade(input){const d=JSON.parse(JSON.stringify(validate(input)));if(d.version===1){return {...empty(),...d,version:2,migrated:true,focus:[],grounding:[],plans:[],preferences:prefs(),drafts:{}};}return d;}
 function read(){try{const raw=localStorage.getItem(KEY);if(raw!==null)return upgrade(JSON.parse(raw));const old=localStorage.getItem(OLD);if(old!==null)return upgrade(JSON.parse(old));return empty();}catch{warning('Saved data could not be read. It has not been overwritten. Export a backup from the footer before clearing it.');return null;}}
 function write(d){try{validate(d);localStorage.setItem(KEY,JSON.stringify(d));return true;}catch(e){warning('Could not save: '+e.message+' Your current changes have not been saved.');return false;}}
 function change(fn){const d=read();if(!d)return false;try{fn(d);return write(d);}catch(e){warning(e.message);return false;}}
 function migrate(){try{if(localStorage.getItem(KEY)!==null){read();return;}const d=read();if(!d)return;const old=localStorage.getItem(OLD);if(old===null||JSON.parse(old).migrated===false){for(const [kind,key] of [['journal','journal'],['gratitude','gratitude']]){const t=localStorage.getItem(key);if(t?.trim()&&!d[kind].some(e=>e.id==='legacy-'+kind))d[kind].push({id:'legacy-'+kind,text:t.trim(),createdAt:null,importedAt:now(),...(kind==='journal'?{mood:moods.find(m=>(localStorage.getItem('mood')||'').toLowerCase().includes(m))||'unknown'}:{})});}}d.migrated=true;write(d);}catch{warning('Migration could not finish. Existing data has been preserved.');}}
 function parseBackup(text){if(new TextEncoder().encode(text).length>5*1024*1024)throw Error('Choose a backup smaller than 5 MB.');let p;try{p=JSON.parse(text);}catch{throw Error('This is not valid JSON.');}return upgrade(p.data??p);}
 function merge(current,incoming){const result=upgrade(current),source=upgrade(incoming);for(const k of groups){const map=new Map(result[k].map(e=>[e.id,e]));for(const e of source[k]){const old=map.get(e.id);const time=x=>Date.parse(x.updatedAt||x.createdAt||x.importedAt)||0;if(!old||time(e)>time(old))map.set(e.id,e);}result[k]=[...map.values()];}validate(result);return result;}
 function importData(incoming,mode){const clean=upgrade(incoming);const current=read();if(mode==='merge'&&!current)throw Error('Existing data cannot be read. Export the raw backup, then choose Replace.');const result=mode==='replace'?clean:merge(current,clean);/* Restoring a backup never opts a device into remembering drafts. */result.preferences.drafts=current?.preferences.drafts||false;if(!result.preferences.drafts)result.drafts={};if(!write(result))return false;return true;}
 function backup(){return {format:'mindspace-backup',exportedAt:now(),data:read(),rawBackup:localStorage.getItem(KEY),previousVersionBackup:localStorage.getItem(OLD),legacy:{mood:localStorage.getItem('mood'),journal:localStorage.getItem('journal'),gratitude:localStorage.getItem('gratitude')}};}
 function clear(){try{const fresh=empty();if(!write(fresh))return false;[OLD,'mood','journal','gratitude'].forEach(k=>localStorage.removeItem(k));return true;}catch{warning('Some old data could not be cleared.');return false;}}
 const sorted=a=>[...a].sort((a,b)=>(Date.parse(b.createdAt)||0)-(Date.parse(a.createdAt)||0));
 const date=e=>e.createdAt?new Date(e.createdAt).toLocaleString([],{dateStyle:'medium',timeStyle:'short'}):'Imported entry · original date unknown';
 const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 function planAdd(text,when=localDay()){text=text.trim();return change(d=>{if(!text||text.length>120)throw Error('Write an action of 1–120 characters.');if(d.plans.filter(e=>e.day===when).length>=3)throw Error('You already have three actions for that day.');d.plans.push({id:id(),createdAt:now(),text,day:when,completed:false});});}
 function reschedule(recordId,when){return change(d=>{if(!day(when))throw Error('Choose a valid date.');const e=d.plans.find(x=>x.id===recordId);if(!e||e.completed)throw Error('Only unfinished actions can be rescheduled.');if(e.day===when)return;if(d.plans.filter(x=>x.day===when).length>=3)throw Error('That day already has three actions.');/* Copy the unfinished action, retaining its original day’s history. */d.plans.push({id:id(),createdAt:now(),text:e.text,day:when,completed:false});});}
 return {KEY,OLD,moods,tags,groups,id,now,localDay,empty,read,write,change,migrate,validate,upgrade,parseBackup,merge,importData,backup,clear,sorted,date,node,warning,planAdd,reschedule};
})();
MS.migrate();

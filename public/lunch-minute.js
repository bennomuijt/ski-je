/* SKI-je: continuous, minute-accurate lunch start and duration controls. */
(()=>{
 'use strict';
 const time=document.getElementById('lunch-time'),slider=document.getElementById('lunch-time-slider');
 const display=document.getElementById('lunch-time-display'),duration=document.getElementById('lunch-duration');
 if(!time||!slider||!display)return;
 const toMinutes=s=>/^\d{2}:\d{2}$/.test(String(s||''))?Number(s.slice(0,2))*60+Number(s.slice(3)):null;
 const fromMinutes=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
 function sync(source,notify=false){
  let minute=source==='time'?toMinutes(time.value):Number(slider.value);
  if(!Number.isInteger(minute))minute=750;
  minute=Math.min(795,Math.max(705,minute));
  slider.value=String(minute);time.value=fromMinutes(minute);display.textContent=time.value;
  if(notify)time.dispatchEvent(new Event('change',{bubbles:true}));
 }
 slider.addEventListener('input',()=>sync('slider',true));
 slider.addEventListener('change',()=>sync('slider',true));
 time.addEventListener('input',()=>sync('time',false));
 time.addEventListener('change',()=>sync('time',false));
 duration?.setAttribute('step','1');
 sync('time');
 window.SKILunchMinute={get:()=>time.value};
})();
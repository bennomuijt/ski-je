/* SKI-je responsive mobile viewport and navigation clearances.
 * Insets are provided by CSS env() and never inferred from device model or UA.
 * Only the user's optional manual fallback persists on this device. */
(()=>{
 'use strict';
 const root=document.documentElement, footer=document.querySelector('.bottom');
 const setting=document.getElementById('screen-bottom-clearance');
 const feedback=document.getElementById('screen-bottom-clearance-value');
 const KEY='skije-screen-bottom-clearance-v1';
 const clamp=v=>Math.min(96,Math.max(0,Math.round((Number(v)||0)/8)*8));
 let extra=0;
 try{extra=clamp(localStorage.getItem(KEY));}catch{}
 function setExtra(value,save=false){
  extra=clamp(value);
  root.style.setProperty('--skije-user-bottom-extra',extra+'px');
  if(setting)setting.value=String(extra);
  if(feedback)feedback.textContent=extra===0?'Automatisch':extra+' px extra ruimte';
  if(save)try{localStorage.setItem(KEY,String(extra));}catch{}
 }
 function measure(){
  if(!footer)return;
  // Real footer height includes safe-area and user-requested system navigation
  // clearance; a fixed number would clip the last interactive element.
  const height=Math.ceil(footer.getBoundingClientRect().height);
  if(Number.isFinite(height)&&height>0&&height<500)
   root.style.setProperty('--skije-nav-measured-height',height+'px');
 }
 let scheduled=false;
 function schedule(){
  if(scheduled)return;scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;measure();});
 }
 function focusedTextElement(el){
  if(!el||typeof el.matches!=='function')return false;
  return el.matches('textarea,input:not([type]),input[type="text"],input[type="search"],input[type="email"],input[type="tel"],input[type="number"],input[type="password"],input[type="url"],input[type="date"],input[type="time"]');
 }
 function updateTyping(){
  const focused=focusedTextElement(document.activeElement);
  const viewport=window.visualViewport;
  const keyboardLikely=!!viewport&&viewport.height<window.innerHeight-140;
  document.body.classList.toggle('skije-typing',focused&&keyboardLikely);
  schedule();
 }
 setting?.addEventListener('input',()=>{setExtra(setting.value,true);schedule();});
 window.addEventListener('resize',schedule,{passive:true});
 window.addEventListener('orientationchange',schedule,{passive:true});
 window.visualViewport?.addEventListener('resize',()=>{updateTyping();schedule();},{passive:true});
 window.visualViewport?.addEventListener('scroll',schedule,{passive:true});
 document.addEventListener('focusin',()=>requestAnimationFrame(updateTyping));
 document.addEventListener('focusout',()=>requestAnimationFrame(updateTyping));
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
 if(typeof ResizeObserver!=='undefined'&&footer)new ResizeObserver(schedule).observe(footer);
 setExtra(extra);schedule();
 window.SKIScreenLayout={recalculate:measure,getExtra:()=>extra};
})();
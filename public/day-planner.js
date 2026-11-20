/* SKI-je day planner: conservative complete-day schedule, no invented ski connections. */
(function(root,factory){const planner=factory();if(typeof module==='object'&&module.exports)module.exports=planner;if(root)root.SKI_DayPlanner=planner;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const compute=function compute(input={}) {
 const clock=x=>/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(String(x||''))?Number(x.slice(0,2))*60+Number(x.slice(3)):null;
 const hh=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
 const margin=input.useSafety===false?0:Math.max(0,Math.min(120,Number.isFinite(Number(input.safetyMarginMin))?Number(input.safetyMarginMin):30));
 const start=clock(input.departure||'09:00'),end=clock(input.returnTime||'16:00'),safe=end===null?null:end-margin;
 const day=String(input.date||'').slice(0,10);
 const name=x=>String(x||'').trim().slice(0,90);
 const result={ok:false,reason:'',date:day,startPoint:name(input.start),endPoint:name(input.finish),departure:input.departure||'09:00',returnTime:input.returnTime||'16:00',safeArrival:safe===null?'--:--':hh(safe),margin,useLunch:input.useLunch!==false,lunchRestaurant:name(input.lunchRestaurantLabel||input.lunchRestaurant),lunchMinutes:0,sections:[],wishes:Array.isArray(input.wishes)?input.wishes.map(name).filter(Boolean).slice(0,12):[],morningBreak:!!input.morningBreak,afternoonBreak:!!input.afternoonBreak,notes:[],verifiedRoute:null};
 if(start===null||end===null||end<=start+90) {result.reason='Kies een geldige vertrek- en eindtijd met minimaal 90 minuten ertussen.';return result;}
 if(!result.startPoint||!result.endPoint){result.reason='Kies zowel een startpunt als een eindpunt.';return result;}
 const lunch=result.useLunch?clock(input.lunchTime||'12:30'):null;
 const lunchDuration=result.useLunch?Number(input.lunchDuration??60):0;
 if(result.useLunch&&(lunch===null||lunch<705||lunch>795||!Number.isInteger(lunchDuration)||lunchDuration<30||lunchDuration>120)){result.reason='Lunch start tussen 11:45 en 13:15 en duurt 30 tot 120 minuten.';return result;}
 if(result.useLunch&&(lunch<start+15||lunch+lunchDuration>safe-15)){result.reason='De gekozen lunch past niet tussen het vertrek en de veilige terugkeertijd. Pas tijden of lunch aan.';return result;}
 result.lunchMinutes=lunchDuration;
 const earliestReturn=result.useLunch?lunch+lunchDuration:start;
 if(safe-earliestReturn<25){result.reason='Er blijft te weinig tijd over om de terugweg veilig te plannen.';return result;}
 let endSki=safe;
 const estimatedReturn=Number(input.returnEstimate);
 const earlyBreak=result.morningBreak?Math.max(5,Math.min(120,Number(input.morningDuration)||30)):0;
 const lateBreak=result.afternoonBreak?Math.max(5,Math.min(120,Number(input.afternoonDuration)||30)):0;
 const baseReserve=Math.min(75,Math.max(35,Math.floor((safe-start-lunchDuration-earlyBreak-lateBreak)*.20)));
 // Never pretend the return trip fits into 35–75 min when known area connections need longer.
 const reserve=Number.isFinite(estimatedReturn)&&estimatedReturn>0?Math.max(baseReserve,Math.ceil(estimatedReturn)+15):baseReserve;
 if(endSki-reserve<start+30){result.reason='Te weinig tijd voor een bruikbare skidag met veiligheidsmarge.';return result;}
 const push=(begin,finish,type,label,detail)=>{
  if(finish<=begin)return;
  result.sections.push({start:hh(begin),end:hh(finish),startMinute:begin,endMinute:finish,minutes:finish-begin,type,label,detail:detail||''});
 };
 // Reserve time for the return; this is not an asserted travel-time calculation.
 const finalLegStart=safe-reserve;
 if(result.useLunch&&finalLegStart<lunch+lunchDuration+10){result.reason='De lunch en terugweg passen niet samen. Vertrek eerder, lunch korter of kies een dichterbij gelegen route.';return result;}
 let cursor=start;
 let chunks=[];
 if(result.useLunch)chunks=[{at:lunch,duration:lunchDuration,type:'lunch',label:result.lunchRestaurant&&result.lunchRestaurant!=='Geen voorkeur, laat SKI-je kiezen'?'Lunch bij '+result.lunchRestaurant:'Lunchpauze',detail:'Restaurant en bereikbaarheid ter plaatse controleren.'}];
 let before=chunks.length?chunks[0].at:finalLegStart;
 let after=chunks.length?chunks[0].at+chunks[0].duration:start;
 // Prioritise feasibility: skip a requested break only with explicit explanation.
 if(result.morningBreak){
  const breakLen=earlyBreak;
  if(before-start>=breakLen+30){
   const at=Math.max(start+30,Math.floor((start+before-breakLen)/2));
   push(start,at,'ski','Vrij skiën en routewensen','Kies uitsluitend open, geschikte pistes; route niet geografisch bevestigd.');
   push(at,at+breakLen,'break','Ochtendpauze','Zelf geschikte stopplek kiezen.');
   cursor=at+breakLen;
  } else result.notes.push('Ochtendpauze kon niet worden ingepland vóór de lunch; pas je vertrektijd aan.');
 }
 if(result.useLunch){
  push(cursor,lunch,'ski','Skiën vóór de lunch','Routewensen volgens je eigen keuzes; aansluitingen niet bevestigd.');
  push(lunch,lunch+lunchDuration,'lunch',chunks[0].label,chunks[0].detail);
  cursor=lunch+lunchDuration;
 }
 if(result.afternoonBreak){
  const breakLen=lateBreak;
  if(finalLegStart-cursor>=breakLen+30){
   const at=Math.max(cursor+20,Math.floor((cursor+finalLegStart-breakLen)/2));
   push(cursor,at,'ski','Skiën na de lunch','Controleer liften en reistijd ter plaatse.');
   push(at,at+breakLen,'break','Middagpauze',breakLen+' minuten ingepland.');
   cursor=at+breakLen;
  } else result.notes.push('Middagpauze kon niet worden ingepland; wijzig de tijden of duur van de lunch.');
 }
 push(cursor,finalLegStart,'ski',result.useLunch?'Skiën na de lunch':'Skiën','Gebruik je geselecteerde pistes en plekken alleen als ze werkelijk bereikbaar zijn.');
 push(finalLegStart,safe,'return','Terugweg reserveren','Tijd gereserveerd, geen bevestigde reistijd. Controleer lift- en pisteverbindingen.');
 if(margin>0)push(safe,end,'buffer','Veiligheidsmarge / uiterlijk terug','Streef aanwezig bij het gekozen eindpunt om '+hh(safe)+' ('+margin+' minuten voor de eindtijd).');
 else result.notes.push('⚠ Geen veiligheidsmarge geselecteerd. Houd rekening met wachtrijen en lift-sluitingstijden.');
 if(result.sections.some(x=>x.startMinute<start||x.endMinute>end)){result.reason='Interne planningsfout: een tijd valt buiten de skidag.';result.sections=[];return result;}
 for(let i=1;i<result.sections.length;i++)if(result.sections[i].startMinute!==result.sections[i-1].endMinute){result.reason='Interne planningsfout: tijdsblokken sluiten niet aan.';result.sections=[];return result;}
 if(result.sections[0]?.startMinute!==start||result.sections.at(-1)?.endMinute!==end){result.reason='Interne planningsfout: geen volledige dag.';result.sections=[];return result;}
 result.ok=true;
 result.notes.unshift('Dit is een tijdsindeling, geen geografisch berekende of veilige lift-piste-route. Borden en officiële SkiWelt-informatie zijn leidend.');
 if(result.wishes.length)result.notes.push('Gewenste pistes/plekken zijn wensen, niet automatisch ingeplande of gecontroleerde verbindingen.');
 return result;
};
 return {compute};
});

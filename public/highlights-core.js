/* SKI-je ski-highlights: pure, local-only summary. No GPS polling or network requests. */
(function(root){
 'use strict';
 const numeric=value=>typeof value==='number'&&Number.isFinite(value)?value:null;
 function summarise(days){
  const clean=Array.isArray(days)?days.filter(day=>day&&typeof day==='object'&&Number.isFinite(Number(day.endAt))&&Number(day.endAt)>0&&Number.isFinite(Number(day.startAt))&&Number(day.startAt)>0).slice(0,80):[];
  let totalKm=0,totalMinutes=0,bestKm=0,bestKmDate=null,highestSpeed=0,fastestDate=null,longestMinutes=0,longestDate=null;
  for(const d of clean){
   const km=numeric(d.distanceKm),speed=numeric(d.speedMax),elapsed=numeric(d.elapsedMs);
   const date=typeof d.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d.date)?d.date:new Date(Number(d.startAt)).toISOString().slice(0,10);
   if(km!==null&&km>=0&&km<=350){
    totalKm+=km;
    if(km>bestKm){bestKm=km;bestKmDate=date;}
   }
   if(speed!==null&&speed>=0&&speed<=90&&speed>highestSpeed){highestSpeed=speed;fastestDate=date;}
   if(elapsed!==null&&elapsed>=0&&elapsed<=12*3600000){
    const mins=elapsed/60000;totalMinutes+=mins;
    if(mins>longestMinutes){longestMinutes=mins;longestDate=date;}
   }
  }
  return {days:clean.length,totalKm:Math.round(totalKm*100)/100,bestKm:Math.round(bestKm*100)/100,
    highestSpeed:Math.round(highestSpeed*10)/10,totalMinutes:Math.round(totalMinutes),
    longestMinutes:Math.round(longestMinutes),bestKmDate,fastestDate,longestDate,
    note:'GPS-afstand kan ook liftritten bevatten. Snelheid is een GPS-schatting, geen wedstrijd.'};
 }
 function shareText(s){
  if(!s||!s.days)return 'SKI-je: nog geen opgeslagen skidagen.';
  return ['🎿 Mijn SkiWelt-highlights','⛷️ '+s.days+' geregistreerde skidag'+(s.days===1?'':'en'),
   '📍 '+s.totalKm.toFixed(1)+' km GPS-afstand (inclusief mogelijke liftritten)',
   '🏔️ Beste dag: '+s.bestKm.toFixed(1)+' km GPS',
   '⏱️ '+Math.round(s.totalMinutes/60*10)/10+' uur geregistreerd',
   '📊 Hoogste gemeten snelheid: '+s.highestSpeed.toFixed(1)+' km/u (GPS-schatting)',
   'Ski veilig, geniet van het uitzicht!','Gemaakt met SKI-je'].join('\n');
 }
 root.SKIHighlightsCore={summarise,shareText};
})(globalThis);

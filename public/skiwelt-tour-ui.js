/* Reference routes from SkiWelt's winter 2026/27 tour tables. These are
   not automatic travel directions, and do not replace live lift/piste status. */
(()=>{
'use strict';
const source=window.SKIOfficialTours;
if(!source)return;
const el=(tag,cls,value)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(value!==undefined)node.textContent=value;return node;};
function mount(parent,closures=[]){
 const detail=el('details','official-tour-reference');
 const summary=el('summary','','');
 summary.textContent='🚡 SkiWelt Tour: alle officiële liften én tussenliggende pistes';
 detail.append(summary);
 const explanation=el('p','hint','Referentieroutes voor controle van alle liften, pistes en korte verbindingsliften. Dit is geen automatisch berekende route vanaf jouw gekozen beginstation; pistekleuren, instappunten, openstelling en tijd zijn niet gecontroleerd.');
 detail.append(explanation);
 const toolbar=el('div','official-tour-controls');
 const direction=el('select','');direction.id='reference-tour-direction';direction.setAttribute('aria-label','Richting van officiële SkiWelt Tour');
 for(const [value,label] of [['clockwise','Groene SkiWelt Tour · met de klok mee (69 km volgens SkiWelt)'],['counter','Oranje SkiWelt Tour · tegen de klok in (84 km volgens SkiWelt)']]){
  const opt=document.createElement('option');opt.value=value;opt.textContent=label;direction.append(opt);
 }
 const search=el('input','');search.type='search';search.id='reference-tour-search';search.placeholder='Zoek plaats, lift of piste';search.setAttribute('aria-label','Doorzoek officiële Tour-stappen');
 toolbar.append(direction,search);detail.append(toolbar);
 const count=el('p','tiny');detail.append(count);
 const rows=el('div','official-tour-rows');detail.append(rows);
 const src=el('a','legal-inline-link','Officiële SkiWelt Tour-bron 2026/27 bekijken');
 src.href=source.SOURCE;src.target='_blank';src.rel='noopener noreferrer';
 const other=el('a','legal-inline-link','KitzSkiWelt Tour (andere route, apart ticket/overstap)');
 other.href='https://www.skiwelt.at/nl/kitzskiwelt-tour-1.html';other.target='_blank';other.rel='noopener noreferrer';
 detail.append(src,el('span','tiny',' · '),other);
 function render(){
  const stages=source.tours[direction.value]||[];
  const query=search.value.toLocaleLowerCase('nl-NL').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  rows.replaceChildren();
  const blocked=source.closureFlags(stages,closures);
  let displayed=0;
  for(const stage of stages){
   const numbers=stage.pistes.map(p=>typeof p==='string'?p:p.alternatives.join(' of '));
   const searchable=[stage.area,stage.liftNumber,stage.liftName,...numbers].join(' ').toLocaleLowerCase('nl-NL').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
   if(query&&!searchable.includes(query))continue;
   displayed++;
   const row=el('div','official-tour-stage');
   if(blocked.some(x=>x.id===stage.id))row.classList.add('official-tour-blocked');
   row.append(el('strong','',stage.position+'. 🚡 Lift '+stage.liftNumber+' · '+stage.liftName+' ('+stage.area+')'));
   for(const piste of stage.pistes){
    if(typeof piste==='string')row.append(el('p','official-tour-piste','⛷️ Piste '+piste));
    else row.append(el('p','official-tour-piste','⛷️ Keuze: piste '+piste.alternatives.join(' of ')));
   }
   if(!stage.pistes.length)row.append(el('p','official-tour-missing','⚠️ Geen piste vermeld in deze officiële tabel; aansluiting naar volgende lift nog apart controleren.'));
   if(stage.note)row.append(el('p','official-tour-missing','⚠️ '+stage.note));
   if(blocked.some(x=>x.id===stage.id))row.append(el('p','official-tour-missing','⛔ Zelf gemelde sluiting raakt deze etappe; niet zonder controle volgen.'));
   rows.append(row);
  }
  count.textContent=displayed+' van '+stages.length+' officiële liftrijen getoond. Alle genoemde pistes blijven afzonderlijk vermeld. Een route zonder volledige aansluiting wordt niet als gecontroleerd beschouwd.';
 }
 direction.addEventListener('change',render);search.addEventListener('input',render);
 render();parent.append(detail);
 return detail;
}
window.SKIOfficialTourUI={mount};
})();
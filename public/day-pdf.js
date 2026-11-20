/* SKI-je A4 PDF builder: complete day and provisional SkiWelt corridors.
   Native browser PDF, original logo on every page, no cloud upload. */
(function(root,factory){
 const lib=factory();if(typeof module==='object'&&module.exports)module.exports=lib;
 if(root)root.SKIPdf=lib;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const W=1240,H=1754;
 function join(parts){const bytes=new Uint8Array(parts.reduce((n,x)=>n+x.length,0));let at=0;for(const x of parts){bytes.set(x,at);at+=x.length;}return bytes;}
 function jpegBytes(data){const raw=atob(data.split(',')[1]);const out=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out;}
 function encodePdf(jpegs){
  if(!jpegs?.length)throw Error('Geen PDF-pagina');
  const encoder=new TextEncoder(),ascii=x=>encoder.encode(x),objects=[];
  objects[1]=ascii('<< /Type /Catalog /Pages 2 0 R >>');
  objects[2]=ascii('<< /Type /Pages /Count '+jpegs.length+' /Kids ['+jpegs.map((_,i)=>(3+i*3)+' 0 R').join(' ')+'] >>');
  const stream=(head,bytes)=>join([ascii(head+'\nstream\n'),bytes,ascii('\nendstream')]);
  for(let i=0;i<jpegs.length;i++){
   const p=3+i*3,c=p+1,img=p+2,jpeg=jpegs[i];
   objects[p]=ascii('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 '+img+' 0 R >> >> /Contents '+c+' 0 R >>');
   const draw=ascii('q 595.28 0 0 841.89 0 0 cm /Im0 Do Q\n');
   objects[c]=stream('<< /Length '+draw.length+' >>',draw);
   objects[img]=stream('<< /Type /XObject /Subtype /Image /Width '+W+' /Height '+H+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+jpeg.length+' >>',jpeg);
  }
  const chunks=[],offsets=[0];let length=0;
  const add=x=>{chunks.push(x);length+=x.length;};
  add(ascii('%PDF-1.4\n%SKIje\n'));
  for(let i=1;i<objects.length;i++){offsets[i]=length;add(ascii(i+' 0 obj\n'));add(objects[i]);add(ascii('\nendobj\n'));}
  const xref=length;
  add(ascii('xref\n0 '+objects.length+'\n0000000000 65535 f \n'));
  for(let i=1;i<objects.length;i++)add(ascii(String(offsets[i]).padStart(10,'0')+' 00000 n \n'));
  add(ascii('trailer\n<< /Size '+objects.length+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n'));
  return join(chunks);
 }
 const COL={navy:'#0a3657',blue:'#0875ab',orange:'#f18424',green:'#128467',red:'#b44848',ink:'#183c55',gray:'#5f7889'};
 function label(ctx,txt,x,y,size=25,color=COL.ink,bold=false){
  ctx.font=(bold?'700 ':'400 ')+size+'px system-ui,"Segoe UI",sans-serif';ctx.fillStyle=color;
  ctx.fillText(String(txt||''),x,y);
 }
 function wrap(ctx,str,maxWidth,font=20,limit=3){
  ctx.font='400 '+font+'px system-ui,sans-serif';
  const words=String(str||'').split(/\s+/);const output=[];let current='';
  for(const w of words){
   const next=current?current+' '+w:w;
   if(ctx.measureText(next).width<=maxWidth||!current){current=next;continue;}
   output.push(current);current=w;
   if(output.length===limit-1)break;
  }
  if(current)output.push(current);return output.slice(0,limit);
 }
 function lines(ctx,text,x,y,width,size=20,limit=3,color=COL.ink){
  const content=wrap(ctx,text,width,size,limit);
  content.forEach((v,i)=>label(ctx,v,x,y+i*(size+5),size,color));return content.length;
 }
 async function loadLogo(){
  if(typeof Image==='undefined')return null;
  const image=new Image();image.src='brand-skije.svg';
  try{await image.decode();return image;}catch{return null;}
 }
 function pageStart(ctx,logo,page,total){
  ctx.fillStyle='#f6fbfe';ctx.fillRect(0,0,W,H);
  const gradient=ctx.createLinearGradient(0,0,1240,230);
  gradient.addColorStop(0,'#073454');gradient.addColorStop(1,'#087ab1');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,W,225);
  ctx.fillStyle='white';ctx.fillRect(52,40,195,132);
  if(logo)try{ctx.drawImage(logo,63,49,172,115);}catch{label(ctx,'SKI-je',70,121,44,COL.navy,true);}
  else label(ctx,'SKI-je',70,121,44,COL.navy,true);
  label(ctx,'SKI-JE · MIJN SKIDAG',286,106,43,'white',true);
  label(ctx,'SkiWelt 2026/27  ·  BenMu Development',288,155,23,'#d6f3ff');
  ctx.fillStyle=COL.orange;ctx.fillRect(0,224,W,6);
  ctx.fillStyle=COL.navy;ctx.fillRect(0,H-97,W,97);
  label(ctx,'⚠️ SKI-je is alleen een hulpmiddel. Officiële borden en liftstatus zijn altijd leidend.',52,H-59,19,'white');
  label(ctx,'Pagina '+page+'/'+total+'  ·  Verwachte tijden zijn indicatief. Gecontroleer altijd ter plaatse.',52,H-28,17,'#c3e4f3');
 }
 function box(ctx,x,y,w,h,bg){ctx.fillStyle=bg;ctx.fillRect(x,y,w,h);}
 function schedule(ctx,plan){
  label(ctx,'VOLLEDIGE DAGPLANNING',62,289,35,COL.navy,true);
  lines(ctx,plan.startPoint+'  →  '+plan.endPoint,62,328,1115,25,2,COL.blue);
  box(ctx,58,375,1120,102,'#e7f3fa');
  label(ctx,'VERTREK',81,412,17,COL.gray,true);label(ctx,plan.departure,81,459,31,COL.navy,true);
  label(ctx,'STREEFAANKOMST',426,412,17,COL.gray,true);label(ctx,plan.safeArrival,426,459,31,COL.navy,true);
  label(ctx,'UITERLIJK TERUG',812,412,17,COL.gray,true);label(ctx,plan.returnTime,812,459,31,COL.navy,true);
  box(ctx,58,494,1120,76,'#fff1dc');
  label(ctx,'⚠  VOORLOPIGE ROUTE – NIET LIVE GECONTROLEERD',82,529,23,'#9e5f1e',true);
  label(ctx,'Pistes op kaart voor planning aangenomen open; controleer actuele sluitingen.',82,557,19,'#835f3b');
  let y=591;
  for(const row of plan.sections){
   if(y>H-245)break;
   box(ctx,58,y,1120,113,'#ffffff');
   box(ctx,58,y,9,113,{ski:'#1585bd',lunch:'#f18b2a',break:'#8aa7b7',return:'#d85b4f',buffer:'#178d6c'}[row.type]||COL.blue);
   label(ctx,row.start+'–'+row.end,88,y+40,28,COL.navy,true);
   label(ctx,row.minutes+' min',88,y+80,20,COL.gray);
   label(ctx,row.label,402,y+37,24,COL.ink,true);
   lines(ctx,row.detail,403,y+75,735,18,2,COL.gray);y+=125;
  }
 }
 function regionPage(ctx,legs,notes){
  label(ctx,'VERBINDINGEN & WAARSCHUWINGEN',62,291,35,COL.navy,true);
  label(ctx,'Bron: skiwelt.at/nl/verbindingen.html',62,332,19,COL.gray);
  let y=358;
  for(const leg of legs){
   if(y>H-320)break;
   box(ctx,58,y,1120,150,'#e9f5fc');box(ctx,58,y,9,150,COL.blue);
   label(ctx,leg.from+' → '+leg.to,81,y+40,28,COL.navy,true);
   lines(ctx,leg.via,81,y+74,1030,20,3,COL.ink);
   label(ctx,'⚠  Niet live gecontroleerd · '+leg.minutes+' minuten indicatief',81,y+140,17,'#945f23');
   y+=166;
  }
  if(!legs.length){lines(ctx,'Geen gedocumenteerde open verbinding beschikbaar. Het dagtijdschema blijft bruikbaar, maar is geen navigatieroute.',70,y+38,1080,23,3,COL.ink);y+=130;}
  if(y<H-280){
   label(ctx,'BELANGRIJK',65,y+38,27,COL.navy,true);y+=55;
   for(const note of notes.slice(0,Math.max(1,Math.floor((H-180-y)/66)))){
    box(ctx,60,y,1120,58,'#fff3e4');lines(ctx,note,82,y+28,1050,18,2,'#8a5c32');y+=67;
   }
  }
 }
 async function generate({plan,route}){
  if(!plan?.ok)throw Error('Maak eerst een geldige dagplanning');
  if(typeof document==='undefined')throw Error('PDF vereist een browser');
  const logo=await loadLogo(),legs=route?.steps||[],notes=[...(route?.notes||[]),...(plan.notes||[])];
  const legPages=[];for(let i=0;i<legs.length;i+=7)legPages.push(legs.slice(i,i+7));
  if(!legPages.length)legPages.push([]);
  const total=1+legPages.length,jpegs=[];
  for(let page=0;page<total;page++){
   const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
   const ctx=canvas.getContext('2d');if(!ctx)throw Error('Geen canvas');
   pageStart(ctx,logo,page+1,total);
   if(page===0)schedule(ctx,plan);
   else regionPage(ctx,legPages[page-1],notes);
   jpegs.push(jpegBytes(canvas.toDataURL('image/jpeg',0.9)));
   canvas.width=1;canvas.height=1;
  }
  return new Blob([encodePdf(jpegs)],{type:'application/pdf'});
 }
 function save(blob,name='SKI-je-ski-dagplanning.pdf'){
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),45000);
 }
 return {generate,save,encodePdf};
});
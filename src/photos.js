/* SKI-je moderated community photos, Durable Object SQLite-backed pilot.
 * JPEG only, EXIF removed in the browser. No public access before admin review.
 * The group administrator secret is checked at the Worker boundary, never stored.
 * Position matching requires an administrator-confirmed reference point.
 */
const HEAD={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'};
const response=(v,status=200)=>new Response(JSON.stringify(v),{status,headers:HEAD});
const bad=(error,status=400)=>response({ok:false,error},status);
const CAP=110, PENDING_CAP=45, BYTES_CAP=78000, MAX_AGE=30*86400000;
const SAFE_ID=/^[a-f0-9-]{36}$/;
const ENTITY_TYPES=new Set(['lift','restaurant']);
const skiWelt=({lat,lng})=>Number.isFinite(lat)&&Number.isFinite(lng)&&lat>=47.32&&lat<=47.58&&lng>=11.95&&lng<=12.54;
const haversine=(a,b)=>{
 const r=6371000,deg=Math.PI/180,dLat=(b.lat-a.lat)*deg,dLng=(b.lng-a.lng)*deg;
 const x=Math.sin(dLat/2)**2+Math.cos(a.lat*deg)*Math.cos(b.lat*deg)*Math.sin(dLng/2)**2;
 return Math.round(2*r*Math.atan2(Math.sqrt(x),Math.sqrt(1-x)));
};
function photoData(raw){
 if(typeof raw!=='string'||raw.length>BYTES_CAP*1.4+40||!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(raw))return null;
 const base64=raw.slice('data:image/jpeg;base64,'.length);
 try {
  const binary=atob(base64);
  if(binary.length>BYTES_CAP||binary.length<1200||binary.charCodeAt(0)!==255||binary.charCodeAt(1)!==216||binary.charCodeAt(2)!==255)return null;
  if(binary.charCodeAt(binary.length-2)!==255||binary.charCodeAt(binary.length-1)!==217)return null;
  return base64;
 }catch{return null;}
}
export class SkiPhotoBoard {
 constructor(ctx,env){this.ctx=ctx;this.env=env;}
 async readAll(){return [...(await this.ctx.storage.list({prefix:'p:'})).values()].sort((a,b)=>b.createdAt-a.createdAt);}
 async cleanup(rows){
  const expired=rows.filter(p=>p.status==='pending'&&Date.now()-p.createdAt>MAX_AGE);
  for(const p of expired)await this.ctx.storage.delete('p:'+p.id);
  return rows.filter(p=>!expired.includes(p));
 }
 check(record,approved){
  const gps=record.gps, refs=approved.filter(p=>p.status==='approved'&&p.gpsVerified&&p.type===record.type&&p.entity===record.entity&&p.gps);
  if(!gps)return {state:'no-gps',message:'Geen GPS-meting. Beheerder moet locatie handmatig beoordelen.',referenceCount:refs.length,distanceM:null};
  if(!skiWelt(gps))return {state:'outside',message:'GPS ligt buiten de globale SkiWelt-regio.',referenceCount:refs.length,distanceM:null};
  if(gps.accuracy>150)return {state:'uncertain',message:'GPS-nauwkeurigheid is laag; handmatige locatiecontrole nodig.',referenceCount:refs.length,distanceM:null};
  if(!refs.length)return {state:'unverified',message:'Binnen SkiWelt, maar voor deze locatie bestaat nog geen door beheerder bevestigd GPS-ijkpunt.',referenceCount:0,distanceM:null};
  const meters=Math.min(...refs.map(p=>haversine(gps,p.gps)));
  const limit=Math.max(175,Math.ceil(gps.accuracy*3));
  return {state:meters<=limit?'near':'mismatch',message:meters<=limit?'GPS nabij een goedgekeurd ijkpunt.':'GPS wijkt af van goedgekeurde ijkpunten; controleer foto en bestemming.',referenceCount:refs.length,distanceM:meters};
 }
 summary(p,all){
  const gpsResult=this.check(p,all);
  return {id:p.id,type:p.type,entity:p.entity,caption:p.caption,createdAt:p.createdAt,status:p.status,
   gps:p.gps?{lat:p.gps.lat,lng:p.gps.lng,accuracy:p.gps.accuracy}:null,
   gpsVerified:!!p.gpsVerified,reviewedAt:p.reviewedAt||null,
   gpsReview:gpsResult,image:'/api/photos/image/'+p.id};
 }
 async fetch(request){
  const path=new URL(request.url).pathname,method=request.method;
  if(method==='GET'&&path==='/list'){
   const all=await this.readAll();
   return response({ok:true,photos:all.filter(x=>x.status==='approved').slice(0,CAP).map(p=>this.summary(p,all))});
  }
  if(method==='GET'&&path.startsWith('/image/')){
   const id=path.slice('/image/'.length);
   if(!SAFE_ID.test(id))return bad('Foto niet gevonden.',404);
   const p=await this.ctx.storage.get('p:'+id);
   if(!p||p.status!=='approved')return bad('Foto niet goedgekeurd of niet gevonden.',404);
   const bytes=Uint8Array.from(atob(p.image),c=>c.charCodeAt(0));
   return new Response(bytes,{headers:{'content-type':'image/jpeg','cache-control':'public,max-age=3600','x-content-type-options':'nosniff'}});
  }
  if(method!=='POST')return bad('Alleen POST toegestaan.',405);
  let data;try{data=await request.json();}catch{return bad('Ongeldige gegevens.');}
  if(path==='/submit'){
   const type=String(data.type||''),entity=String(data.entity||'').trim().slice(0,85),
    caption=String(data.caption||'').trim().slice(0,160),image=photoData(data.image);
   if(!ENTITY_TYPES.has(type)||entity.length<2||!image)return bad('Selecteer lift of restaurant en een geldige verkleinde JPEG-foto (max 78 kB).');
   // Server does not trust client-reported GPS as a guarantee of identity.
   let gps=null;
   if(data.gps&&Number.isFinite(Number(data.gps.lat))&&Number.isFinite(Number(data.gps.lng))&&Number.isFinite(Number(data.gps.accuracy))){
    gps={lat:Number(data.gps.lat),lng:Number(data.gps.lng),accuracy:Math.ceil(Number(data.gps.accuracy))};
    if(gps.accuracy<0||gps.accuracy>2000||gps.lat< -90||gps.lat>90||gps.lng< -180||gps.lng>180)gps=null;
   }
   const now=Date.now();
   let all=await this.cleanup(await this.readAll());
   if(all.length>=CAP||all.filter(x=>x.status==='pending').length>=PENDING_CAP)return bad('Fotowachtrij vol. Probeer later opnieuw.',429);
   // Only the real Cloudflare-provided IP is forwarded by the Worker, never an arbitrary browser header.
   const fingerprint=String(request.headers.get('x-skije-visitor')||'unknown').slice(0,130);
   const recent=all.filter(p=>p.visitor===fingerprint&&now-p.createdAt<3600000);
   if(recent.length>=3)return bad('Maximaal drie foto’s per uur per verbinding.',429);
   const record={id:crypto.randomUUID(),type,entity,caption,image,gps,createdAt:now,
    status:'pending',visitor:fingerprint,gpsVerified:false,reviewedAt:null};
   await this.ctx.storage.put('p:'+record.id,record);
   return response({ok:true,id:record.id,status:'pending',gpsReview:this.check(record,all)},201);
  }
  if(path==='/admin-list'){
   if(request.headers.get('x-skije-photo-admin')!=='yes')return bad('Geen beheerdersrechten.',403);
   const all=await this.cleanup(await this.readAll());
   return response({ok:true,photos:all.slice(0,CAP).map(p=>({...this.summary(p,all),imagePreview:'data:image/jpeg;base64,'+p.image}))});
  }
  if(path==='/review'){
   if(request.headers.get('x-skije-photo-admin')!=='yes')return bad('Geen beheerdersrechten.',403);
   const id=String(data.id||''),decision=String(data.decision||'');
   if(!SAFE_ID.test(id)||!['approve','reject'].includes(decision))return bad('Ongeldige beoordelingsactie.');
   const item=await this.ctx.storage.get('p:'+id);
   if(!item||item.status!=='pending')return bad('Foto is niet meer in behandeling.',404);
   if(decision==='reject'){await this.ctx.storage.delete('p:'+id);return response({ok:true,status:'rejected'});}
   const match=this.check(item,await this.readAll());
   if(['no-gps','outside','uncertain','mismatch','unverified'].includes(match.state)&&data.manualOverride!==true)
    return bad('Deze GPS-controle is niet sluitend. Controleer de foto en vink handmatige locatiecontrole aan.',400);
   item.status='approved';item.reviewedAt=Date.now();item.visitor=null;
   item.gpsVerified=Boolean(data.verifyLocation)&&Boolean(item.gps)&&skiWelt(item.gps)&&item.gps.accuracy<=50&&match.state!=='mismatch';
   await this.ctx.storage.put('p:'+item.id,item);
   return response({ok:true,status:'approved',gpsVerified:item.gpsVerified});
  }
  return bad('Onbekende foto-opdracht.',404);
 }
}

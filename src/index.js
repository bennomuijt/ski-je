/* SKI-je Cloudflare pilot, 2026-11-20.
 * One Cloudflare Worker: first-party static assets + authenticated group WebSockets.
 * Membership is persisted; GPS fixes only exist on active WebSockets.
 * No third-party database, no paid plan required within Cloudflare Free quotas.
 */
import { release } from './release.js';

const JSON_HEADERS={"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff","referrer-policy":"no-referrer"};
const ROOM_RE=/^[A-Za-z0-9_-]{32}$/;
const MEMBER_RE=/^[a-f0-9-]{36}$/;
const GROUP_LIMIT=50;
const GPS_TTL_MS=120000;
const GROUP_LIFETIME_MS=90*86400000;
export {SkiPhotoBoard} from './photos.js';

function result(data,status=200,extra={}) {return new Response(JSON.stringify(data),{status,headers:{...JSON_HEADERS,...extra}});}
function fail(message,status=400){return result({ok:false,error:message},status);}
function randomCode(bytes=24){const a=new Uint8Array(bytes);crypto.getRandomValues(a);return btoa(String.fromCharCode(...a)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');}
async function digest(s){const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return Array.from(new Uint8Array(d)).map(v=>v.toString(16).padStart(2,'0')).join('');}
function equalHex(ah,bh){if(typeof ah!=='string'||typeof bh!=='string'||ah.length!==64||bh.length!==64)return false;let diff=0;for(let i=0;i<64;i++)diff|=ah.charCodeAt(i)^bh.charCodeAt(i);return diff===0;}
async function equalSecret(a,b){if(typeof a!=='string'||typeof b!=='string'||!a||!b)return false;const [ah,bh]=await Promise.all([digest(a),digest(b)]);return equalHex(ah,bh);}
function nameText(v,max=35){return String(v??'').normalize('NFC').replace(/[\u0000-\u001f\u007f<>]/g,'').trim().slice(0,max);}
async function bodyData(req){if(Number(req.headers.get('content-length')||'0')>4096)throw Error('Te groot verzoek');const text=await req.text();if(text.length>4096)throw Error('Te groot verzoek');const data=JSON.parse(text);if(!data||typeof data!=='object'||Array.isArray(data))throw Error('Ongeldige gegevens');return data;}
function groupStub(env,room){return env.GROUPS.get(env.GROUPS.idFromName('skije-group:'+room));}
function sameOrigin(req){const origin=req.headers.get('origin');return !origin||origin===new URL(req.url).origin;}
function adminReady(env){return typeof env.GROUP_CREATE_SECRET==='string'&&env.GROUP_CREATE_SECRET.length>=16;}

export default {
 async fetch(request,env){
  const url=new URL(request.url);const p=url.pathname;
  if(p==='/api/health')return result({ok:true,service:'SKI-je Cloudflare',...release,groups:!!env.GROUPS,photos:!!env.PHOTOS,createConfigured:adminReady(env),defaultBroadcastSeconds:30,maxMembersPerGroup:GROUP_LIMIT});
  if(p==='/api/skimap.pdf'){
   if(request.method!=='GET')return fail('Alleen GET toegestaan.',405);
   // Fixed, official source; no GPS or user-supplied URLs are transmitted.
   try{
    const upstream=await fetch('https://media.skiwelt.at/media/panorama/winter/SkiWelt-Panorama-26-27-NL.pdf',{headers:{Accept:'application/pdf'},cf:{cacheTtl:21600,cacheEverything:true}});
    if(!upstream.ok||!/application\/pdf/i.test(upstream.headers.get('content-type')||''))
     return new Response('Officiele PDF-kaart tijdelijk niet bereikbaar',{status:503,headers:JSON_HEADERS});
    const headers=new Headers({'content-type':'application/pdf','content-disposition':'inline; filename="SkiWelt-Panorama-26-27-NL.pdf"','cache-control':'public, max-age=21600','x-content-type-options':'nosniff','referrer-policy':'no-referrer'});
    return new Response(upstream.body,{status:200,headers});
   }catch{return new Response('Officiele PDF-kaart tijdelijk niet bereikbaar',{status:503,headers:JSON_HEADERS});}
  }
  if(p==='/api/skimap.jpg'){
   if(request.method!=='GET')return fail('Alleen GET toegestaan.',405);
   // Fixed public media URL. No user-controlled proxy address or GPS is sent.
   try{
    const upstream=await fetch('https://media.skiwelt.at/media/panorama/winter/SkiWelt-Panorama-26-27-NL.jpg',{headers:{Accept:'image/jpeg'},cf:{cacheTtl:21600,cacheEverything:true}});
    if(!upstream.ok)return new Response('Officiële kaart tijdelijk niet bereikbaar',{status:503,headers:JSON_HEADERS});
    const headers=new Headers({'content-type':'image/jpeg','cache-control':'public, max-age=21600','x-content-type-options':'nosniff','referrer-policy':'no-referrer'});
    return new Response(upstream.body,{status:200,headers});
   }catch{return new Response('Officiële kaart tijdelijk niet bereikbaar',{status:503,headers:JSON_HEADERS});}
  }
  if(p.startsWith('/api/photos/')){
   if(!env.PHOTOS)return fail('Fotofunctie is nog niet geactiveerd op de Cloudflare Worker.',503);
   if(!sameOrigin(request))return fail('Verzoek van ander domein geweigerd.',403);
   const op=p.slice('/api/photos'.length);
   if(!['/list','/submit','/admin-list','/review'].includes(op)&&!op.startsWith('/image/'))return fail('Onbekende foto-opdracht.',404);
   if(request.method==='GET'&&!['/list'].includes(op)&&!op.startsWith('/image/'))return fail('Ongeldige methode.',405);
   if(request.method!=='GET'&&request.method!=='POST')return fail('Ongeldige methode.',405);
   const board=env.PHOTOS.get(env.PHOTOS.idFromName('skije-community-photos-v1'));
   const headers=new Headers({'content-type':'application/json'});
   if(request.method==='POST'){
    if(Number(request.headers.get('content-length')||0)>120000)return fail('Fotoverzoek is te groot.',413);
    let data;try{const body=await request.text();if(body.length>120000)throw Error('groot');data=JSON.parse(body);}
    catch{return fail('Ongeldig of te groot fotoverzoek.',413);}
    if(!data||typeof data!=='object'||Array.isArray(data))return fail('Onjuist fotoverzoek.',400);
    if(op==='/admin-list'||op==='/review'){
     if(!adminReady(env)||!(await equalSecret(data.adminCode,env.GROUP_CREATE_SECRET)))return fail('Beheerderscode onjuist.',403);
     delete data.adminCode;
     headers.set('x-skije-photo-admin','yes');
    }else if(op==='/submit'){
     // Pseudonymize connection identity before rate limiting; never store plaintext IP.
     const ip=request.headers.get('cf-connecting-ip')||'unknown';
     headers.set('x-skije-visitor',(await digest(ip+'|'+(env.GROUP_CREATE_SECRET||'')+'|'+new Date().toISOString().slice(0,10))).slice(0,40));
    }
    return board.fetch(new Request('https://photos.internal'+op,{method:'POST',headers,body:JSON.stringify(data)}));
   }
   return board.fetch(new Request('https://photos.internal'+op,{method:'GET'}));
  }
  if(p.startsWith('/api/')){
   if(!sameOrigin(request))return fail('Verzoek van ander domein geweigerd.',403);
   if(p==='/api/group/diagnose'){
    if(request.method!=='GET')return fail('Alleen GET toegestaan.',405);
    if(!env.GROUPS)return fail('Cloudflare GROUPS Durable Objects-binding ontbreekt.',503);
    try{
     const probe=await groupStub(env,'__diagnostics__').fetch('https://group.internal/probe');
     if(!probe.ok)return fail('Cloudflare-groepsopslag geeft een foutmelding.',503);
     const data=await probe.json();
     if(data.ok!==true||data.storageReady!==true)return fail('Cloudflare-groepsopslag reageert niet correct.',503);
     return result({ok:true,storageReady:true,createConfigured:adminReady(env)});
    }catch{return fail('Groepsopslag is niet bereikbaar. Controleer de Cloudflare Durable Objects-logs.',503);}
   }
   if(p==='/api/group/socket'){
    if(request.headers.get('upgrade')?.toLowerCase()!=='websocket')return fail('WebSocket vereist.',426);
    const room=url.searchParams.get('room')||'';const memberId=url.searchParams.get('member')||'';const token=url.searchParams.get('token')||'';
    if(!ROOM_RE.test(room)||!MEMBER_RE.test(memberId)||token.length<40||token.length>100)return fail('Ongeldige groepsgegevens.',401);
    return groupStub(env,room).fetch(new Request('https://group.internal/socket?member='+encodeURIComponent(memberId)+'&token='+encodeURIComponent(token),{headers:request.headers}));
   }
   if(request.method!=='POST')return fail('Alleen POST toegestaan.',405);
   let data;try{data=await bodyData(request);}catch{return fail('Ongeldig of te groot verzoek.',400);}
   if(p==='/api/group/create'){
    if(!env.GROUPS)return fail('De GROUPS-opslag ontbreekt in Cloudflare.',503);
    if(!adminReady(env))return fail('Stel op Cloudflare GROUP_CREATE_SECRET van minimaal 16 tekens in.',503);
    if(!(await equalSecret(data.adminCode,env.GROUP_CREATE_SECRET)))return fail('Beheerderscode onjuist. Gebruik precies de waarde van GROUP_CREATE_SECRET in Cloudflare, niet je Cloudflare-inlogcode.',403);
    const name=nameText(data.name,60),memberName=nameText(data.memberName,24);
    if(!name||!memberName)return fail('Vul je eigen naam en de groepsnaam in.',400);
    const room=randomCode(24);
    try{
     const response=await groupStub(env,room).fetch('https://group.internal/create',{method:'POST',body:JSON.stringify({name,memberName})});
     const payload=await response.json();
     if(!response.ok)return result(payload,response.status);
     return result({...payload,room},response.status);
    }catch{return fail('De groepsopslag kon de groep niet bewaren. Controleer de Cloudflare Durable Objects-logs.',503);}
   }
   if(['/api/group/join','/api/group/leave','/api/group/close'].includes(p)){
    const room=data.room||'';
    if(!ROOM_RE.test(room))return fail('Groepscode niet geldig.',400);
    const op=p.slice('/api/group/'.length);
    const response=await groupStub(env,room).fetch('https://group.internal/'+op,{method:'POST',body:JSON.stringify(data)});
    return result(await response.json(),response.status);
   }
   return fail('Onbekende functie.',404);
  }
  const response=await env.ASSETS.fetch(request);
  // Do not put group invite tokens in outbound referrers; never cache app HTML for a long time.
  if(!response.ok)return response;
  const h=new Headers(response.headers);
  h.set('Referrer-Policy','no-referrer');h.set('X-Content-Type-Options','nosniff');h.set('Permissions-Policy','geolocation=(self), camera=(self), microphone=(self)');
  if(p==='/'||p==='/index.html'||p==='/sw.js')h.set('Cache-Control','no-cache');
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h});
 }
};

export class SkiGroup {
 constructor(ctx,env){this.ctx=ctx;this.env=env;}
 async memberAuth(id,token){
  if(!MEMBER_RE.test(String(id||''))||typeof token!=='string'||token.length<40||token.length>100)return null;
  const found=await this.ctx.storage.get('m:'+id);
  if(!found||!equalHex(await digest(token),found.secretHash))return null;
  return found;
 }
 async fetch(req){
  const op=new URL(req.url).pathname;
  if(op==='/probe'){await this.ctx.storage.get('meta');return result({ok:true,storageReady:true});}
  if(op==='/socket'){
   if(req.headers.get('upgrade')?.toLowerCase()!=='websocket')return fail('WebSocket vereist.',426);
   const u=new URL(req.url);const member=await this.memberAuth(u.searchParams.get('member'),u.searchParams.get('token'));
   const meta=await this.ctx.storage.get('meta');
   if(!meta||meta.closed||Date.now()-meta.lastJoin>GROUP_LIFETIME_MS||!member)return fail('Groep niet gevonden of toegang verlopen.',401);
   if(this.ctx.getWebSockets().length>=60)return fail('Deze skigroep is vol. Probeer later.',429);
   const pair=new WebSocketPair();const [client,server]=Object.values(pair);
   const attachment={id:member.id,name:member.name,last:null,at:0};
   this.ctx.acceptWebSocket(server);server.serializeAttachment(attachment);
   this.safeSend(server,{type:'welcome',groupName:meta.name,you:member.id,owner:!!member.owner,maxMembers:GROUP_LIMIT,members:await this.members(),peers:this.peers(server)});
   this.broadcast({type:'joined',id:member.id,name:member.name,at:Date.now()},server);
   return new Response(null,{status:101,webSocket:client});
  }
  let data;try{data=await req.json();}catch{return fail('Verkeerd gegevensformaat.');}
  if(op==='/create'){
   if(await this.ctx.storage.get('meta'))return fail('Groep bestaat al.',409);
   const groupName=nameText(data.name,60)||'SKI-je groep',memberName=nameText(data.memberName,24);
   if(!memberName)return fail('Vul je naam in.');
   const id=crypto.randomUUID(),token=randomCode(32),secretHash=await digest(token),t=Date.now();
   await this.ctx.storage.put('meta',{name:groupName,createdAt:t,lastJoin:t,closed:false});
   await this.ctx.storage.put('m:'+id,{id,name:memberName,secretHash,owner:true,at:t});
   await this.ctx.storage.setAlarm(t+GROUP_LIFETIME_MS);
   return result({ok:true,groupName,memberId:id,token,owner:true,maxMembers:GROUP_LIMIT});
  }
  const meta=await this.ctx.storage.get('meta');
  if(!meta||meta.closed||Date.now()-meta.lastJoin>GROUP_LIFETIME_MS)return fail('Groep bestaat niet (meer).',404);
  if(op==='/join'){
   const memberName=nameText(data.memberName,24);if(!memberName)return fail('Vul je naam in.');
   const id=crypto.randomUUID(),token=randomCode(32),secretHash=await digest(token),t=Date.now();
   const accepted=await this.ctx.storage.transaction(async txn=>{
    const members=await txn.list({prefix:'m:'});
    if(members.size>=GROUP_LIMIT)return false;
    await txn.put('m:'+id,{id,name:memberName,secretHash,owner:false,at:t});
    meta.lastJoin=t;await txn.put('meta',meta);return true;
   });
   if(!accepted)return fail('De skigroep heeft het maximum van 50 leden bereikt.',409);
   await this.ctx.storage.setAlarm(t+GROUP_LIFETIME_MS);
   this.broadcast({type:'member-added',id,name:memberName,at:t});
   return result({ok:true,groupName:meta.name,memberId:id,token,owner:false,maxMembers:GROUP_LIMIT});
  }
  if(op==='/leave'||op==='/close'){
   const member=await this.memberAuth(data.memberId,data.token);
   if(!member)return fail('Je bent niet meer aangemeld.',401);
   if(op==='/close'&&!member.owner)return fail('Alleen de groepsbeheerder mag de groep sluiten.',403);
   if(op==='/close'){
    this.broadcast({type:'group-closed'});
    for(const ws of this.ctx.getWebSockets())try{ws.close(1000,'Groep gesloten');}catch{}
    await this.ctx.storage.deleteAll();return result({ok:true,closed:true});
   }
   await this.ctx.storage.delete('m:'+member.id);
   this.broadcast({type:'member-removed',id:member.id,at:Date.now()});
   for(const ws of this.ctx.getWebSockets())if(ws.deserializeAttachment()?.id===member.id){try{ws.close(1000,'Groep verlaten');}catch{}}
   return result({ok:true,left:true});
  }
  return fail('Onbekende opdracht.',404);
 }
 async alarm(){
  const meta=await this.ctx.storage.get('meta');
  if(!meta)return;
  if(Date.now()-meta.lastJoin>=GROUP_LIFETIME_MS){
   for(const ws of this.ctx.getWebSockets())try{ws.close(1000,'Groep verlopen');}catch{}
   await this.ctx.storage.deleteAll();
  }else await this.ctx.storage.setAlarm(meta.lastJoin+GROUP_LIFETIME_MS);
 }
 safeSend(ws,data){try{ws.send(JSON.stringify(data));}catch{}}
 peers(exclude=null){const t=Date.now();const unique=new Map();for(const s of this.ctx.getWebSockets()){
  if(s===exclude||s.readyState!==WebSocket.OPEN)continue;
  const a=s.deserializeAttachment();if(!a||!a.id)continue;
  const previous=unique.get(a.id);if(previous&&previous.at>=a.at)continue;
  unique.set(a.id,{id:a.id,name:a.name,at:a.at||0,last:a.last&&t-a.last.at<GPS_TTL_MS?a.last:null});
 }return [...unique.values()].slice(0,GROUP_LIMIT);}
 async members(){
  const stored=await this.ctx.storage.list({prefix:'m:'});
  const active=new Map(this.peers().map(peer=>[peer.id,peer]));
  return [...stored.values()].map(member=>{
   const connection=active.get(member.id);
   return {id:member.id,name:member.name,online:!!connection,last:connection?.last||null,at:connection?.at||0};
  }).slice(0,GROUP_LIMIT);
 }
 broadcast(data,except=null){for(const s of this.ctx.getWebSockets()){if(s!==except)this.safeSend(s,data);}}
 async webSocketMessage(ws,message){
  if(typeof message!=='string'||message.length>1200)return;
  const a=ws.deserializeAttachment();if(!a?.id)return;
  let obj;try{obj=JSON.parse(message);}catch{return;}
  if(!obj||typeof obj!=='object')return;
  if(obj.type==='ping'){this.safeSend(ws,{type:'pong',at:Date.now()});return;}
  if(obj.type==='stop'){
   a.last=null;ws.serializeAttachment(a);this.broadcast({type:'stopped',id:a.id,at:Date.now()});return;
  }
  if(obj.type!=='position')return;
  const t=Date.now();if(t-a.at<12000)return;
  const lat=Number(obj.lat),lng=Number(obj.lng),accuracy=Number(obj.accuracy);
  if(!Number.isFinite(lat)||!Number.isFinite(lng)||!Number.isFinite(accuracy)||lat< -90||lat>90||lng< -180||lng>180||accuracy<0||accuracy>2000)return;
  const fix={lat:Math.round(lat*1e6)/1e6,lng:Math.round(lng*1e6)/1e6,accuracy:Math.round(accuracy),at:t};
  a.last=fix;a.at=t;ws.serializeAttachment(a);
  this.broadcast({type:'position',id:a.id,name:a.name,...fix},null);
 }
 hasOtherSocket(id,exclude){return this.ctx.getWebSockets().some(s=>s!==exclude&&s.readyState===WebSocket.OPEN&&s.deserializeAttachment()?.id===id);}
 async webSocketClose(ws,code,reason){
  const a=ws.deserializeAttachment();if(a?.id&&!this.hasOtherSocket(a.id,ws))this.broadcast({type:'left',id:a.id,at:Date.now()},ws);
  try{if(code>=1000&&code<5000&&![1004,1005,1006,1015].includes(code))ws.close(code,reason);else ws.close();}catch{}
 }
 async webSocketError(ws){const a=ws.deserializeAttachment();if(a?.id&&!this.hasOtherSocket(a.id,ws))this.broadcast({type:'left',id:a.id,at:Date.now()},ws);try{ws.close();}catch{}}
}

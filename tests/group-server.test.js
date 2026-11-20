import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import worker,{SkiGroup} from '../src/index.js';

const RealResponse=globalThis.Response;
globalThis.Response=class extends RealResponse {
 constructor(body,init){if(init?.status===101)return {status:101,webSocket:init.webSocket};super(body,init);}
};
globalThis.WebSocketPair=class {
 constructor(){
  const s=()=>({attachment:null,sent:[],deserializeAttachment(){return this.attachment;},serializeAttachment(a){this.attachment=structuredClone(a);},send(t){this.sent.push(JSON.parse(t));},close(){this.closed=true;}});
  this[0]=s();this[1]=s();
 }
};
class MemoryStorage {
 constructor(){this.map=new Map();}
 async get(k){return this.map.get(k);}
 async put(k,v){this.map.set(k,structuredClone(v));}
 async delete(k){return this.map.delete(k);}
 async deleteAll(){this.map.clear();this.alarmTime=null;}
 async setAlarm(t){this.alarmTime=t;}
 async transaction(f){return f(this);}
 async list({prefix=''}){return new Map([...this.map].filter(([k])=>k.startsWith(prefix)));}
}
class FakeCtx {
 constructor(){this.storage=new MemoryStorage();this.sockets=[];}
 acceptWebSocket(ws){this.sockets.push(ws);}
 getWebSockets(){return this.sockets.filter(s=>!s.closed);}
}
function setup(){const objects=new Map(),contexts=new Map();const env={GROUP_CREATE_SECRET:'SCHERM-DEZE-CODE-GOED-AF-VOOR-TEST',GROUPS:{idFromName:n=>n,get(id){if(!objects.has(id)){const ctx=new FakeCtx();contexts.set(id,ctx);objects.set(id,new SkiGroup(ctx,env));}return {fetch:(req,init)=>objects.get(id).fetch(typeof req==='string'?new Request(req,init):req)};}},ASSETS:{fetch:async()=>new RealResponse('<h1>SKI-je</h1>',{status:200,headers:{'content-type':'text/html'}})}};return {env,contexts,objects};}
function post(env,path,data,origin='https://ski-je.example'){const url='https://ski-je.example/api/group/'+path;return worker.fetch(new Request(url,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(data)}),env);}
async function create(env){const r=await post(env,'create',{name:'SkiWelt 2026',memberName:'Skiër 1',adminCode:env.GROUP_CREATE_SECRET});assert.equal(r.status,200);return r.json();}
async function join(env,room,name){const response=await post(env,'join',{room,memberName:name});return {status:response.status,body:await response.json()};}
function socket(env,room,memberId,token){const url=`https://ski-je.example/api/group/socket?room=${room}&member=${memberId}&token=${token}`;return worker.fetch(new Request(url,{headers:{Upgrade:'websocket',Origin:'https://ski-je.example'}}),env);}

test('first-party app and public health endpoint work; no explicit CORS',async()=>{
 const {env}=setup();const p=await worker.fetch(new Request('https://ski-je.example/'),env);
 assert.equal(p.status,200);assert.match(await p.text(),/SKI-je/);
 const h=await worker.fetch(new Request('https://ski-je.example/api/health'),env);const json=await h.json();assert.equal(json.ok,true);assert.equal(json.version,'4.5.0-cf');assert.equal(json.maxMembersPerGroup,50);assert.equal(h.headers.get('access-control-allow-origin'),null);
});
test('create requires configured admin code and same-origin; invite codes are unguessable',async()=>{
 const {env}=setup();let r=await post(env,'create',{memberName:'X',adminCode:'wrong'});assert.equal(r.status,403);
 r=await post(env,'create',{memberName:'X',adminCode:env.GROUP_CREATE_SECRET},'https://evil.example');assert.equal(r.status,403);
 const made=await create(env);assert.match(made.room,/^[A-Za-z0-9_-]{32}$/);
 assert.equal(made.token.length>=40,true);
 const second=await create(env);assert.notEqual(made.room,second.room);
});
test('20 online skiers, socket authentication, broadcasting, stop and no stored GPS positions',async()=>{
 const {env,contexts,objects}=setup();const owner=await create(env),all=[{status:200,body:owner}];
 for(let i=2;i<=20;i++)all.push(await join(env,owner.room,'Skiër '+i));
 assert.equal(all.length,20);
 const ctx=contexts.get('skije-group:'+owner.room);
 const sockets=[];
 for(const m of all){const r=await socket(env,owner.room,m.body.memberId,m.body.token);assert.equal(r.status,101);sockets.push(r.webSocket);}
 assert.equal(ctx.getWebSockets().length,20);
 const denied=await socket(env,owner.room,owner.memberId,'z'.repeat(43));assert.equal(denied.status,401);
 const instance=env.GROUPS.get('skije-group:'+owner.room);
 const ctxSocks=ctx.getWebSockets();
 const allMemberRows=await ctx.storage.list({prefix:'m:'});assert.equal(allMemberRows.size,20);
 assert.equal([...allMemberRows.values()].every(m=>!('token' in m)&&m.secretHash?.length===64),true);
 const serverObj=objects.get('skije-group:'+owner.room),sender=ctxSocks[0],receiver=ctxSocks[1];
 const before=receiver.sent.length;
 await serverObj.webSocketMessage(sender,JSON.stringify({type:'position',lat:47.5,lng:12.3,accuracy:7}));
 assert.equal(receiver.sent.length,before+1);
 assert.equal(receiver.sent.at(-1).type,'position');assert.equal(receiver.sent.at(-1).lat,47.5);
 const count=receiver.sent.length;
 await serverObj.webSocketMessage(sender,JSON.stringify({type:'position',lat:47.51,lng:12.3,accuracy:7}));
 assert.equal(receiver.sent.length,count,'server throttles rapid repeats');
 await serverObj.webSocketMessage(sender,JSON.stringify({type:'stop'}));
 assert.equal(receiver.sent.at(-1).type,'stopped');
 const persisted=JSON.stringify([...ctx.storage.map]);assert.equal(persisted.includes('47.5'),false,'GPS never persisted');
 const socketAtt=sender.deserializeAttachment();assert.equal(socketAtt.last,null,'GPS removed when sharing stops');
});
test('50 members connect, broadcasts to 49, rejects 51 and owner can close group',async()=>{
 const {env,contexts,objects}=setup();const owner=await create(env),members=[owner];
 for(let i=2;i<=50;i++){const m=await join(env,owner.room,'Skiër '+i);assert.equal(m.status,200,'member '+i);members.push(m.body);}
 for(const m of members){const r=await socket(env,owner.room,m.memberId,m.token);assert.equal(r.status,101);}
 const ctx=contexts.get('skije-group:'+owner.room);assert.equal(ctx.getWebSockets().length,50);
 const sender=ctx.getWebSockets()[0],recipients=ctx.getWebSockets().slice(1),counts=recipients.map(s=>s.sent.length);
 await objects.get('skije-group:'+owner.room).webSocketMessage(sender,JSON.stringify({type:'position',lat:47.4,lng:12.3,accuracy:9}));
 for(let i=0;i<recipients.length;i++)assert.equal(recipients[i].sent.length,counts[i]+1);
 assert.equal(ctx.storage.map.size,51,'50 members and 1 meta only: no GPS stored');
 const extra=await join(env,owner.room,'Skiër 51');assert.equal(extra.status,409);
 let no=await post(env,'close',{room:owner.room,memberId:crypto.randomUUID(),token:'x'.repeat(43)});assert.equal(no.status,401);
 no=await post(env,'close',{room:owner.room,memberId:owner.memberId,token:owner.token});assert.equal(no.status,200);
 const after=await join(env,owner.room,'Nieuwer');assert.equal(after.status,404);
});
test('invalid payload cannot create or join a group and huge request is blocked',async()=>{
 const {env}=setup();const owner=await create(env);
 const bad=await post(env,'join',{room:'123',memberName:'Skiër 2'});assert.equal(bad.status,400);
 const oversize=await post(env,'join',{room:owner.room,memberName:'a'.repeat(5000)});assert.equal(oversize.status,400);
});

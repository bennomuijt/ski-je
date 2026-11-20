import test from 'node:test';
import assert from 'node:assert/strict';
import {SkiPhotoBoard} from '../src/photos.js';
import worker from '../src/index.js';
import {readFileSync} from 'node:fs';
class Store {
 constructor(){this.rows=new Map();}
 async list({prefix=''}){return new Map([...this.rows].filter(([k])=>k.startsWith(prefix)));}
 async get(k){return this.rows.get(k);}
 async put(k,v){this.rows.set(k,structuredClone(v));}
 async delete(k){this.rows.delete(k);}
}
const image='data:image/jpeg;base64,'+Buffer.concat([Buffer.from([255,216,255]),Buffer.alloc(1600,42),Buffer.from([255,217])]).toString('base64');
function setup(){
 const storage=new Store(),board=new SkiPhotoBoard({storage},{});
 const env={GROUP_CREATE_SECRET:'LONG-ADMIN-CODE-FOR-UNIT-TESTS',PHOTOS:{idFromName:s=>s,get:()=>({fetch:r=>board.fetch(r)})},ASSETS:{fetch:()=>new Response('ok')}};
 return {env,board,storage};
}
async function request(env,path,data,headers={}){
 const r=await worker.fetch(new Request('https://ski-je.example/api/photos/'+path,{
  method:'POST',headers:{origin:'https://ski-je.example','content-type':'application/json','CF-Connecting-IP':'192.0.2.10',...headers},body:JSON.stringify(data)
 }),env);
 return {status:r.status,body:await r.json()};
}
test('photo API prevents public access until administrator approval',async()=>{
 const {env}=setup();
 const pic={type:'restaurant',entity:'Kaiserlounge',caption:'Binnenruimte',image,gps:{lat:47.50,lng:12.28,accuracy:16}};
 let r=await request(env,'submit',pic);assert.equal(r.status,201);assert.equal(r.body.status,'pending');
 const id=r.body.id;
 const publicList=await worker.fetch(new Request('https://ski-je.example/api/photos/list'),env);
 assert.equal((await publicList.json()).photos.length,0);
 const hidden=await worker.fetch(new Request('https://ski-je.example/api/photos/image/'+id),env);assert.equal(hidden.status,404);
 r=await request(env,'admin-list',{adminCode:'WRONG'});assert.equal(r.status,403);
 r=await request(env,'admin-list',{adminCode:env.GROUP_CREATE_SECRET});assert.equal(r.status,200);assert.equal(r.body.photos.length,1);
 r=await request(env,'review',{adminCode:env.GROUP_CREATE_SECRET,id,decision:'approve'});assert.equal(r.status,400,'First GPS point needs manual verification');
 r=await request(env,'review',{adminCode:env.GROUP_CREATE_SECRET,id,decision:'approve',manualOverride:true,verifyLocation:true});
 assert.equal(r.status,200);assert.equal(r.body.gpsVerified,true);
 const list=await worker.fetch(new Request('https://ski-je.example/api/photos/list'),env);
 const items=(await list.json()).photos;assert.equal(items.length,1);assert.equal(items[0].entity,'Kaiserlounge');
 const imageResponse=await worker.fetch(new Request('https://ski-je.example/api/photos/image/'+id),env);
 assert.equal(imageResponse.status,200);assert.equal(imageResponse.headers.get('content-type'),'image/jpeg');
 assert.equal((await imageResponse.arrayBuffer()).byteLength,1605);
});
test('GPS checks compare approved reference points, and flag mismatched places',async()=>{
 const {env}=setup();
 let r=await request(env,'submit',{type:'restaurant',entity:'Stöcklalm',image,gps:{lat:47.499,lng:12.27,accuracy:12}});
 await request(env,'review',{adminCode:env.GROUP_CREATE_SECRET,id:r.body.id,decision:'approve',manualOverride:true,verifyLocation:true});
 r=await request(env,'submit',{type:'restaurant',entity:'Stöcklalm',image,gps:{lat:47.56,lng:12.5,accuracy:15}});
 assert.equal(r.status,201);assert.equal(r.body.gpsReview.state,'mismatch');
 const out=await request(env,'review',{adminCode:env.GROUP_CREATE_SECRET,id:r.body.id,decision:'approve'});
 assert.equal(out.status,400);
});
test('invalid pictures, outside position and rapid repeat are restricted',async()=>{
 const {env}=setup();
 const invalid=await request(env,'submit',{type:'lift',entity:'Hartkaiserbahn',image:'data:image/svg+xml;base64,SGVsbG8='});
 assert.equal(invalid.status,400);
 const pic={type:'lift',entity:'Hartkaiserbahn',image,gps:{lat:47.49,lng:12.26,accuracy:25}};
 for(let i=0;i<3;i++)assert.equal((await request(env,'submit',pic)).status,201);
 assert.equal((await request(env,'submit',pic)).status,429);
});
test('restaurant layer is opt-in and Netlify references were removed',()=>{
 const root=new URL('../',import.meta.url);
 const html=readFileSync(new URL('public/index.html',root),'utf8');
 const map=readFileSync(new URL('public/pano-restaurants.js',root),'utf8');
 const worker=readFileSync(new URL('public/sw.js',root),'utf8');
 assert.match(html,/id="pano-restaurants-visible"/);assert.doesNotMatch(html,/id="pano-restaurants-visible"[^>]*checked/);
 assert.match(map,/!toggle\?\.checked/);assert.match(map,/area:'brixen'/);assert.match(map,/area:'hopfgarten'/);
 assert.match(html,/id="community-photo-camera"/);
 assert.match(worker,/photo-community\.js/);assert.match(worker,/pathname\.startsWith\('\/api\/'\)/);
 assert.doesNotMatch(html,/netlify/i);
});

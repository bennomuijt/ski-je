import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { SkiGroup } from '../src/index.js';

const ROOM='https://group.internal/photo';
const OWNER_ID='11111111-1111-4111-a111-111111111111';
const MEMBER_ID='22222222-2222-4222-a222-222222222222';
const OWNER_TOKEN='a'.repeat(48);
const MEMBER_TOKEN='b'.repeat(48);
const sha=value=>createHash('sha256').update(value).digest('hex');

function setup(){
 const map=new Map([
  ['meta',{name:'SkiWelt vrienden',closed:false,lastJoin:Date.now()}],
  ['m:'+OWNER_ID,{id:OWNER_ID,name:'Beheerder',owner:true,secretHash:sha(OWNER_TOKEN)}],
  ['m:'+MEMBER_ID,{id:MEMBER_ID,name:'Groepslid',owner:false,secretHash:sha(MEMBER_TOKEN)}]
 ]);
 const storage={
  async get(key){return map.get(key);},
  async put(key,value){map.set(key,value);},
  async delete(key){map.delete(key);}
 };
 const sent=[];
 const client=new SkiGroup({
  storage,
  getWebSockets(){return [{send(text){sent.push(JSON.parse(text));}}];}
 },{});
 async function post(payload){
  const response=await client.fetch(new Request(ROOM,{
   method:'POST',headers:{'content-type':'application/json'},
   body:JSON.stringify(payload)
  }));
  return {status:response.status,body:await response.json()};
 }
 const owner={memberId:OWNER_ID,token:OWNER_TOKEN};
 const guest={memberId:MEMBER_ID,token:MEMBER_TOKEN};
 return {map,sent,post,owner,guest};
}
function jpeg(size=220){
 const bytes=Buffer.alloc(size);
 bytes[0]=255;bytes[1]=216;bytes[2]=255;
 bytes[size-2]=255;bytes[size-1]=217;
 return bytes.toString('base64');
}
test('Groepsfoto is uitsluitend te bekijken door geauthenticeerde groepsleden',async()=>{
 const {post,owner,guest}=setup();
 const encoded=jpeg();
 assert.equal((await post({...owner,action:'save',image:encoded})).status,200);
 const member=await post({...guest,action:'get'});
 assert.equal(member.status,200);
 assert.equal(member.body.photo.image,encoded);
 assert.equal((await post({memberId:MEMBER_ID,token:'x'.repeat(48),action:'get'})).status,401);
});
test('Alleen de beheerder mag de foto vervangen en verwijderen',async()=>{
 const {map,post,owner,guest,sent}=setup();
 const encoded=jpeg();
 assert.equal((await post({...guest,action:'save',image:encoded})).status,403);
 assert.equal((await post({...owner,action:'save',image:encoded})).status,200);
 assert.equal(sent.at(-1).type,'group-photo-updated');
 assert.equal((await post({...guest,action:'remove'})).status,403);
 assert.equal((await post({...owner,action:'remove'})).status,200);
 assert.equal(map.has('group:photo'),false);
 assert.equal((await post({...guest,action:'get'})).body.photo,null);
});
test('Ongeldige, niet-JPEG en te grote uploads worden geweigerd',async()=>{
 const {post,owner}=setup();
 for(const image of ['a',Buffer.alloc(150).toString('base64'),'X'.repeat(90001)]){
  const response=await post({...owner,action:'save',image});
  assert.equal(response.status,400);
 }
});

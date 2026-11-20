import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const html=readFileSync(new URL('public/index.html',root),'utf8');
const script=readFileSync(new URL('public/group-cloudflare.js',root),'utf8');
test('new group panel shows all three fields directly together',()=>{
 const st=html.indexOf('id="cf-group-create-panel"'),ed=html.indexOf('id="cf-group-join-panel"',st);
 assert.ok(st>=0&&ed>st,'create and join are separate sections');
 const fields=html.slice(st,ed);
 for(const id of ['cf-display-name','cf-new-name','cf-admin-code','cf-group-create','cf-create-status'])assert.match(fields,new RegExp('id="'+id+'"'));
 assert.ok(fields.indexOf('id="cf-display-name"')<fields.indexOf('id="cf-new-name"'));
 assert.ok(fields.indexOf('id="cf-new-name"')<fields.indexOf('id="cf-admin-code"'));
 assert.match(html.slice(st,ed),/Nieuwe groep aanmaken/);
 assert.match(html.slice(st,ed),/Groepsnaam/);
 assert.match(html.slice(st,ed),/Jouw naam/);
});
test('joining has its own name field and invite form',()=>{
 const join=html.slice(html.indexOf('id="cf-group-join-panel"'),html.indexOf('id="cf-group-active"'));
 for(const id of ['cf-join-name','cf-room-invite','cf-group-join','cf-join-status'])assert.match(join,new RegExp('id="'+id+'"'));
 assert.match(script,/memberName=cleanName\(\$\('cf-join-name'\)\.value\)/);
});
test('the failure is explained beside the create button and secret not stored',()=>{
 assert.match(script,/cf-create-status/);
 assert.match(script,/Groepsnaam/);
 assert.match(script,/GROUP_CREATE_SECRET/);
 assert.match(script,/\/api\/group\/diagnose/);
 assert.doesNotMatch(script,/localStorage\.setItem\([^\n]*adminCode/);
 assert.match(html,/Losse afspraak delen/);
});

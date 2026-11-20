import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import vm from 'node:vm';
const BASE=new URL('../',import.meta.url);
const load=f=>readFileSync(new URL(f,BASE),'utf8');
const html=load('public/index.html');
const sw=load('public/sw.js');
test('all core files exist and original logo/intro, SOS, piste map, day features remain',()=>{
 for(const f of ['public/group-cloudflare.js','public/group-cloudflare.css','public/backup-migration.js','public/route-engine.js','public/extra.js','public/sw.js','public/icons/icon-192.png','public/Kaart 2026-2027.png'])assert.ok(existsSync(new URL(f,BASE)),f);
 for(const id of ['skije-intro-sign','skije-header-lockup','open-sos','page-plan','page-map','page-webcams','page-day','checkpoint-main','group-section','cf-group-join','cf-share-position','cf-close','group-quick','cf-group-map'])assert.ok(html.includes(`id="${id}"`),id);
 assert.match(html,/brand-skije\.svg/);
 assert.match(html,/group-cloudflare\.js/);
});
test('legal protection chapter, visible version and first-use acknowledgement exist',()=>{
 for(const id of ['legal-section','legal-text','legal-gate','legal-accept-checkbox','legal-gate-enter'])assert.ok(html.includes(`id="${id}"`),id);
 assert.match(html,/Nederlands recht/);
 assert.match(html,/De gebruiker vrijwaart BenMu Development/);
 assert.match(html,/wettelijk toegestaan/);
 assert.match(html,/v4\.5\.0/);
 assert.match(sw,/v4-5-route-recovery/);
});
test('offline app files cached and private group API requests excluded from SW',()=>{
 assert.match(sw,/pathname\.startsWith\('\/api\/'\)/);
 assert.match(sw,/group-cloudflare\.js/);
 assert.match(sw,/backup-migration\.js/);
 assert.match(sw,/Kaart 2026-2027\.png/);
 assert.doesNotMatch(sw,/cache\.put\(.*api\/group/);
});
test('no actual API admin secret is shipped and pilot Cloudflare settings are in ZIP',()=>{
 const src=load('src/index.js'),cfg=load('wrangler.jsonc');
 assert.match(src,/GROUP_CREATE_SECRET/);
 assert.match(cfg,/new_sqlite_classes/);
 assert.match(cfg,/run_worker_first/);
 assert.doesNotMatch(src,/SCHERM-DEZE-CODE-GOED-AF-VOOR-TEST/);
});
test('backup restore remains local and admin secret is never bundled',()=>{
 const backup=load('public/backup-migration.js');
 assert.match(backup,/file\.text\(\)/);
 assert.match(backup,/localStorage\.setItem/);
 assert.doesNotMatch(backup,/fetch\(/);
 assert.match(html,/id="backup-import-button"/);
 assert.match(load('src/index.js'),/adminReady\(env\)/);
});
test('unverified network cannot be presented as a computed ski route',()=>{
 const sandbox={module:{exports:{}},globalThis:{}};
 vm.runInNewContext(load('public/route-engine.js'),sandbox);
 const engine=sandbox.module.exports;
 const r=engine.calculate({edges:[],start:'Ellmau',finish:'Scheffau',departure:'09:00',returnTime:'16:00'});
 assert.equal(r.ok,false);assert.equal(r.missingNetwork,true);
});

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';
import { chromium, devices } from 'playwright-core';
import { release } from '../src/release.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const scratch = await mkdtemp(join(tmpdir(), 'skije-update-'));
const photo = 'ski-intro-woman-action-01.webp';
const previousPhoto = 'ski-intro-woman-action-02.webp';
const digest = data => createHash('sha256').update(data).digest('hex');
const mime = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.png': 'image/png'
};
const [mainPhoto, oldPhoto] = await Promise.all(
  [photo, previousPhoto].map(name => readFile(join(root, 'public', name)))
);
const storage = {
  'skije-preview-v1': JSON.stringify({ style: 'relaxed', form: { start: 'Hopfgarten dalstation', finish: 'Hopfgarten dalstation', departure: '09:30' } }),
  'skije-extended-2026-v1': JSON.stringify({
    checkpoints: [{ id: 'synthetic', lat: 47.4, lng: 12.2, type: 'lift', createdAt: 1700000000000 }],
    days: [], issues: [], network: [], preferences: { power: 'auto', motion: false, hints: false }
  }),
  'skije-cloudflare-room-v1': JSON.stringify({ room: 'a'.repeat(32), name: 'Testgroep', memberName: 'Test',
    memberId: '0'.repeat(36), token: 'test-only' }),
  'skije-ui-language-v1': 'nl',
  'skije-legal-ack-v1': JSON.stringify({ version: '2026-11-20-v1' })
};

let served;
let serveStalePhoto = false;
let browser;
const requestTrace = [];
const server = createServer(async (request, response) => {
  try {
    let pathname = new URL(request.url, 'http://localhost').pathname;
    if (pathname === '/api/health') {
      response.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
      response.end(JSON.stringify(served.release));
      return;
    }
    if (pathname === '/index.html' || pathname === '/install.html') {
      response.writeHead(307, { location: pathname === '/index.html' ? '/' : '/install' }).end();
      return;
    }
    if (pathname === '/') pathname = '/index.html';
    if (pathname === '/install') pathname = '/install.html';
    const base = join(served.root, 'public');
    const file = resolve(base, '.' + decodeURIComponent(pathname));
    if (!file.startsWith(base + sep)) throw Error('Path outside the fixture');
    const bytes = serveStalePhoto && pathname === '/' + photo ? oldPhoto : await readFile(file);
    if(pathname==='/sw.js'||pathname==='/'+photo||pathname==='/index.html'||pathname==='/i18n-extra.js'||pathname==='/i18n-pdf.js')requestTrace.push({path:pathname,build:served.release.build,stale:serveStalePhoto,digest:digest(bytes).slice(0,16)});
    const type = extname(file);
    const headers = {
      'content-type': mime[type] || 'application/octet-stream',
      'cache-control': pathname === '/sw.js' ? 'no-cache' : 'public, max-age=86400'
    };
    if (type === '.html' && request.headers['accept-encoding']?.includes('gzip')) {
      const encoded = gzipSync(bytes);
      response.writeHead(200, { ...headers, 'content-encoding': 'gzip', 'content-length': encoded.length });
      response.end(encoded);
      return;
    }
    response.writeHead(200, headers);
    response.end(bytes);
  } catch {
    response.writeHead(404).end();
  }
});

async function checkBuild(page, build) {
  try{await page.waitForFunction(expected => window.SKIUpdate?.build === expected, build);}
  catch(error){
    const state=await page.evaluate(async()=>{
      const reg=await navigator.serviceWorker.getRegistration();
      return {meta:document.querySelector('meta[name="skije-build"]')?.content,api:window.SKIUpdate?.build,status:document.getElementById('app-update-status')?.textContent,button:document.getElementById('app-update-now')?.className,controller:navigator.serviceWorker.controller?.state,active:reg?.active?.state,installing:reg?.installing?.state,waiting:reg?.waiting?.state,caches:await caches.keys()};
    }).catch(()=>null);
    console.error('Update build diagnostic',JSON.stringify({expected:build,state,requests:requestTrace.slice(-35)}));
    throw error;
  }
}

function clickUpdate(page) {
  return page.evaluate(() => document.getElementById('app-update-now').click());
}

function savedData(page) {
  return page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])),
    Object.keys(storage));
}

async function photoDigest(page) {
  return page.evaluate(async name => {
    const response = await fetch(name);
    if (!response.ok) throw Error('Photo unavailable: ' + response.status);
    const hash = await crypto.subtle.digest('SHA-256', await response.arrayBuffer());
    return [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, '0')).join('');
  }, photo);
}

try {
  for (const path of ['public', 'src', 'scripts', 'package.json', 'wrangler.jsonc']) {
    await cp(join(root, path), join(scratch, path), { recursive: true });
  }
  await writeFile(join(scratch, 'public', photo), oldPhoto);
  execFileSync(process.execPath, ['scripts/build-release.mjs'], { cwd: scratch });
  const { release: previous } = await import(pathToFileURL(join(scratch, 'src/release.js')).href);
  assert.equal(previous.version, release.version);
  assert.notEqual(previous.build, release.build);
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const browserOptions = process.env.SKIJE_CHROMIUM
    ? { executablePath: process.env.SKIJE_CHROMIUM } : { channel: 'chrome' };
  browser = await chromium.launch(browserOptions);

  async function openInstalledApp(deployment) {
    served = deployment;
    const context = await browser.newContext({ ...devices['Pixel 7'], reducedMotion: 'reduce' });
    await context.addInitScript(values => {
      if (location.origin === 'null' || sessionStorage.getItem('test-seeded')) return;
      for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value);
      sessionStorage.setItem('test-seeded', '1');
    }, storage);
    const page = await context.newPage();
    page.on('pageerror',error=>console.error('Browser exception:',error.message));
    page.on('console',message=>{if(message.type()==='error'&&/integrity|service worker|failed to load resource/i.test(message.text()))console.log('Browser resource:',message.text().slice(0,300));});
    await page.goto(origin, { waitUntil: 'load' });
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    // The app normalizes saved settings on startup. Compare against the data
    // the old release actually stored, after that initialization finishes.
    const before = await savedData(page);
    assert.equal(JSON.parse(before['skije-preview-v1']).form.start, 'Hopfgarten dalstation');
    assert.equal(JSON.parse(before['skije-extended-2026-v1']).checkpoints[0].id, 'synthetic');
    return { page, context, before };
  }

  const { page, context, before } = await openInstalledApp({ root: scratch, release: previous });
  assert.equal(await photoDigest(page), digest(oldPhoto));
  await context.setOffline(true);
  await clickUpdate(page);
  assert.match(await page.locator('#app-update-status').textContent(), /Offline/);
  await context.setOffline(false);

  served = { root, release };
  serveStalePhoto = true;
  await clickUpdate(page);
  await page.waitForSelector('#app-update-now.is-failed', { state: 'attached', timeout: 40000 });
  await checkBuild(page, previous.build);
  assert.equal(await photoDigest(page), digest(oldPhoto));
  assert.deepEqual(await page.evaluate(() => caches.keys()), ['skije-shell-' + previous.build]);

  serveStalePhoto = false;
  await clickUpdate(page);
  await checkBuild(page, release.build);
  assert.equal(await photoDigest(page), digest(mainPhoto));
  assert.deepEqual(await savedData(page), before);
  await clickUpdate(page);
  await page.waitForSelector('#app-update-now.is-current', { state: 'attached' });

  await context.setOffline(true);
  await page.reload({ waitUntil: 'load' });
  await checkBuild(page, release.build);
  assert.equal(await photoDigest(page), digest(mainPhoto));
  assert.deepEqual(await savedData(page), before);
  await browser.close();
  console.log('PASS same-version upgrade, rejected stale bytes, retry, offline use and preserved user data');

  // The pre-#23 app can be supplied as a separate fixture checkout for migration verification.
  if (process.argv[2]) {
    browser = await chromium.launch(browserOptions);
    const old = { root: resolve(process.argv[2]), release: { version: '4.5.14-cf' } };
    const legacy = await openInstalledApp(old);
    assert.equal(await legacy.page.locator('.app-version').textContent(), 'v4.5.14');
    assert.equal(await legacy.page.evaluate(name => caches.match(name).then(Boolean), photo), false);
    await clickUpdate(legacy.page);
    await legacy.page.waitForSelector('#app-update-now.is-current', { state: 'attached' });
    served = { root, release };
    await clickUpdate(legacy.page);
    await checkBuild(legacy.page, release.build);
    assert.deepEqual(await savedData(legacy.page), legacy.before);
    await legacy.page.waitForFunction(build => caches.has('skije-shell-' + build), release.build);
    // Wait for the old upgrade to release its control. A legacy install may
    // temporarily need another service-worker activation after a reload.
    // The earlier scenario already checks the no-update path; here test that
    // at most two normal update attempts bring a migrated device current.
    let migrationResult;
    // A service worker activated across several historical releases can be
    // controlling the previous navigation. Reopening the app is a normal,
    // non-destructive recovery step (no storage reset or unregister).
    for(let attempt=0;attempt<3;attempt++){
      await legacy.page.waitForFunction(() => {
        const button=document.getElementById('app-update-now');
        return !!button && !button.disabled && button.getAttribute('aria-busy')!=='true';
      }, null, {timeout:25000});
      migrationResult=await legacy.page.evaluate(async()=>{
        await window.SKIUpdate.check();
        const reg=await navigator.serviceWorker.getRegistration();
        const controller=navigator.serviceWorker.controller;
        const messageBuild=await new Promise(resolve=>{
          if(!controller)return resolve(null);
          const channel=new MessageChannel();
          const timer=setTimeout(()=>{channel.port1.close();resolve('no-reply');},700);
          channel.port1.onmessage=ev=>{clearTimeout(timer);channel.port1.close();resolve(ev.data);};
          controller.postMessage({type:'SKIJE_GET_BUILD'},[channel.port2]);
        });
        return {
          current:document.getElementById('app-update-now').classList.contains('is-current'),
          status:document.getElementById('app-update-status').textContent,
          pageBuild:window.SKIUpdate.build,
          controller:!!controller,controllerState:controller?.state,
          activeState:reg?.active?.state,waitingState:reg?.waiting?.state,
          installingState:reg?.installing?.state,messageBuild,
          caches:await caches.keys()
        };
      });
      console.log('Legacy update attempt',attempt+1,JSON.stringify(migrationResult));
      if(migrationResult.current&&migrationResult.messageBuild===release.build)break;
      if(attempt<2){
        // The app's offline shell and deferred scripts, not optional remote
        // images/maps, determine whether a reopened installation is ready.
        // Keep the build, controlling-worker and stored-data assertions below.
        await legacy.page.reload({waitUntil:'domcontentloaded'});
        await checkBuild(legacy.page,release.build);
      }
    }
    assert.equal(migrationResult.current,true,'Migrated install could not confirm current build: '+JSON.stringify(migrationResult));
    assert.equal(migrationResult.pageBuild,release.build,'Legacy page must be the target build');
    assert.equal(migrationResult.messageBuild,release.build,'Legacy controlling worker must be the target build');
    assert.deepEqual(migrationResult.caches.filter(name=>name.startsWith('skije-shell-')),['skije-shell-'+release.build],'Only the new verified shell may remain');
    await legacy.context.setOffline(true);
    assert.equal(await photoDigest(legacy.page), digest(mainPhoto));
    assert.deepEqual(await savedData(legacy.page), legacy.before);
    console.log('PASS original 4.5.14 migrates to the new release without clearing user data');
  }
} finally {
  await browser?.close();
  server.close();
  await rm(scratch, { recursive: true, force: true });
}

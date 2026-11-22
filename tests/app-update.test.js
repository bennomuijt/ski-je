import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import worker from '../src/index.js';

const url = file => new URL('../' + file, import.meta.url);
const read = file => readFileSync(url(file), 'utf8');
const html = read('public/index.html');
const sw = read('public/sw.js');
const core = JSON.parse(sw.match(/^const CORE = (.+);$/m)[1]);

test('the page, service worker and uncached health endpoint identify the same build', async () => {
  const { version } = JSON.parse(read('package.json'));
  const response = await worker.fetch(new Request('https://ski-je.example/api/health'), {});
  const health = await response.json();
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(health.version, version + '-cf');
  assert.match(health.build, /^[a-f0-9]{24}$/);
  assert.ok(html.includes(`<meta name="skije-build" content="${health.build}">`));
  assert.ok(html.includes(`class="app-version">v${version}<`));
  assert.ok(sw.includes(`const BUILD = "${health.build}";`));
  assert.match(html, /id="app-update-now"/);
  assert.match(html, /id="check-update"/);
  assert.match(html, /app-update\.js\?v=(?!4514)/);
});

test('each of the ten active intro photos and the update script are pinned to their exact bytes', () => {
  const photos = html.match(/ski-intro-(?:woman|man)-(?:action|portrait)-\d+\.webp/g);
  assert.equal(new Set(photos).size, 10);
  assert.equal(photos.filter(photo => photo.startsWith('ski-intro-woman')).length, 6);
  for (const path of [...photos, 'app-update.js', 'index.html']) {
    const digest = createHash('sha256').update(readFileSync(url('public/' + path))).digest('base64');
    assert.equal(core['./' + path], 'sha256-' + digest);
  }
});

test('branding and PDF watermark remain available', () => {
  const manifest = read('public/manifest.webmanifest');
  for (const name of ['brand-skije.svg', 'icons/skije-logo-v455.svg', 'icons/icon-192-v455.png', 'icons/icon-512-v455.png']) {
    assert.ok(existsSync(url('public/' + name)));
    assert.ok(Object.hasOwn(core, './' + name));
  }
  assert.match(manifest, /skije-logo-v455\.svg/);
  assert.match(manifest, /icon-192-v455\.png/);
  assert.match(read('public/day-pdf.js'), /globalAlpha=0\.12/);
});

const build = 'a'.repeat(24);
const previousBuild = 'b'.repeat(24);

function openPage({ pageBuild = previousBuild, workerBuild = build, online = true, error } = {}) {
  const classes = new Set();
  const button = {
    id: 'app-update-now', classList: { add: name => classes.add(name), remove: name => classes.delete(name) },
    setAttribute() {}, removeAttribute() {}, addEventListener() {}
  };
  const status = {};
  let reloads = 0;
  const document = {
    getElementById: id => ({ 'app-update-now': button, 'app-update-status': status })[id],
    querySelector: selector => selector.startsWith('meta') ? { content: pageBuild } : { textContent: 'v4.5.15' }
  };
  const serviceWorker = {
    controller: { postMessage: (_, [port]) => port.postMessage(workerBuild) },
    getRegistration: async () => ({
      update: async () => {
        if (error) throw error;
      }
    })
  };
  const window = {};
  runInNewContext(read('public/app-update.js'), {
    document, window, navigator: { onLine: online, serviceWorker },
    MessageChannel, setTimeout, clearTimeout,
    location: { reload: () => reloads++ },
    fetch: async (url, options) => {
      assert.match(url, /^\/api\/health\?versioncheck=/);
      assert.equal(options.cache, 'no-store');
      return Response.json({ version: '4.5.15-cf', build });
    }
  });
  return { refresh: window.SKIUpdate.check, classes, status, reloads: () => reloads };
}

test('same-version update reloads after the matching worker takes control', async () => {
  const page = openPage();
  await page.refresh();
  assert.equal(page.reloads(), 1);
  assert.match(page.status.textContent, /geïnstalleerd/);
});

test('up-to-date, offline and worker-update failure are reported without reloading', async () => {
  for (const [options, state, message] of [
    [{ pageBuild: build }, 'current', /nieuwste/],
    [{ online: false }, 'failed', /Offline/],
    [{ error: new Error('update failed') }, 'failed', /nog niet gelukt/]
  ]) {
    const page = openPage(options);
    await page.refresh();
    assert.ok(page.classes.has('is-' + state));
    assert.match(page.status.textContent, message);
    assert.equal(page.reloads(), 0);
  }
});

test('the worker preserves the previous shell on failure and only removes obsolete app shells on success', async () => {
  const health = await (await worker.fetch(new Request('https://ski-je.example/api/health'), {})).json();
  const oldShell = 'skije-shell-old';
  const currentShell = 'skije-shell-' + health.build;
  const cacheNames = new Set([oldShell, 'unrelated-cache']);
  const handlers = {};
  let stale = true;
  let installed = false;
  let active = false;

  runInNewContext(sw, {
    Request, URL,
    self: {
      location: new URL('https://ski-je.example/sw.js'),
      addEventListener: (type, handler) => { handlers[type] = handler; },
      skipWaiting: async () => { installed = true; },
      clients: { claim: async () => { active = true; } }
    },
    caches: {
      open: async name => {
        cacheNames.add(name);
        return {
          addAll: async requests => {
            const photo = requests.find(request => request.url.endsWith('ski-intro-woman-action-01.webp'));
            assert.equal(photo.cache, 'no-store');
            assert.equal(photo.integrity, core['./ski-intro-woman-action-01.webp']);
            if (stale) throw new Error('Bad integrity');
          }
        };
      },
      delete: async name => cacheNames.delete(name),
      keys: async () => [...cacheNames]
    }
  });

  function dispatch(type) {
    return new Promise((resolve, reject) => handlers[type]({
      waitUntil: result => result.then(resolve, reject)
    }));
  }

  await assert.rejects(dispatch('install'), /Bad integrity/);
  assert.equal(installed, false);
  assert.deepEqual([...cacheNames], [oldShell, 'unrelated-cache']);
  stale = false;
  await dispatch('install');
  assert.ok(installed);
  assert.ok(cacheNames.has(oldShell));
  await dispatch('activate');
  assert.ok(active);
  assert.deepEqual([...cacheNames], ['unrelated-cache', currentShell]);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = name => readFileSync(new URL('../public/' + name, import.meta.url), 'utf8');

test('waiting service worker only accepts activation for its own build', async () => {
  const workerSource = source('sw.js');
  const build = workerSource.match(/^const BUILD = "([a-f0-9]+)";$/m)[1];
  const handlers = new Map();
  let skips = 0;
  runInNewContext(workerSource, {
    URL, self: {
      location: { href: 'https://skije.example/sw.js' },
      addEventListener: (name, fn) => handlers.set(name, fn),
      skipWaiting: async () => { skips++; }
    }
  });
  let lifetime;
  const send = data => handlers.get('message')({
    data, ports: [], waitUntil: promise => { lifetime = promise; }
  });
  send({ type: 'SKIJE_ACTIVATE_BUILD', build: 'wrong-build' });
  assert.equal(skips, 0);
  assert.equal(lifetime, undefined);
  send({ type: 'SKIJE_ACTIVATE_BUILD', build });
  await lifetime;
  assert.equal(skips, 1);
});

test('update requests activation of the waiting build and reloads only after it controls the page', async () => {
  const build = 'a'.repeat(24);
  const oldBuild = 'b'.repeat(24);
  const makeWorker = id => ({
    postMessage(message, ports) {
      assert.equal(message.type, 'SKIJE_GET_BUILD');
      ports[0].postMessage(id);
    }
  });
  class FakeMessageChannel {
    constructor() {
      this.port1 = { close() {} };
      this.port2 = { postMessage: data => this.port1.onmessage({ data }) };
    }
  }
  const newWorker = makeWorker(build);
  const oldWorker = makeWorker(oldBuild);
  let requests = 0;
  let reloads = 0;
  const registration = {
    update: async () => {},
    waiting: {
      postMessage(message) {
        assert.equal(message.type, 'SKIJE_ACTIVATE_BUILD');
        assert.equal(message.build, build);
        assert.equal(reloads, 0);
        requests++;
        serviceWorker.controller = newWorker;
        registration.waiting = null;
      }
    }
  };
  const serviceWorker = {
    controller: oldWorker,
    getRegistration: async () => registration
  };
  const button = {
    id: 'app-update-now', classList: { add() {}, remove() {} },
    addEventListener() {}, setAttribute() {}, removeAttribute() {}
  };
  const window = {};
  runInNewContext(source('app-update.js'), {
    window, MessageChannel: FakeMessageChannel, setTimeout, clearTimeout,
    document: {
      getElementById: id => id === button.id ? button : null,
      querySelector: selector => selector.includes('meta') ? { content: oldBuild } : null
    },
    navigator: { onLine: true, serviceWorker },
    fetch: async () => ({ ok: true, json: async () => ({ build, version: '4.5.25-cf' }) }),
    location: { reload() { assert.equal(serviceWorker.controller, newWorker); reloads++; } }
  });
  await window.SKIUpdate.check();
  assert.equal(requests, 1);
  assert.equal(reloads, 1);
});

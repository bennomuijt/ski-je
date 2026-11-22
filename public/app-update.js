/* Compare the server build with the open page and the controlling worker. */
(() => {
  'use strict';
  const buttons = ['app-update-now', 'check-update'].map(id => document.getElementById(id)).filter(Boolean);
  const status = document.getElementById('app-update-status');
  const pageBuild = document.querySelector('meta[name="skije-build"]')?.content;
  const version = document.querySelector('.app-version')?.textContent?.trim();
  let busy = false;

  function show(state, message) {
    for (const button of buttons) {
      button.classList.remove('is-updating', 'is-current', 'is-failed');
      button.classList.add('is-' + state);
      if (button.id === 'app-update-now') {
        button.textContent = { updating: '⏳ Controleren…', current: '✓ Bijgewerkt', failed: '⚠ Opnieuw' }[state];
      }
    }
    if (status) status.textContent = message;
  }

  async function withTimeout(promise, ms) {
    let timer;
    try {
      return await Promise.race([
        promise,
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('timeout')), ms); })
      ]);
    } finally {
      clearTimeout(timer);
    }
  }

  async function controllerHasBuild(serviceWorker, build) {
    const controller = serviceWorker.controller;
    if (!controller) return false;
    const channel = new MessageChannel();
    try {
      const reply = new Promise(resolve => {
        channel.port1.onmessage = event => resolve(event.data);
        controller.postMessage({ type: 'SKIJE_GET_BUILD' }, [channel.port2]);
      });
      return await withTimeout(reply, 500) === build && serviceWorker.controller === controller;
    } catch {
      return false;
    } finally {
      channel.port1.close();
    }
  }

  async function installBuild(serviceWorker, build) {
    const registration = await withTimeout(serviceWorker.getRegistration(), 5000);
    if (registration) {
      await withTimeout(registration.update(), 12000);
    } else {
      await withTimeout(serviceWorker.register('./sw.js', { updateViaCache: 'none' }), 12000);
    }
    // update() can finish before install and activation do. An older worker
    // may also take control first, so wait for the specific server build.
    const deadline = Date.now() + 20000;
    do {
      if (await controllerHasBuild(serviceWorker, build)) return;
      await new Promise(resolve => setTimeout(resolve, 250));
    } while (Date.now() < deadline);
    throw new Error('The requested build did not take control');
  }

  async function refresh() {
    if (busy) return;
    if (!navigator.onLine) {
      show('failed', 'Offline. Maak verbinding met internet om SKI-je bij te werken.');
      return;
    }
    busy = true;
    for (const button of buttons) {
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
    }
    show('updating', 'Controleren op nieuwe appbestanden…');
    try {
      const response = await withTimeout(fetch('/api/health?versioncheck=' + Date.now(), {
        cache: 'no-store', headers: { Accept: 'application/json' }
      }), 10000);
      const data = response.ok ? await withTimeout(response.json(), 5000) : {};
      if (!/^[a-f0-9]{24}$/.test(data.build) || !data.version || !navigator.serviceWorker) {
        throw new Error('Missing release metadata or service worker support');
      }
      await installBuild(navigator.serviceWorker, data.build);
      if (pageBuild === data.build) {
        show('current', 'Je gebruikt de nieuwste SKI-je-build (' + data.version + ').');
        return;
      }
      show('updating', 'Nieuwe appbestanden geïnstalleerd. SKI-je wordt vernieuwd…');
      location.reload();
    } catch {
      show('failed', 'Bijwerken is nog niet gelukt. Controleer je internetverbinding en probeer opnieuw.');
    } finally {
      busy = false;
      for (const button of buttons) {
        button.disabled = false;
        button.removeAttribute('aria-busy');
      }
    }
  }

  buttons.forEach(button => button.addEventListener('click', refresh));
  window.SKIUpdate = { version, build: pageBuild, check: refresh };
})();

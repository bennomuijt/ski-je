from playwright.sync_api import sync_playwright
from pathlib import Path
import re,json
P=Path('/mnt/data/SKI-je-Cloudflare-compleet')
html=(P/'public/index.html').read_text()
html=re.sub(r'<script src="(?:route-engine|extra|group-cloudflare|backup-migration)\.js" defer></script>','',html)
html=html.replace('<link rel="stylesheet" href="extra.css">','').replace('<link rel="stylesheet" href="group-cloudflare.css">','')
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for w,h in [(320,700),(375,812),(832,384)]:
        page=browser.new_page(viewport={'width':w,'height':h},device_scale_factor=1)
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_content(html,wait_until='domcontentloaded',timeout=20000)
        page.add_style_tag(content=(P/'public/extra.css').read_text())
        page.add_style_tag(content=(P/'public/group-cloudflare.css').read_text())
        page.add_script_tag(content=(P/'public/route-engine.js').read_text())
        page.add_script_tag(content=(P/'public/extra.js').read_text())
        page.add_script_tag(content=(P/'public/group-cloudflare.js').read_text())
        page.add_script_tag(content=(P/'public/backup-migration.js').read_text())
        if page.locator('#ski-intro-skip').is_visible():page.locator('#ski-intro-skip').click()
        page.locator('#group-quick').click()
        page.wait_for_timeout(350)
        # about:blank in the isolated browser harness disallows localStorage; this is not a real HTTPS-app error.
        page.evaluate("document.getElementById('skije-toast')?.remove()")
        assert page.locator('#group-section').evaluate('(x)=>x.open')
        assert page.locator('#cf-group-before').is_visible()
        dims=page.evaluate('({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth})')
        png=P/'tests'/f'cloudflare-mobiel-{w}.png'
        page.screenshot(path=str(png))
        print(json.dumps({'w':w,'errors':errors,'dims':dims,'file':png.name},ensure_ascii=False))
        assert not errors
        assert dims['scroll']<=dims['width']+2
        page.close()
    browser.close()

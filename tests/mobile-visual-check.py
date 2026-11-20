from playwright.sync_api import sync_playwright
from pathlib import Path
import json
P=Path('/mnt/data/SKI-je-Cloudflare-compleet/tests')
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'])
    for w,h in [(375,812),(320,690),(832,384)]:
        page=browser.new_page(viewport={'width':w,'height':h},device_scale_factor=1,is_mobile=w<500,has_touch=w<500)
        errors=[];external=[]
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('request',lambda req: external.append(req.url) if not req.url.startswith('http://127.0.0.1:8765') else None)
        page.route('https://**/*',lambda route: route.abort())
        page.goto('file:///mnt/data/SKI-je-Cloudflare-compleet/public/index.html',wait_until='domcontentloaded',timeout=15000)
        page.wait_for_timeout(800)
        if page.locator('#ski-intro-skip').is_visible(): page.locator('#ski-intro-skip').click()
        page.locator('#group-quick').click()
        page.wait_for_timeout(800)
        assert page.locator('#group-section').evaluate('(el)=>el.open'), 'Group panel not expanded'
        assert page.locator('#cf-group-before').is_visible()
        assert page.locator('#cf-display-name').is_visible()
        assert page.locator('#cf-group-join').is_visible()
        dims=page.evaluate('({scroll:document.documentElement.scrollWidth,width:document.documentElement.clientWidth,errors:[]})')
        page.screenshot(path=str(P/f'cloudflare-group-{w}.png'),full_page=False)
        print(json.dumps({'width':w,'screenshot':f'cloudflare-group-{w}.png','page_errors':errors,'external_requests':len(external),'dimensions':dims},ensure_ascii=False))
        assert not errors, f'JS error {errors}'
        assert dims['scroll']<=dims['width']+2, f'horizontal overflow {dims}'
        page.close()
    browser.close()

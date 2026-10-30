/* Simulates the iPhone Home Screen quirk: page laid out 64px shorter than the screen. The tab bar must reach the screen bottom. */
const { chromium } = require('playwright');
let fails = 0; const ok = (c, m) => { if (c) console.log('PASS', m); else { fails++; console.log('FAIL', m); } };
(async () => {
  const b = await chromium.launch();
  const run = async (label, viewportH, screenH, standalone) => {
    const ctx = await b.newContext({ viewport: { width: 440, height: viewportH }, screen: { width: 440, height: screenH }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    if (standalone) await ctx.addInitScript(() => Object.defineProperty(navigator, 'standalone', { value: true }));
    const page = await ctx.newPage();
    await page.goto('http://localhost:8765/index.html'); await page.waitForSelector('.welcome');
    await page.click('text=Try demo mode'); await page.waitForSelector('.nav'); await page.waitForTimeout(500);
    const r = await page.evaluate(() => ({ nav: Math.round(document.querySelector('.nav').getBoundingClientRect().bottom), app: Math.round(document.querySelector('.app').getBoundingClientRect().height), fit: document.documentElement.classList.contains('fit'), sh: screen.height, ch: document.documentElement.clientHeight }));
    await ctx.close(); return r;
  };
  let r = await run('short page, installed app', 892, 956, true);
  ok(r.fit && r.nav === 956 && r.app === 956, 'short layout is stretched to full screen: ' + JSON.stringify(r));
  r = await run('correct page, installed app', 956, 956, true);
  ok(!r.fit && r.nav === 956, 'already-correct layout is left alone: ' + JSON.stringify(r));
  r = await run('short page in a Safari tab', 892, 956, false);
  ok(!r.fit && r.nav === 892, 'normal browser tab is never stretched: ' + JSON.stringify(r));
  await b.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASSED'); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });

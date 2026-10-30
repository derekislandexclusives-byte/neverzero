/* Simulates an iPhone Home Screen app given less height than the screen (64px short).
   The tab bar must sit flush at the bottom of the visible space, without extra safe-area padding. */
const { chromium } = require('playwright');
let fails = 0; const ok = (c, m) => { if (c) console.log('PASS', m); else { fails++; console.log('FAIL', m); } };
(async () => {
  const b = await chromium.launch();
  const run = async (viewportH, screenH, standalone) => {
    const ctx = await b.newContext({ viewport: { width: 440, height: viewportH }, screen: { width: 440, height: screenH }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    if (standalone) await ctx.addInitScript(() => Object.defineProperty(navigator, 'standalone', { value: true }));
    const page = await ctx.newPage();
    await page.goto('http://localhost:8765/index.html'); await page.waitForSelector('.welcome');
    await page.click('text=Try demo mode'); await page.waitForSelector('.nav'); await page.waitForTimeout(500);
    const r = await page.evaluate(() => { const n = document.querySelector('.nav'); const b = n.getBoundingClientRect(); return { navBottom: Math.round(b.bottom), navH: Math.round(b.height), pad: getComputedStyle(n).paddingBottom, short: document.documentElement.classList.contains('short'), vh: innerHeight }; });
    await ctx.close(); return r;
  };
  let r = await run(892, 956, true);
  ok(r.short && r.navBottom === r.vh && r.pad === '4px', 'short installed app: tab bar flush at bottom with 4px padding ' + JSON.stringify(r));
  r = await run(956, 956, true);
  ok(!r.short, 'full-height installed app is left alone ' + JSON.stringify(r));
  r = await run(892, 956, false);
  ok(!r.short, 'normal browser tab is left alone ' + JSON.stringify(r));
  await b.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASSED'); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });

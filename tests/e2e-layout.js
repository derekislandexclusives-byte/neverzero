/* Every screen at six phone widths with the real self-hosted fonts: no overflow, centered, nothing clipped sideways. */
const { chromium } = require('playwright');
const path = require('path');
const OUT = path.resolve(__dirname, '../build');
let fails = 0; const ok = (c, m) => { if (c) pass++; else { fails++; console.log('FAIL', m); } }; let pass = 0;
const WIDTHS = [320, 360, 375, 390, 414, 430];
(async () => {
  const b = await chromium.launch();
  for (const w of WIDTHS) {
    const ctx = await b.newContext({ viewport: { width: w, height: 800 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, timezoneId: 'Pacific/Honolulu' });
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', (e) => errs.push(e.message));
    await page.goto('http://localhost:8765/index.html'); await page.waitForSelector('.welcome');
    await page.evaluate(() => document.fonts.ready);
    const fontsOk = await page.evaluate(() => document.fonts.check('800 20px "Barlow Condensed"') && document.fonts.check('700 16px Barlow'));
    ok(fontsOk, w + ': real fonts loaded');
    const check = async (label) => {
      await page.waitForTimeout(260);
      const r = await page.evaluate(() => {
        const vw = window.innerWidth; const bad = [];
        document.querySelectorAll('body *').forEach((el) => {
          const cs = getComputedStyle(el); if (cs.position === 'fixed' || cs.display === 'none') return;
          const b = el.getBoundingClientRect(); if (!b.width) return;
          if (b.right > vw + 0.5 || b.left < -0.5) bad.push((el.className && el.className.baseVal === undefined ? el.className : el.tagName) + ' ' + Math.round(b.left) + '..' + Math.round(b.right));
        });
        const app = document.querySelector('.app').getBoundingClientRect();
        const scr = document.querySelector('.screen');
        return { bad: bad.slice(0, 4), sw: document.documentElement.scrollWidth, vw, centered: Math.abs(app.left - (vw - app.width) / 2) < 1, screenSW: scr ? scr.scrollWidth - scr.clientWidth : 0 };
      });
      ok(r.bad.length === 0 && r.sw <= r.vw && r.centered && r.screenSW <= 0, w + 'px ' + label + ': ' + JSON.stringify(r));
    };
    await check('welcome');
    await page.click('text=Try demo mode'); await page.waitForSelector('.scores'); await check('today');
    if (w === 320 || w === 430) await page.screenshot({ path: `${OUT}/layout-${w}-today.png` });
    await page.locator('.hc').nth(0).locator('.opt.min').click(); await check('checkpoint popup'); await page.click('.sheet .icon-btn');
    await page.click('.nav >> text=Progress'); await check('progress week');
    await page.click('.seg >> text=Month'); await check('progress month');
    await page.click('.nav >> text=History'); await check('history');
    await page.click('.nav >> text=Habits'); await check('habits');
    await page.click('text=New habit'); await check('habit form');
    if (w === 320) await page.screenshot({ path: `${OUT}/layout-320-form.png` });
    await page.click('.sheet .icon-btn');
    ok(errs.length === 0, w + ': no page errors ' + errs.join('|'));
    await ctx.close();
  }
  await b.close();
  console.log(pass + ' checks passed' + (fails ? ', ' + fails + ' FAILED' : ', none failed'));
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });

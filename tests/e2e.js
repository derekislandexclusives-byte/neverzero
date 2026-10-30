const { chromium } = require('playwright');
const path = require('path');
const PWA = !!process.env.PWA;
const URL = PWA ? 'http://localhost:8765/index.html' : 'file://' + path.resolve(__dirname, '../build/test.html');
const MOCK = `
(() => {
  const KEY = 'mock_claude_db';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } };
  const save = (o) => localStorage.setItem(KEY, JSON.stringify(o));
  window.__saves = 0;
  window.claude = { use: async (n) => {
    if (n === 'user') return { id: async () => 'u_test' };
    if (n === 'downloads') return { save: async (r) => { window.__download = r; return { status: 'saved' }; } };
    if (n === 'db') return { doc: (p) => ({
      get: async () => { const o = load(); return { exists: p in o, data: () => o[p] }; },
      set: async (d) => { const o = load(); o[p] = JSON.parse(JSON.stringify(d)); save(o); window.__saves++; }
    }) };
    return null;
  } };
})();`;
const fmtD = (d) => d.toLocaleDateString('en-US', { timeZone: 'Pacific/Honolulu', weekday: 'long', month: 'long', day: 'numeric' });
const NOW = new Date(); const TODAY_L = fmtD(NOW), YEST_L = fmtD(new Date(+NOW - 864e5)), TOM_L = fmtD(new Date(+NOW + 864e5));
let fails = 0;
const ok = (c, m) => { if (c) console.log('PASS', m); else { fails++; console.log('FAIL', m); } };
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, timezoneId: 'Pacific/Honolulu' });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  if (!PWA) await ctx.addInitScript(MOCK);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  const txt = async (sel) => (await page.locator(sel).first().innerText()).replace(/\s+/g, ' ').trim();
  const overflow = async (label) => {
    const r = await page.evaluate(() => {
      const w = window.innerWidth; let worst = 0, who = '';
      document.querySelectorAll('.app *').forEach((el) => { const b = el.getBoundingClientRect(); if (b.width && b.right > w + 0.5 && getComputedStyle(el).position !== 'fixed') { if (b.right - w > worst) { worst = b.right - w; who = el.className || el.tagName; } } });
      return { sw: document.documentElement.scrollWidth, w, worst, who };
    });
    ok(r.sw <= r.w && r.worst === 0, label + ' fits width (scrollWidth ' + r.sw + '/' + r.w + (r.worst ? ', overflow by ' + r.worst + ' from ' + r.who : '') + ')');
  };
  const shot = (n) => page.screenshot({ path: path.resolve(__dirname, '../build') + '/shot-' + n + '.png' });

  await page.goto(URL); await page.waitForSelector('.welcome');
  ok((await txt('.welcome')).includes('CREATE YOUR FIRST HABIT'), 'welcome screen on first launch');
  ok(await page.locator('.nav').count() === 0, 'no nav on welcome');
  await overflow('welcome'); await shot('1-welcome');

  await page.click('text=Try demo mode');
  await page.waitForSelector('.scores');
  ok((await txt('.score:nth-child(1)')).includes('56%'), 'demo performance 56%');
  ok((await txt('.score:nth-child(2)')).includes('75%') && (await txt('.score:nth-child(2)')).includes('3/4'), 'demo consistency 75% and 3/4');
  ok((await txt('.demo-bar')).includes('DEMO'), 'demo banner visible');
  await overflow('today'); await shot('2-today');
  const firstCardBottom = await page.evaluate(() => { const c = document.querySelectorAll('.hc'); return [...c].map((x) => Math.round(x.getBoundingClientRect().bottom)); });
  console.log('card bottoms', firstCardBottom, 'nav top', await page.evaluate(() => Math.round(document.querySelector('.nav').getBoundingClientRect().top)));
  const visible = firstCardBottom.filter((b) => b <= 844 - 70).length;
  ok(visible >= 2, visible + ' habit cards fully visible without scrolling');

  // ---- Minimum checkpoint popup
  const reading = page.locator('.hc').nth(1), biz = page.locator('.hc').nth(2);
  await reading.locator('.opt.min').click();
  ok((await txt('.sheet')).toLowerCase().includes('taking the easy way out?'), 'popup asks "Taking the easy way out?" when choosing Minimum');
  ok((await txt('.sheet')).includes('Read 20 pages'), 'popup reminds you of the Main goal');
  await page.waitForTimeout(450); await shot('2b-checkpoint');
  await page.click('.sheet .icon-btn');
  ok((await reading.locator('.opt.main.on').count()) === 1, 'closing the popup changes nothing');
  await reading.locator('.opt.min').click(); await page.click('.sheet .btn.lime');
  ok((await reading.locator('.opt.main.on').count()) === 1 && (await page.locator('.sheet').count()) === 0, 'Keep Main from Main leaves it at Main');
  await biz.locator('.opt.min').click();
  ok((await page.locator('.sheet').count()) === 0 && (await biz.locator('.opt.min.on').count()) === 0, 'tapping selected Minimum clears it with no popup');
  await biz.locator('.opt.min').click(); await page.click('.sheet .btn.blue');
  ok((await biz.locator('.opt.min.on').count()) === 1, 'confirming Minimum records it');
  await reading.locator('.opt.min').click(); await page.click('.sheet .btn.blue');
  ok((await reading.locator('.opt.min.on').count()) === 1 && (await txt('.score:nth-child(1)')).includes('38%'), 'Main -> Minimum via popup lowers score (150/4 = 38%)');
  await reading.locator('.opt.main').click();
  ok((await txt('.score:nth-child(1)')).includes('56%'), 'back to Main restores 56%');

  const nut = page.locator('.hc').nth(3);
  await nut.locator('.opt.main').click();
  ok((await txt('.score:nth-child(1)')).includes('81%') && (await txt('.score:nth-child(2)')).includes('100%'), 'Nutrition Main -> 81% / 100%');
  await nut.locator('.opt.main').click();
  ok((await txt('.score:nth-child(1)')).includes('56%') && (await txt('.score:nth-child(2)')).includes('75%'), 'tap Main again clears -> 56% / 75%');
  await nut.locator('.opt.min').click(); await page.click('.sheet .btn.blue');
  ok((await txt('.score:nth-child(1)')).includes('63%'), 'Nutrition Minimum -> 63%');
  await nut.locator('.opt.main').click();
  ok((await nut.locator('.opt.main.on').count()) === 1 && (await nut.locator('.opt.min.on').count()) === 0, 'switch Minimum -> Main directly');
  ok(await page.locator('.pf-wrap').count() === 0, 'no celebration yet');
  await page.locator('.hc').nth(2).locator('.opt.main').click();   // biz min -> main = perfect
  ok((await txt('.score:nth-child(1)')).includes('100%'), 'all Main -> 100%');
  ok(await page.locator('.pf-wrap').count() === 1, 'perfect day toast shown');
  await shot('3-perfect');
  await page.waitForTimeout(2900);
  ok(await page.locator('.pf-wrap').count() === 0, 'toast auto-dismisses');
  await page.locator('.hc').nth(2).locator('.opt.main').click();    // clear
  await page.locator('.hc').nth(2).locator('.opt.main').click();    // back to 100
  ok(await page.locator('.pf-wrap').count() === 0, 'celebration does not replay the same day');

  await page.click('.nav >> text=Progress'); await page.waitForSelector('.chart');
  await overflow('progress week'); await shot('4-progress-week');
  ok((await txt('.avg')).toLowerCase().includes('avg performance'), 'progress shows averages');
  await page.click('.seg >> text=Month'); await page.waitForTimeout(450);
  await overflow('progress month'); await shot('5-progress-month');
  await page.click('.nav >> text=History'); await page.waitForSelector('.cal');
  await overflow('history'); await shot('6-history');
  const todayLabel = await page.evaluate(() => document.querySelector('.cell.today').getAttribute('aria-label'));
  console.log('today cell:', todayLabel);
  ok(todayLabel.includes(TODAY_L), 'calendar today follows Honolulu local date');
  // pick yesterday (Oct 28) and edit
  await page.click('.cell[aria-label^="' + YEST_L + '"]');
  const before = await txt('.avg');
  await page.locator('.hc').first().locator('.opt.min').click(); await page.click('.sheet .btn.blue');
  const after = await txt('.avg');
  console.log('before/after', before, '|', after);
  ok(before !== after, 'editing a past day changes its score');
  await page.click('.cell[aria-label^="' + TOM_L + '"]');
  ok((await txt('.screen')).includes('has not happened yet'), 'future day has no fabricated score');
  await page.click('.nav >> text=Today');
  ok((await txt('.score:nth-child(1)')).includes('100%'), 'state kept across tabs');
  await page.click('.nav >> text=Habits'); await page.waitForSelector('.hrow');
  await overflow('habits'); await shot('7-habits');
  await page.click('.demo-bar button');
  await page.waitForSelector('.welcome');
  ok(true, 'exit demo returns to welcome (real data untouched)');

  // ---- real data
  await page.click('text=CREATE YOUR FIRST HABIT');
  await page.click('.sheet button[type=submit]');
  ok((await page.locator('.err').count()) === 3, 'required-field errors shown');
  await page.fill('#f-name', 'Gym Workout'); await page.fill('#f-main', 'Complete a 60-minute workout'); await page.fill('#f-min', 'Complete 50 push-ups');
  await page.click('.chip >> text=Fitness');
  await shot('8-form');
  await page.click('.sheet button[type=submit]');
  await page.waitForSelector('.hc');
  ok((await txt('.score:nth-child(1)')).includes('0%'), 'new habit starts at 0%');
  await page.locator('.hc .opt.min').click(); await page.click('.sheet .btn.blue');
  ok((await txt('.score:nth-child(1)')).includes('25%') && (await txt('.score:nth-child(2)')).includes('100%'), 'real: Minimum -> 25% perf, 100% consistency');
  await page.waitForTimeout(700);
  if (!PWA) ok(await page.evaluate(() => window.__saves) >= 1, 'save written to storage');
  ok((await txt('.chip-s')).includes('Saved'), 'status shows Saved after confirmed write');

  // second + third habit, reorder
  for (const n of ['Reading', 'Nutrition']) {
    await page.click('.nav >> text=Habits'); await page.click('text=New habit');
    await page.fill('#f-name', n); await page.fill('#f-main', n + ' main'); await page.fill('#f-min', n + ' min'); await page.fill('#f-cat', 'Custom Cat');
    await page.click('.sheet button[type=submit]');
  }
  const order = async () => page.locator('.hrow:not(.arch) .hc-name').allInnerTexts();
  ok(JSON.stringify(await order()) === JSON.stringify(['Gym Workout', 'Reading', 'Nutrition']), 'habits in creation order');
  await page.locator('[aria-label="Move Nutrition up"]').click();
  ok(JSON.stringify(await order()) === JSON.stringify(['Gym Workout', 'Nutrition', 'Reading']), 'move up works');
  await page.waitForTimeout(700);

  // reload -> persistence
  await page.reload(); await page.waitForSelector('.nav');
  await page.click('.nav >> text=Habits');
  ok(JSON.stringify(await order()) === JSON.stringify(['Gym Workout', 'Nutrition', 'Reading']), 'order persisted after reload');
  await page.click('.nav >> text=Today');
  ok((await page.locator('.hc').count()) === 3 && (await page.locator('.hc').first().locator('.opt.min.on').count()) === 1, 'check-in persisted after reload');

  // archive and restore
  await page.click('.nav >> text=Habits');
  await page.locator('.hrow').nth(2).locator('text=Archive').click();
  await page.click('.sheet .btn.danger');
  ok((await page.locator('.hrow:not(.arch)').count()) === 2, 'archive removes from active list');
  await page.click('.fold'); ok((await page.locator('.hrow.arch').count()) === 1, 'archived section shows it');
  await page.click('.nav >> text=Today'); ok((await page.locator('.hc').count()) === 2, 'archived habit leaves today checklist');
  await page.click('.nav >> text=Habits'); await page.click('.fold'); await page.locator('.hrow.arch >> text=Restore').click();
  ok((await page.locator('.hrow:not(.arch)').count()) === 3, 'restore brings it back');
  // edit
  await page.locator('.hrow').first().locator('text=Edit').click();
  await page.fill('#f-name', 'Gym Session'); await page.click('.sheet button[type=submit]');
  ok((await order())[0] === 'Gym Session', 'edit renames habit');

  // export / import
  await page.click('text=Back up (JSON)');
  const json = await page.locator('textarea[aria-label="Backup JSON"]').inputValue();
  ok(json.includes('Gym Session') && json.includes('"schemaVersion": 1'), 'export contains data + schema version');
  if (!PWA) { await page.click('text=Download file'); await page.waitForTimeout(100);
  ok(await page.evaluate(() => window.__download && window.__download.filename.endsWith('.json')), 'download capability called with .json'); }
  else ok((await page.locator('text=Save file').count()) === 1, 'PWA shows Save file button');
  await page.click('.sheet .icon-btn');
  await page.click('text=Restore backup');
  await page.fill('textarea[aria-label="Backup JSON to import"]', 'garbage'); await page.click('text=Check backup');
  ok((await page.locator('.err').count()) === 1, 'invalid import rejected with message');
  await page.fill('textarea[aria-label="Backup JSON to import"]', json.replace('Gym Session', 'Imported Gym')); await page.click('text=Check backup');
  ok((await txt('.warn')).includes('replaces your current data'), 'import asks for confirmation before replacing');
  await shot('9-import');
  await page.click('text=Replace my data');
  await page.click('.nav >> text=Habits');
  ok((await order())[0] === 'Imported Gym', 'import replaced data after confirmation');

  // reset needs two confirmations
  await page.click('text=Reset all data'); await page.click('.sheet .btn.danger');
  ok((await txt('.sheet')).toLowerCase().includes('really erase'), 'reset asks twice');
  await page.click('.sheet .btn.danger');
  await page.waitForSelector('.welcome');
  ok(true, 'reset returns to welcome');
  ok(errors.length === 0, 'no console errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await browser.close();
  console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });

/* Generates icons, iOS splash screens and the share preview image into assets/. Run: node tools/make-assets.js */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const mark = JSON.parse(fs.readFileSync(ROOT + '/src/mark.json', 'utf8'));
const BG = '#090F15', LIME = '#A3FF36';
const markSvg = (w) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${Math.round(w * mark.h / mark.w)}" viewBox="0 0 ${mark.w} ${mark.h}"><path d="${mark.d}" fill="${LIME}" fill-rule="evenodd"/></svg>`;
const fontCss = `
@font-face{font-family:'BC';font-weight:800;font-style:italic;src:url(file://${ROOT}/assets/fonts/barlow-condensed-latin-800-italic.woff2)}
@font-face{font-family:'B';font-weight:500;src:url(file://${ROOT}/assets/fonts/barlow-latin-500-normal.woff2)}`;
const SPLASH = [[430, 932, 3], [428, 926, 3], [393, 852, 3], [390, 844, 3], [375, 812, 3], [414, 896, 3], [414, 896, 2], [375, 667, 2], [402, 874, 3], [440, 956, 3]];

(async () => {
  const b = await chromium.launch();
  const shot = async (html, w, h, dpr, out) => {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
    const p = await ctx.newPage();
    const f = path.join(ROOT, 'tools', '_tmp.html');
    fs.writeFileSync(f, html);
    await p.goto('file://' + f);
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(150);
    await p.screenshot({ path: out });
    await ctx.close();
  };
  const iconHtml = (size, markW) => `<body style="margin:0;background:${BG};width:${size}px;height:${size}px;display:grid;place-items:center">${markSvg(markW)}</body>`;
  await shot(iconHtml(512, 392), 512, 512, 1, ROOT + '/assets/icon-512.png');
  await shot(iconHtml(192, 147), 192, 192, 1, ROOT + '/assets/icon-192.png');
  await shot(iconHtml(180, 138), 180, 180, 1, ROOT + '/assets/apple-touch-icon.png');
  await shot(iconHtml(512, 290), 512, 512, 1, ROOT + '/assets/icon-maskable-512.png');
  fs.mkdirSync(ROOT + '/assets/splash', { recursive: true });
  for (const [w, h, r] of SPLASH) {
    await shot(`<body style="margin:0;background:${BG};width:${w}px;height:${h}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px"><style>${fontCss}</style>${markSvg(150)}<div style="font:italic 800 40px 'BC',sans-serif;letter-spacing:.04em;color:#fff">NEVER <span style="color:${LIME}">ZERO</span></div></body>`, w, h, r, `${ROOT}/assets/splash/${w * r}x${h * r}.png`);
  }
  await shot(`<body style="margin:0;background:${BG};width:1200px;height:630px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px"><style>${fontCss}</style>${markSvg(380)}<div style="font:italic 800 132px/1 'BC',sans-serif;letter-spacing:.04em;color:#fff">NEVER <span style="color:${LIME}">ZERO</span></div><div style="font:500 34px 'B',sans-serif;color:#AAB4C0">Progress over perfection. Consistency over excuses.</div></body>`, 1200, 630, 1, ROOT + '/assets/og.png');
  fs.rmSync(path.join(ROOT, 'tools', '_tmp.html'), { force: true });
  await b.close();
  console.log('assets done');
})();

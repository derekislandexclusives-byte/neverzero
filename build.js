/* Never Zero build.
   node build.js --pwa     production site into dist/ (bundled, minified, hashed, CSP, service worker)
   node build.js           single-file Claude artifact into build/index.html
   node build.js --local   test page with local React into build/test.html */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const esbuild = require('esbuild');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src') + '/';
const VERSION = '1.1.1';
const SITE = 'https://derekislandexclusives-byte.github.io/neverzero/';
const mode = process.argv.includes('--pwa') ? 'pwa' : process.argv.includes('--local') ? 'local' : 'artifact';

const read = (f) => fs.readFileSync(SRC + f, 'utf8');
const inputs = ['logic.js', 'app.jsx', 'style.css', 'shim.js', 'entry.js'].map(read).join('\n');
const buildId = crypto.createHash('sha1').update(inputs + VERSION).digest('hex').slice(0, 8);
const versionLabel = VERSION + ' (' + buildId + ')';
const safe = (t) => t.replace(/<\/script/gi, '<\\/script');
const css = read('style.css');

if (mode !== 'pwa') {
  const logic = read('logic.js');
  const app = esbuild.transformSync(read('app.jsx'), {
    loader: 'jsx', target: 'es2019',
    define: { __PWA__: 'false', __VERSION__: JSON.stringify(versionLabel) }
  }).code;
  const fonts = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Barlow:wght@500;600;700&family=Barlow+Condensed:ital,wght@1,700;1,800&family=Barlow+Condensed:wght@600;700;800&display=swap" rel="stylesheet">`;
  const react = mode === 'local'
    ? '<script src="react.js"></script><script src="react-dom.js"></script>'
    : '<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>\n<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>';
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#090F15">
<title>Never Zero</title>
${fonts}
<style>
${css}
</style>
</head>
<body>
<div id="root"></div>
${react}
<script>
${safe(logic)}
</script>
<script>
${safe(app)}
</script>
</body>
</html>
`;
  const out = mode === 'local' ? 'build/test.html' : 'build/index.html';
  fs.mkdirSync(path.join(ROOT, 'build'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, out), html);
  console.log('built', out, html.length, 'bytes');
  process.exit(0);
}

/* ---------------- production PWA ---------------- */
const DIST = path.join(ROOT, 'dist');
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
fs.cpSync(path.join(ROOT, 'assets'), DIST, { recursive: true });

const js = esbuild.buildSync({
  entryPoints: [SRC + 'entry.js'], bundle: true, minify: true, format: 'iife', write: false,
  target: ['safari15', 'chrome100'], loader: { '.jsx': 'jsx' }, legalComments: 'none',
  define: { __PWA__: 'true', __VERSION__: JSON.stringify(versionLabel), 'process.env.NODE_ENV': '"production"' }
}).outputFiles[0].text;

const fontFaces = [
  ['Barlow', 500, 'normal', 'barlow-latin-500-normal'],
  ['Barlow', 600, 'normal', 'barlow-latin-600-normal'],
  ['Barlow', 700, 'normal', 'barlow-latin-700-normal'],
  ['Barlow Condensed', 700, 'normal', 'barlow-condensed-latin-700-normal'],
  ['Barlow Condensed', 800, 'normal', 'barlow-condensed-latin-800-normal'],
  ['Barlow Condensed', 800, 'italic', 'barlow-condensed-latin-800-italic']
].map(([fam, w, st, file]) => `@font-face{font-family:'${fam}';font-style:${st};font-weight:${w};font-display:swap;src:url(fonts/${file}.woff2) format('woff2')}`).join('\n');
const cssOut = esbuild.transformSync(fontFaces + '\n' + css, { loader: 'css', minify: true }).code;

const jsName = `app.${buildId}.js`;
fs.writeFileSync(path.join(DIST, jsName), js);
const mark = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/mark.json'), 'utf8'));
const bootMark = `<svg class="mark" width="132" height="${Math.round(132 * mark.h / mark.w)}" viewBox="0 0 ${mark.w} ${mark.h}" aria-hidden="true"><path d="${mark.d}" fill="#A3FF36" fill-rule="evenodd"/></svg>`;

const splash = [
  [430, 932, 3], [428, 926, 3], [393, 852, 3], [390, 844, 3], [375, 812, 3], [414, 896, 3], [414, 896, 2], [375, 667, 2], [402, 874, 3], [440, 956, 3]
];
const splashLinks = splash.map(([w, h, r]) =>
  `<link rel="apple-touch-startup-image" media="(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${r}) and (orientation: portrait)" href="splash/${w * r}x${h * r}.png">`).join('\n');
const csp = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'";
const desc = 'Never Zero is a daily habit tracker. Complete your Main habit for full credit or Minimum Mode for 25%. Both keep your streak alive.';
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="referrer" content="no-referrer">
<title>Never Zero</title>
<meta name="description" content="${desc}">
<meta name="theme-color" content="#090F15">
<meta name="color-scheme" content="dark">
<meta name="application-name" content="Never Zero">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Never Zero">
<meta name="format-detection" content="telephone=no">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Never Zero">
<meta property="og:title" content="Never Zero">
<meta property="og:description" content="Progress over perfection. Consistency over excuses. Win the day.">
<meta property="og:url" content="${SITE}">
<meta property="og:image" content="${SITE}og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" sizes="192x192" href="icon-192.png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
${splashLinks}
<link rel="preload" as="font" type="font/woff2" crossorigin href="fonts/barlow-latin-600-normal.woff2">
<link rel="preload" as="font" type="font/woff2" crossorigin href="fonts/barlow-condensed-latin-800-italic.woff2">
<style>${cssOut}</style>
<script defer src="${jsName}"></script>
</head>
<body>
<div id="root"><div class="center-screen"><h1 class="logo xl">${bootMark}NEVER <span>ZERO</span></h1></div></div>
<noscript>Never Zero needs JavaScript to run.</noscript>
</body>
</html>
`;
fs.writeFileSync(path.join(DIST, 'index.html'), html);

fs.writeFileSync(path.join(DIST, 'manifest.webmanifest'), JSON.stringify({
  id: './', name: 'Never Zero', short_name: 'Never Zero', description: desc, lang: 'en',
  start_url: './', scope: './', display: 'standalone', orientation: 'portrait',
  background_color: '#090F15', theme_color: '#090F15', categories: ['health', 'lifestyle', 'productivity'],
  icons: [
    { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
  ]
}, null, 2));

const precache = ['./', 'index.html', jsName, 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png']
  .concat(fontFaces.split('\n').map((l) => l.match(/url\(([^)]+)\)/)[1]));
fs.writeFileSync(path.join(DIST, 'sw.js'), `/* Never Zero service worker (build ${buildId}).
   App files are cached so the app opens instantly and works offline.
   Pages try the network for up to 2.5 s, then fall back to the cached copy, so updates arrive on the next launch. */
const CACHE = 'nz-${buildId}';
const PRECACHE = ${JSON.stringify(precache)};
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.indexOf('nz-') === 0 && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
function pageFromNetworkOrCache(req) {
  return new Promise((resolve) => {
    let done = false;
    const cached = () => caches.match('index.html');
    const timer = setTimeout(() => { cached().then((r) => { if (r && !done) { done = true; resolve(r); } }); }, 2500);
    fetch(req).then((r) => {
      clearTimeout(timer);
      if (!done) { done = true; resolve(r); }
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put('index.html', copy)); }
    }).catch(() => {
      clearTimeout(timer);
      cached().then((r) => { if (!done) { done = true; resolve(r || Response.error()); } });
    });
  });
}
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (req.mode === 'navigate') { e.respondWith(pageFromNetworkOrCache(req)); return; }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => {
    if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return r;
  })));
});
`);
const size = (f) => fs.statSync(path.join(DIST, f)).size;
console.log('built dist/ build', buildId, '| js', size(jsName), 'html (incl. css)', size('index.html'), 'bytes');

/* Copies dist/ into the repository root (what GitHub Pages serves), removing stale hashed files. */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
for (const f of fs.readdirSync(ROOT)) if (/^app\.[0-9a-f]{8}\.(js|css)$/.test(f)) fs.rmSync(path.join(ROOT, f));
fs.cpSync(DIST, ROOT, { recursive: true });
console.log('released dist/ to repository root');

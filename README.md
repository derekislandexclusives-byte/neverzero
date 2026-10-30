# Never Zero

A personal habit tracker built around one idea: **showing up every day matters, and full effort should score higher.**

Every habit has two ways to count:

| Choice | Credit | Streak |
| --- | --- | --- |
| **Main** (the full goal) | 100% | kept |
| **Minimum Mode** (a smaller fallback) | 25% | kept |
| Missed | 0% | resets |

Minimum Mode can be used as often as you like. Choosing it shows a short "Taking the easy way out?" checkpoint first.

Live app: https://derekislandexclusives-byte.github.io/neverzero/

## Features

- **Today**: performance score, consistency score, overall streak and personal best, and your habit checklist
- **Progress**: weekly and monthly averages, a daily performance chart, and a streak for every habit
- **History**: a monthly calendar where any past day can be opened and edited
- **Habits**: create, edit, reorder, archive and restore habits; JSON backup and restore
- Works offline and installs to the iPhone Home Screen (Share, then Add to Home Screen)

## How scoring works

- Daily performance = (100 x Main + 25 x Minimum) / active habits
- Daily consistency = (Main + Minimum) / active habits
- A day is a success only when every habit active that day is done at Main or Minimum
- Streaks and personal bests are always calculated from the saved history, never stored
- Each habit remembers the dates it was active, so adding or archiving a habit never changes old scores

## Privacy and data

Everything is stored on your own device (IndexedDB). There are no accounts, no servers and no tracking. A strict Content Security Policy blocks any network connections other than this site itself.
Use **Habits, then Back up** to save a JSON copy, and **Restore from a backup** to load it.

## Project layout

```
src/logic.js     scoring, streaks, dates, validation (no UI, fully unit tested)
src/app.jsx      React interface
src/style.css    styles
src/entry.js     bundle entry (shim.js exposes React and the logic module)
assets/          icons, iOS splash screens, share image, fonts
tests/           unit, layout (6 phone widths), end-to-end and PWA/offline tests
build.js         production build (bundle, minify, content-hash, service worker)
tools/           asset generator and release script
```

## Develop

```
npm install
npm run build
npm run serve            # http://localhost:8765
npm run test:logic
npm run test:layout      # needs the server running
npm run test:e2e
npm run test:pwa
npm run release          # build, then copy dist/ to the repo root for GitHub Pages
```

Deploy by committing the repository root; GitHub Pages serves the `main` branch.

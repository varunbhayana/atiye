# Maths Adventure Island 🏝️🦉

An offline, game-based maths app for young children, built for age 5 (UKG / Kindergarten). It runs on macOS in a Google Chrome window and opens with a double-click.

- **13 interactive game types**: Count the Animals, Feed the Monster, Balloon Pop, Number Train, Treasure Chest, Pizza Maths, Shape Detective, Catch the Number, Pattern Puzzle, Toy Shop, Frog Jumps, Block Towers, Look & Choose
- **Ways to play**: Adventure Island (9 zones), Today's Journey, Treasure Hunt, Learn mode, Practice, and a parent-configured Quiz (test mode)
- **Adaptive difficulty** that is deterministic and explainable, plus a parent dashboard, stickers and badges
- **English or Hinglish** for everything the child sees and hears
- **No server, no internet, no accounts, no ads.** Progress stays on the Mac.

## Quick start

| I want to… | Do this |
|---|---|
| **Use the app** | `npm install` then `npm run package:mac`. Open `release/Maths-Adventure.dmg` and drag **Maths Adventure** to Applications. Double-click it. |
| Develop | `npm run dev`, then open the printed URL in Chrome |
| Run every check | `npm run verify` (typecheck → lint → unit tests → build → Playwright in Chrome) |

Requirements: macOS 10.15+, Google Chrome, and Node.js 20+ (for building only). Works on both Apple Silicon and Intel: the launcher is a shell script, and the app is plain HTML/JS.

## Build outputs

`npm run package:mac` produces:

```
release/
  Maths Adventure.app           ← double-click launcher (ad-hoc signed)
  Maths-Adventure.dmg           ← drag-to-Applications installer
  Maths-Adventure-macOS.zip
  READ ME FIRST.md              ← parent guide
```

The whole web app is a single self-contained `dist/index.html` (about 580 KB: JS, CSS and fonts inlined). It has a strict Content-Security-Policy with `connect-src 'none'`, so it **cannot** make network requests.

## How launching works

`Maths Adventure.app/Contents/MacOS/MathsAdventure` is a small shell script. It:

1. Copies `index.html` to `~/Library/Application Support/MathsAdventure/app/`. This gives a stable location even if the `.app` is moved.
2. Starts Google Chrome as an app window (`--app=file://…`) with its own profile at `~/Library/Application Support/MathsAdventure/chrome-profile`. Progress lives there, separate from the family's normal Chrome. Background-networking features are switched off.
3. Handles the edge cases:
   - **Launched twice:** Chrome hands the request to the running instance, and the app offers "Play in this window".
   - **Chrome missing:** a dialog offers Safari or a Chrome download.
   - **Files missing:** a friendly dialog appears.
   - Everything is logged to `~/Library/Logs/MathsAdventure/launcher.log`.

There is no local server, so there are no ports or port conflicts. Closing the window is a clean shutdown, because every answer is saved immediately.

## Documentation

- [docs/PARENT_GUIDE.md](docs/PARENT_GUIDE.md): installing, playing, and the grown-ups area
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): how the code is organised
- [docs/ADDING_A_SUBJECT.md](docs/ADDING_A_SUBJECT.md): adding English, Hindi, Science, …
- [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
- [docs/TEST_REPORT.md](docs/TEST_REPORT.md): what is tested, and the latest results

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server with hot reload |
| `npm run build` | Typecheck + single-file production build → `dist/index.html` |
| `npm test` | Vitest unit and integration tests (jsdom) |
| `npm run e2e` | Playwright end-to-end tests in the installed Google Chrome, against `dist/` (run `build` first) |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript (strict) |
| `npm run package:mac` | Build the `.app`, `.zip` and `.dmg` |
| `node scripts/screenshots.mjs <dir>` | Screenshot every game (developer tool) |

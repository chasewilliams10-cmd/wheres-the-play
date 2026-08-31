# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

"Where's the Play?" — a situational-baseball trainer for 10U players, built as a
single-page React app (Vite, no backend, no accounts). The player defends three
innings; every right call is an out, every wrong call scores a run. There are
three quiz modes: where the ball goes, force-vs-tag, and who covers which bag.

No data leaves the device — deliberately, to stay clear of COPPA (players are
under 13). Best scores persist only in `localStorage`.

## Project layout is flat, not `src/` + `public/` as the README describes

The README documents a `src/App.jsx`, `src/main.jsx`, `public/sw.js` layout,
but on disk every source file (`App.jsx`, `main.jsx`, `index.css`, `sw.js`,
`manifest.webmanifest`, icons, `index.html`) sits flat at the repo root — there
is no `src/` or `public/` directory. `index.html`'s script tag has been
adjusted to `/main.jsx` (not `/src/main.jsx`) to match. `npm run build` and
`npm run dev` both work against this flat layout as of this writing — verify
with `npm run build` if you're unsure it still does. `files.zip` at the repo
root holds a copy of the files in the README's original `src`/`public`
layout, if that structure is ever wanted back.

## Commands

```
npm install      # install deps
npm run dev       # Vite dev server, localhost:5173
npm run build     # production build to dist/
npm run preview   # preview the production build
```

There is no test suite, lint config, or CI in this repo.

**Deploy note from the README:** every deploy must bump `CACHE` in `sw.js`
(e.g. `wtp-v1` → `wtp-v2`). The service worker cache-busts on that string, so
forgetting it leaves people on stale cached versions.

## Architecture

The entire app is one file, `App.jsx` — no router, no external state
management, no component files to hunt across.

- **Scenario banks** (`PLAY`, `FORCE`, `COVER`, near the top of `App.jsx`) are
  plain data arrays, one object per quiz question (situation + correct answer
  + optional `alsoOk` partial-credit answers + a `why` explanation shown after
  the pick). Adding baseball content means adding an object to one of these
  three arrays — nothing else needs to change. `MODES` maps a mode key
  (`"play"` / `"force"` / `"cover"`) to its title, blurb, and bank.
- **`buildDeck(mode)`** shuffles the relevant bank into a deck for a run. Cover
  mode is special-cased: its bank lists the right answer first for
  readability in source, so `buildDeck` also shuffles each question's
  `options` (and remaps `answer` to the new index) so the position doesn't
  give away the answer.
- **`App()`** is a single state machine driven by a `screen` state
  (`"menu"` → `"game"` → `"over"`), plus per-run state: `deck`, `idx` (current
  question), `inning`, `outs`, `runs`, `streak`/`bestStreak`, `picked`,
  `result`. Three innings (`INNINGS = 3`) and a mercy rule (`MERCY = 10` runs)
  bound a run; wrong answers increment outs/runs, `outs >= 3` advances the
  inning, hitting mercy or finishing inning 3 moves to `"over"`.
- **Best scores** persist to `localStorage` under `wtp.bestScores` (lowest
  runs allowed per mode), read once on mount and written via `saveRecord`.
  Reads/writes are wrapped in `try/catch` since private browsing can disable
  storage — the app must still function without it.
- **Presentational pieces** (`Field`, `Runner`, `Ball`, `Legend`, `Stamp`,
  `Scoreboard`) render the diamond, base runners, and pick UI from
  coordinate tables (`BASE_XY`, `FIELDER_XY`, `RUNNER_OFFSET`) — positions are
  hand-tuned pixel/percent constants, not computed from a physics model.
- **Styling** is inline style objects and a small `C` color palette / `F` font
  stack constant (both defined at the top of `App.jsx`) — there's no CSS
  framework; `index.css` only sets page background and safe-area padding for
  notches when installed as a home-screen app.
- **Offline support**: `sw.js` is a hand-written service worker (network-first
  for the page navigation, cache-first for fingerprinted assets), registered
  from `main.jsx` after `load` so it never delays first paint.

## Baseball domain rules encoded in the scenario banks

These are the rules the `answer`/`alsoOk` fields in `PLAY`/`FORCE`/`COVER`
follow — worth knowing before adding or editing scenarios:

- Under two outs, take the lead force; settling for the out at first when a
  lead force is available is treated as the wrong answer.
- With two outs, any force ends the inning, so take the surest one.
- A steal is never a force (the batter didn't run, so no one is forced) —
  relevant to the `FORCE` bank's steal scenarios.
- This is written for a league where runners can't lead off and can only
  steal once the ball has left the pitcher's hand.
- "Who covers second on a steal" is deliberately excluded from `COVER` — the
  right answer depends on batter handedness or team-specific rules.

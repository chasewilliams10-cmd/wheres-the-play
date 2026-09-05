# Where's the Play?

A situational-baseball trainer for 10U players. Three games — where the play is,
force vs. tag (ground balls and steals), and who covers which bag. You're on
defense for three innings: every right call is an out, every wrong one lets a
run score.

Built for a league that allows leadoffs, steals, and the dropped third strike.

No accounts, no server, no data leaves the device. Best scores live in the
browser's own storage. That's deliberate — collecting anything about a player
under 13 pulls COPPA into the picture, and there's no reason to.

---

## Deploy it (about 10 minutes)

You need a GitHub account and a Vercel account, both free.

### 1. Put it on GitHub

Open Terminal, `cd` into this folder, then:

    git init
    git add -A
    git commit -m "Where's the Play — situational baseball trainer"
    git branch -M main

Create an empty repo at https://github.com/new — name it `wheres-the-play`,
leave "Add a README" unchecked. Then copy the URL it gives you:

    git remote add origin https://github.com/YOUR-USERNAME/wheres-the-play.git
    git push -u origin main

### 2. Put it on Vercel

Go to https://vercel.com → **Add New → Project** → import `wheres-the-play`.

It auto-detects Vite. Framework "Vite", build command `npm run build`, output
directory `dist` — all defaults. Don't change anything. Click **Deploy**.

About a minute later you get a URL like `wheres-the-play.vercel.app`. That's
your app. Anyone can open it, no account, no install.

### 3. Check it on a phone before you send it anywhere

Open the URL on your phone and confirm:

- The title font is tall and condensed, not plain system text
- Tapping an answer shows the result without scrolling
- **Share → Add to Home Screen** (iOS) or **Install app** (Android)
- Open it from the home screen: no browser bar, full screen
- Turn on airplane mode and open it again — it should still work

---

## Making changes later

    npm install      # once
    npm run dev      # live preview at localhost:5173
    npm test         # checks every scenario for a legal answer, no dupes, etc.

Run `npm test` after editing `PLAY`, `FORCE`, or `COVER` in `src/App.jsx` — it
checks every scenario's answer against the actual force rule (not just that
it looks reasonable), catches duplicate situations, and checks `COVER`
answers are marked correctly in source. See `tests/scenarios.test.js`.

To publish a change, commit and push. Vercel redeploys automatically.

**Every time you deploy, bump `CACHE` in `public/sw.js`** (`wtp-v1` → `wtp-v2`).
That clears out old cached files on everyone's phone. If you forget, people may
keep seeing the old version.

---

## Where things are

    src/App.jsx                   the whole game
    src/main.jsx                  starts the app, registers offline support
    src/index.css                 page background and notch spacing
    index.html                    fonts, icons, link-preview tags
    public/sw.js                  offline caching
    public/manifest.webmanifest   home-screen install
    public/icon-*.png             app icons

All the baseball lives in three arrays at the top of `src/App.jsx`:

- `PLAY` — where's the play (108 situations: every out/base combination for
  each of the six infield positions)
- `FORCE` — force or tag (30 situations: ground balls, steals, pickoffs,
  and dropped third strikes)
- `COVER` — who covers (17 situations)

Adding a scenario means adding one object to the right array. Nothing else to
touch. The rules of thumb the answers follow:

- Under two outs, take the lead force. Settling for first is the wrong out.
- With two outs, any force ends the inning — take the surest one.
- A steal or pickoff is never a force. The batter never ran, so nobody is forced.
- A dropped third strike IS a force at first — the batter became a runner. He
  may only run if first base is open, or if there are two outs.

## Known limits

- Scores are per-device. Clearing browser data clears them.
- No "who covers second on a steal" — the answer depends on batter handedness
  or on a team rule, so it isn't in here.
- No pickoff-at-second or rundown scenarios yet.

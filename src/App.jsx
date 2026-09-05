import React, { useState, useEffect, useCallback, useRef } from "react";

/* ------------------------------------------------------------------
   TYPE — condensed athletic display over a clean sporty text face.
   The fallbacks matter: if the webfont is blocked or the phone is
   offline, Oswald/Impact/Roboto Condensed still land somewhere
   condensed and heavy instead of dropping to plain system sans.
------------------------------------------------------------------ */
const F = {
  display: '"Big Shoulders Display", Oswald, Impact, Haettenschweiler, "Franklin Gothic Bold", "Arial Narrow", sans-serif',
  body: 'Barlow, "Barlow Semi Condensed", "Helvetica Neue", Roboto, Arial, sans-serif',
};
const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800;900" +
  "&family=Barlow:wght@400;500;600;700&display=swap";

/* ------------------------------------------------------------------
   PALETTE — old ballpark scoreboard: night grass, clay, chalk, bulbs
------------------------------------------------------------------ */
const C = {
  night: "#151F4D",      // deep navy — dugout at night
  panel: "#20306E",      // raised navy panel
  grass: "#3E9159",      // brighter outfield so it pops on a phone
  grassDark: "#317347",
  clay: "#D08A5A",
  clayLight: "#DFA277",
  chalk: "#FBF7EC",      // cream, not pure white
  bulb: "#BCE2E8",       // ice blue accent
  red: "#E0353D",        // primary pop
  out: "#E0353D",
  safe: "#4FC27A",
  line: "rgba(251,247,236,0.18)",
};

/* ------------------------------------------------------------------
   SCENARIO BANK — "Where's the play"
   answer = best play. alsoOk = defensible, gets partial credit.
------------------------------------------------------------------ */
export const PLAY = [
  // ---- P ----
  { bases: ["second"], outs: 0, f: "P", answer: "first",
    why: "Nobody's on first, so the runner on second is NOT forced to third. Throw there and he just goes back. Take the out at first." },
  { bases: ["second", "third"], outs: 0, f: "P", answer: "first",
    why: "First base is empty, so NEITHER runner is forced. The batter is the only one who has to run." },
  { bases: ["first", "third"], outs: 0, f: "P", answer: "second",
    why: "The runner on first HAS to go, so second is a force — and it starts the double play. Taking the batter at first gets one out and leaves the lead runner in scoring position." },
  { bases: ["first", "second", "third"], outs: 0, f: "P", answer: "home",
    why: "Bases loaded, nobody out. Home is a force, and home-to-first is still a double play — the only choice that gets both outs AND keeps the run off the board." },
  { bases: ["first", "second"], outs: 0, f: "P", answer: "second", alsoOk: ["third"],
    why: "Third is a force too, but from where you're standing the surest double play is second and then first. A double play beats one out at third." },
  { bases: ["first"], outs: 0, f: "P", answer: "second",
    why: "The runner on first HAS to go, so second is a force — and it starts the double play. Taking the batter at first gets one out and leaves the lead runner in scoring position." },
  { bases: [], outs: 0, f: "P", answer: "first",
    why: "Nobody on base. The only runner forced to go anywhere is the batter. Throw to first." },
  { bases: ["first"], outs: 1, f: "P", answer: "second",
    why: "The runner on first HAS to go, so second is a force — and it starts the double play. Taking the batter at first gets one out and leaves the lead runner in scoring position." },
  { bases: [], outs: 1, f: "P", answer: "first",
    why: "Nobody on base. The only runner forced to go anywhere is the batter. Throw to first." },
  { bases: ["first", "third"], outs: 1, f: "P", answer: "second",
    why: "The runner on first HAS to go, so second is a force — and it starts the double play. Taking the batter at first gets one out and leaves the lead runner in scoring position." },
  { bases: ["first", "second", "third"], outs: 1, f: "P", answer: "home", alsoOk: ["second"],
    why: "Everybody's forced. Home then first ends the inning with nothing scoring. Second then first works too — when the last out is a force at first, no run counts." },
  { bases: ["second"], outs: 1, f: "P", answer: "first",
    why: "Nobody's on first, so the runner on second is NOT forced to third. Throw there and he just goes back. Take the out at first." },
  { bases: ["second", "third"], outs: 1, f: "P", answer: "first",
    why: "First base is empty, so NEITHER runner is forced. The batter is the only one who has to run." },
  { bases: [], outs: 2, f: "P", answer: "first",
    why: "Empty bases, two outs. One throw ends it — set your feet and make it a good one." },
  { bases: ["second", "third"], outs: 2, f: "P", answer: "first",
    why: "Two outs and no force anywhere but first. Make the throw and neither run counts." },
  { bases: ["first", "third"], outs: 2, f: "P", answer: "first", alsoOk: ["second"],
    why: "Two outs — any force ends the inning. Take the surest out you've got instead of chasing the lead runner." },
  { bases: ["first", "second"], outs: 2, f: "P", answer: "first", alsoOk: ["second", "third"],
    why: "Two outs — any force ends the inning. Take the surest out you've got instead of chasing the lead runner." },
  { bases: ["second"], outs: 2, f: "P", answer: "first",
    why: "Two outs. The batter is the only forced runner — get him and you're off the field." },
  // ---- C ----
  { bases: ["first"], outs: 0, f: "C", answer: "second",
    why: "The runner on first HAS to go, so second is a force — and it starts the double play. Taking the batter at first gets one out and leaves the lead runner in scoring position." },
  { bases: ["second", "third"], outs: 0, f: "C", answer: "first",
    why: "First base is empty, so NEITHER runner is forced. The batter is the only one who has to run." },
  { bases: ["first", "second"], outs: 0, f: "C", answer: "third", alsoOk: ["second"],
    why: "Both lead runners are forced and the bag is right there. Step on third — no throw at all, and the runner closest to scoring is gone." },
  { bases: ["first", "third"], outs: 0, f: "C", answer: "second",
    why: "The runner on first HAS to go, so second is a force — and it starts the double play. Taking the batter at first gets one out and leaves the lead runner in scoring position." },
  { bases: [], outs: 0, f: "C", answer: "first",
    why: "Nobody on base. The only runner forced to go anywhere is the batter. Throw to first." },
  { bases: ["third"], outs: 0, f: "C", answer: "first",
    why: "The runner on third isn't forced. Show him the ball to freeze him, then throw to first for the sure out." },
  { bases: ["first", "second", "third"], outs: 0, f: "C", answer: "home",
    why: "Bases loaded, nobody out. Home is a force, and home-to-first is still a double play — the only choice that gets both outs AND keeps the run off the board." },
  { bases: ["first", "second"], outs: 1, f: "C", answer: "third", alsoOk: ["second"],
    why: "Both lead runners are forced and the bag is right there. Step on third — no throw at all, and the runner closest to scoring is gone." },
  { bases: ["third"], outs: 1, f: "C", answer: "first",
    why: "The runner on third isn't forced. Show him the ball to freeze him, then throw to first for the sure out." },
  { bases: ["first"], outs: 1, f: "C", answer: "second",
    why: "The runner on first HAS to go, so second is a force — and it starts the double play. Taking the batter at first gets one out and leaves the lead runner in scoring position." },
  { bases: ["first", "second", "third"], outs: 1, f: "C", answer: "home",
    why: "Everybody's forced. Home then first ends the inning with nothing scoring. Second then first works too — when the last out is a force at first, no run counts." },
  { bases: ["second", "third"], outs: 1, f: "C", answer: "first",
    why: "First base is empty, so NEITHER runner is forced. The batter is the only one who has to run." },
  { bases: ["first", "third"], outs: 1, f: "C", answer: "second",
    why: "The runner on first HAS to go, so second is a force — and it starts the double play. Taking the batter at first gets one out and leaves the lead runner in scoring position." },
  { bases: ["first", "second", "third"], outs: 2, f: "C", answer: "home", alsoOk: ["first", "second", "third"],
    why: "Two outs, bases loaded, and you're standing on a force bag. Step on the plate." },
  { bases: [], outs: 2, f: "C", answer: "first",
    why: "Empty bases, two outs. One throw ends it — set your feet and make it a good one." },
  { bases: ["second"], outs: 2, f: "C", answer: "first",
    why: "Two outs. The batter is the only forced runner — get him and you're off the field." },
  { bases: ["first", "second"], outs: 2, f: "C", answer: "first", alsoOk: ["second", "third"],
    why: "Two outs — any force ends the inning. Take the surest out you've got instead of chasing the lead runner." },
  { bases: ["third"], outs: 2, f: "C", answer: "first",
    why: "Two outs. Beat the batter to first and the run doesn't count, even if he crosses the plate first." },
  // ---- 1B ----
  { bases: ["second", "third"], outs: 0, f: "1B", answer: "first",
    why: "First base is empty, so NEITHER runner is forced. The batter is the only one who has to run." },
  { bases: [], outs: 0, f: "1B", answer: "first",
    why: "Nobody on base. The only runner forced to go anywhere is the batter. Throw to first." },
  { bases: ["first", "second", "third"], outs: 0, f: "1B", answer: "home",
    why: "Bases loaded, nobody out. Home is a force, and home-to-first is still a double play — the only choice that gets both outs AND keeps the run off the board." },
  { bases: ["second"], outs: 0, f: "1B", answer: "first",
    why: "Nobody's on first, so the runner on second is NOT forced to third. Throw there and he just goes back. Take the out at first." },
  { bases: ["first", "third"], outs: 0, f: "1B", answer: "second",
    why: "The runner on first HAS to go, so second is a force — and it starts the double play. Taking the batter at first gets one out and leaves the lead runner in scoring position." },
  { bases: ["first"], outs: 0, f: "1B", answer: "second",
    why: "The runner on first HAS to go, so second is a force — and it starts the double play. Taking the batter at first gets one out and leaves the lead runner in scoring position." },
  { bases: ["first", "second"], outs: 0, f: "1B", answer: "second",
    why: "Third is a force too, but from where you're standing the surest double play is second and then first. A double play beats one out at third." },
  { bases: ["second"], outs: 1, f: "1B", answer: "first",
    why: "Nobody's on first, so the runner on second is NOT forced to third. Throw there and he just goes back. Take the out at first." },
  { bases: ["first", "second"], outs: 1, f: "1B", answer: "second",
    why: "Third is a force too, but from where you're standing the surest double play is second and then first. A double play beats one out at third." },
  { bases: [], outs: 1, f: "1B", answer: "first",
    why: "Nobody on base. The only runner forced to go anywhere is the batter. Throw to first." },
  { bases: ["third"], outs: 1, f: "1B", answer: "first",
    why: "The runner on third isn't forced. Show him the ball to freeze him, then throw to first for the sure out." },
  { bases: ["first"], outs: 1, f: "1B", answer: "second",
    why: "The runner on first HAS to go, so second is a force — and it starts the double play. Taking the batter at first gets one out and leaves the lead runner in scoring position." },
  { bases: ["first", "second", "third"], outs: 1, f: "1B", answer: "home", alsoOk: ["second"],
    why: "Everybody's forced. Home then first ends the inning with nothing scoring. Second then first works too — when the last out is a force at first, no run counts." },
  { bases: [], outs: 2, f: "1B", answer: "first",
    why: "Two outs. Don't throw it anywhere — step on the bag yourself and walk off." },
  { bases: ["first", "second"], outs: 2, f: "1B", answer: "first", alsoOk: ["second", "third"],
    why: "Two outs. Don't throw it anywhere — step on the bag yourself and walk off." },
  { bases: ["second", "third"], outs: 2, f: "1B", answer: "first",
    why: "Two outs. Don't throw it anywhere — step on the bag yourself and walk off." },
  { bases: ["third"], outs: 2, f: "1B", answer: "first",
    why: "Two outs. Don't throw it anywhere — step on the bag yourself and walk off." },
  { bases: ["second"], outs: 2, f: "1B", answer: "first",
    why: "Two outs. Don't throw it anywhere — step on the bag yourself and walk off." },
  // ---- 2B ----
  { bases: ["first", "second"], outs: 0, f: "2B", answer: "second",
    why: "Third is a force too, but from where you're standing the surest double play is second and then first. A double play beats one out at third." },
  { bases: ["second"], outs: 0, f: "2B", answer: "first",
    why: "Nobody's on first, so the runner on second is NOT forced to third. Throw there and he just goes back. Take the out at first." },
  { bases: [], outs: 0, f: "2B", answer: "first",
    why: "Nobody on base. The only runner forced to go anywhere is the batter. Throw to first." },
  { bases: ["first", "third"], outs: 0, f: "2B", answer: "second",
    why: "The runner on first HAS to go, so second is a force — and it starts the double play. Taking the batter at first gets one out and leaves the lead runner in scoring position." },
  { bases: ["first"], outs: 0, f: "2B", answer: "second",
    why: "The runner on first HAS to go, so second is a force — and it starts the double play. Taking the batter at first gets one out and leaves the lead runner in scoring position." },
  { bases: ["first", "second", "third"], outs: 0, f: "2B", answer: "home",
    why: "Bases loaded, nobody out. Home is a force, and home-to-first is still a double play — the only choice that gets both outs AND keeps the run off the board." },
  { bases: ["second", "third"], outs: 0, f: "2B", answer: "first",
    why: "First base is empty, so NEITHER runner is forced. The batter is the only one who has to run." },
  { bases: ["third"], outs: 1, f: "2B", answer: "first",
    why: "The runner on third isn't forced. Show him the ball to freeze him, then throw to first for the sure out." },
  { bases: ["first", "third"], outs: 1, f: "2B", answer: "second",
    why: "The runner on first HAS to go, so second is a force — and it starts the double play. Taking the batter at first gets one out and leaves the lead runner in scoring position." },
  { bases: ["first"], outs: 1, f: "2B", answer: "second",
    why: "The runner on first HAS to go, so second is a force — and it starts the double play. Taking the batter at first gets one out and leaves the lead runner in scoring position." },
  { bases: ["first", "second", "third"], outs: 1, f: "2B", answer: "home", alsoOk: ["second"],
    why: "Everybody's forced. Home then first ends the inning with nothing scoring. Second then first works too — when the last out is a force at first, no run counts." },
  { bases: ["first", "second"], outs: 1, f: "2B", answer: "second",
    why: "Third is a force too, but from where you're standing the surest double play is second and then first. A double play beats one out at third." },
  { bases: [], outs: 1, f: "2B", answer: "first",
    why: "Nobody on base. The only runner forced to go anywhere is the batter. Throw to first." },
  { bases: ["first", "third"], outs: 2, f: "2B", answer: "first", alsoOk: ["second"],
    why: "Two outs — any force ends the inning. Take the surest out you've got instead of chasing the lead runner." },
  { bases: [], outs: 2, f: "2B", answer: "first",
    why: "Empty bases, two outs. One throw ends it — set your feet and make it a good one." },
  { bases: ["third"], outs: 2, f: "2B", answer: "first",
    why: "Two outs. Beat the batter to first and the run doesn't count, even if he crosses the plate first." },
  { bases: ["first", "second", "third"], outs: 2, f: "2B", answer: "first", alsoOk: ["second", "third", "home"],
    why: "Two outs — any force ends the inning. Take the surest out you've got instead of chasing the lead runner." },
  { bases: ["second", "third"], outs: 2, f: "2B", answer: "first",
    why: "Two outs and no force anywhere but first. Make the throw and neither run counts." },
  // ---- SS ----
  { bases: ["third"], outs: 0, f: "SS", answer: "first",
    why: "The runner on third isn't forced. Show him the ball to freeze him, then throw to first for the sure out." },
  { bases: ["first", "third"], outs: 0, f: "SS", answer: "second",
    why: "The runner on first HAS to go, so second is a force — and it starts the double play. Taking the batter at first gets one out and leaves the lead runner in scoring position." },
  { bases: ["first", "second", "third"], outs: 0, f: "SS", answer: "home",
    why: "Bases loaded, nobody out. Home is a force, and home-to-first is still a double play — the only choice that gets both outs AND keeps the run off the board." },
  { bases: ["second"], outs: 0, f: "SS", answer: "first",
    why: "Nobody's on first, so the runner on second is NOT forced to third. Throw there and he just goes back. Take the out at first." },
  { bases: ["first", "second"], outs: 0, f: "SS", answer: "second", alsoOk: ["third"],
    why: "Third is a force too, but from where you're standing the surest double play is second and then first. A double play beats one out at third." },
  { bases: [], outs: 0, f: "SS", answer: "first",
    why: "Nobody on base. The only runner forced to go anywhere is the batter. Throw to first." },
  { bases: ["first"], outs: 0, f: "SS", answer: "second",
    why: "The runner on first HAS to go, so second is a force — and it starts the double play. Taking the batter at first gets one out and leaves the lead runner in scoring position." },
  { bases: ["first"], outs: 1, f: "SS", answer: "second",
    why: "The runner on first HAS to go, so second is a force — and it starts the double play. Taking the batter at first gets one out and leaves the lead runner in scoring position." },
  { bases: [], outs: 1, f: "SS", answer: "first",
    why: "Nobody on base. The only runner forced to go anywhere is the batter. Throw to first." },
  { bases: ["first", "third"], outs: 1, f: "SS", answer: "second",
    why: "The runner on first HAS to go, so second is a force — and it starts the double play. Taking the batter at first gets one out and leaves the lead runner in scoring position." },
  { bases: ["first", "second"], outs: 1, f: "SS", answer: "second", alsoOk: ["third"],
    why: "Third is a force too, but from where you're standing the surest double play is second and then first. A double play beats one out at third." },
  { bases: ["first", "second", "third"], outs: 1, f: "SS", answer: "home", alsoOk: ["second"],
    why: "Everybody's forced. Home then first ends the inning with nothing scoring. Second then first works too — when the last out is a force at first, no run counts." },
  { bases: ["third"], outs: 1, f: "SS", answer: "first",
    why: "The runner on third isn't forced. Show him the ball to freeze him, then throw to first for the sure out." },
  { bases: [], outs: 2, f: "SS", answer: "first",
    why: "Empty bases, two outs. One throw ends it — set your feet and make it a good one." },
  { bases: ["second", "third"], outs: 2, f: "SS", answer: "first",
    why: "Two outs and no force anywhere but first. Make the throw and neither run counts." },
  { bases: ["first", "second"], outs: 2, f: "SS", answer: "first", alsoOk: ["second", "third"],
    why: "Two outs — any force ends the inning. Take the surest out you've got instead of chasing the lead runner." },
  { bases: ["first"], outs: 2, f: "SS", answer: "first", alsoOk: ["second"],
    why: "Two outs — any force ends the inning. Take the surest out you've got instead of chasing the lead runner." },
  { bases: ["first", "third"], outs: 2, f: "SS", answer: "first", alsoOk: ["second"],
    why: "Two outs — any force ends the inning. Take the surest out you've got instead of chasing the lead runner." },
  // ---- 3B ----
  { bases: ["first", "second", "third"], outs: 0, f: "3B", answer: "home",
    why: "Bases loaded, nobody out. Home is a force, and home-to-first is still a double play — the only choice that gets both outs AND keeps the run off the board." },
  { bases: ["second", "third"], outs: 0, f: "3B", answer: "first",
    why: "First base is empty, so NEITHER runner is forced. The batter is the only one who has to run." },
  { bases: ["first"], outs: 0, f: "3B", answer: "second",
    why: "The runner on first HAS to go, so second is a force — and it starts the double play. Taking the batter at first gets one out and leaves the lead runner in scoring position." },
  { bases: ["third"], outs: 0, f: "3B", answer: "first",
    why: "The runner on third isn't forced. Show him the ball to freeze him, then throw to first for the sure out." },
  { bases: ["first", "third"], outs: 0, f: "3B", answer: "second",
    why: "The runner on first HAS to go, so second is a force — and it starts the double play. Taking the batter at first gets one out and leaves the lead runner in scoring position." },
  { bases: [], outs: 0, f: "3B", answer: "first",
    why: "Nobody on base. The only runner forced to go anywhere is the batter. Throw to first." },
  { bases: ["first", "second"], outs: 0, f: "3B", answer: "third", alsoOk: ["second"],
    why: "Both lead runners are forced and the bag is right there. Step on third — no throw at all, and the runner closest to scoring is gone." },
  { bases: ["second", "third"], outs: 1, f: "3B", answer: "first",
    why: "First base is empty, so NEITHER runner is forced. The batter is the only one who has to run." },
  { bases: ["first", "third"], outs: 1, f: "3B", answer: "second",
    why: "The runner on first HAS to go, so second is a force — and it starts the double play. Taking the batter at first gets one out and leaves the lead runner in scoring position." },
  { bases: ["second"], outs: 1, f: "3B", answer: "first",
    why: "Nobody's on first, so the runner on second is NOT forced to third. Throw there and he just goes back. Take the out at first." },
  { bases: ["first"], outs: 1, f: "3B", answer: "second",
    why: "The runner on first HAS to go, so second is a force — and it starts the double play. Taking the batter at first gets one out and leaves the lead runner in scoring position." },
  { bases: ["first", "second"], outs: 1, f: "3B", answer: "third", alsoOk: ["second"],
    why: "Both lead runners are forced and the bag is right there. Step on third — no throw at all, and the runner closest to scoring is gone." },
  { bases: ["first", "second", "third"], outs: 1, f: "3B", answer: "home", alsoOk: ["second"],
    why: "Everybody's forced. Home then first ends the inning with nothing scoring. Second then first works too — when the last out is a force at first, no run counts." },
  { bases: [], outs: 2, f: "3B", answer: "first",
    why: "Empty bases, two outs. One throw ends it — set your feet and make it a good one." },
  { bases: ["first", "second"], outs: 2, f: "3B", answer: "third", alsoOk: ["first", "second"],
    why: "Two outs and a force bag is right under your foot. Don't throw it — step on third and the inning's over." },
  { bases: ["second", "third"], outs: 2, f: "3B", answer: "first",
    why: "Two outs and no force anywhere but first. Make the throw and neither run counts." },
  { bases: ["second"], outs: 2, f: "3B", answer: "first",
    why: "Two outs. The batter is the only forced runner — get him and you're off the field." },
  { bases: ["first"], outs: 2, f: "3B", answer: "first", alsoOk: ["second"],
    why: "Two outs — any force ends the inning. Take the surest out you've got instead of chasing the lead runner." },
];

/* ------------------------------------------------------------------
   SCENARIO BANK — "Force or tag"
------------------------------------------------------------------ */
export const FORCE = [
  { bases: ["first"], base: "second", force: true,
    why: "The batter is running to first, so the runner on first has to leave. Nowhere to go back to — that's a force." },
  { bases: [], base: "first", force: true,
    why: "The batter always has to run to first. First base is always a force." },
  { bases: ["second"], base: "third", force: false,
    why: "First base is empty, so nobody is pushing him. He can go back to second whenever he wants. You have to tag him." },
  { bases: ["third"], base: "home", force: false,
    why: "Nobody behind him is forced to move, so he doesn't have to run. Tag him or he's safe." },
  { bases: ["first", "second"], base: "third", force: true,
    why: "The batter pushes the runner off first, who pushes the runner off second. The chain reaches third — force." },
  { bases: ["first", "second"], base: "second", force: true,
    why: "The runner on first has to vacate, so second base is a force." },
  { bases: ["second", "third"], base: "third", force: false,
    why: "First base is open, so the chain never starts. The runner on second can stay put. Tag needed." },
  { bases: ["second", "third"], base: "home", force: false,
    why: "No force chain — first base is empty. Catch it and tag him before he touches the plate." },
  { bases: ["first", "second", "third"], base: "home", force: true,
    why: "Bases loaded is the only time home plate is a force. Every runner has someone right behind him." },
  { bases: ["first", "third"], base: "home", force: false,
    why: "Second base is empty, so the runner on third isn't being pushed anywhere. Tag him." },
  { bases: ["first", "third"], base: "second", force: true,
    why: "The batter running to first forces the runner on first to go. Second is live." },
  { bases: ["first", "third"], base: "third", force: false,
    lead: "Base hit into right field and the runner from first digs for third.",
    why: "Second base was empty, so he was only ever forced as far as second. Going to third is his own choice — tag him." },
  { bases: ["second"], base: "first", force: true,
    why: "Doesn't matter who else is on. The batter has to run, so first base is always a force." },
  { bases: ["second"], base: "home", force: false,
    lead: "Base hit to the outfield and the runner on second is being waved home.",
    why: "First base was empty, so nobody was ever pushing him. He's running because the coach sent him. Tag him at the plate." },
  { bases: ["first", "second"], base: "home", force: false,
    lead: "Base hit into the gap and the runner from second is being sent home.",
    why: "He was forced as far as third and no further — third base was empty behind him. Nothing forces him to the plate, so tag him." },
  { bases: ["first", "second", "third"], base: "third", force: true, outs: 2,
    lead: "Two outs. Ground ball with the bases loaded.",
    why: "Loaded bases means every base is a force, third included. Two outs, so any of them ends it — step on the bag." },
  { bases: ["first"], base: "first", force: true,
    why: "The batter is forced to first every single time. Step on the bag, no tag needed." },
  // --- kid pitch: runners leave on the release, so there's no batted ball ---
  // and no force. This is the contrast that makes the whole rule click.
  { bases: ["first"], base: "second", force: false, batterRuns: false, kidPitch: true,
    lead: "The runner on first leads off and breaks for second.",
    why: "Nobody hit the ball, so the batter never ran. If the batter isn't running, nothing is forced. A steal is a tag every single time." },
  { bases: ["second"], base: "third", force: false, batterRuns: false, kidPitch: true,
    lead: "The runner on second gets a big lead and takes off for third.",
    why: "No batted ball means no force anywhere. Catch it and put the glove down in front of the bag." },
  { bases: ["third"], base: "home", force: false, batterRuns: false, kidPitch: true,
    lead: "The pitch skips past the catcher and the runner on third takes off.",
    why: "He's running on his own, not because anyone pushed him. Block the plate and tag him." },
  { bases: ["first", "second"], base: "third", force: false, batterRuns: false, kidPitch: true,
    lead: "Both runners take off on a double steal.",
    why: "Careful — on a GROUND BALL this exact setup is a force at third. On a steal it isn't, because the batter never ran. Same bases, different answer." },
  { bases: ["first", "second", "third"], base: "home", force: false, batterRuns: false, kidPitch: true,
    lead: "The pitch gets away and the runner on third breaks for the plate.",
    why: "Bases loaded is a force at home only when the ball is put in play. Nobody hit this one, so you have to tag him." },
  { bases: ["third"], base: "first", force: true,
    why: "The batter has to run no matter who else is on. First base is always a force." },
  { bases: ["first", "second"], base: "first", force: true,
    why: "Ground ball means the batter is running. First is a force, same as always." },
  { bases: ["first", "second", "third"], base: "second", force: true, outs: 2,
    lead: "Two outs. Ground ball with the bases juiced.",
    why: "Every runner ahead of the batter is forced, so second is a force and it ends the inning. With fewer outs you'd want the ball going home instead — but with two outs, any force does it." },
  // --- leadoffs are legal, so pickoffs are live ---
  { bases: ["first"], base: "first", force: false, batterRuns: false, kidPitch: true,
    lead: "The runner strays too far off first and the pitcher spins and throws over.",
    why: "Look at the item above: same runner, same base, opposite answer. Nobody swung, so the batter isn't running and first isn't a force. Tag him." },
  { bases: ["second"], base: "second", force: false, batterRuns: false, kidPitch: true,
    lead: "The runner on second drifts off the bag and the catcher snaps a throw down.",
    why: "No batted ball, no force. Catch it and sweep the tag back toward the bag." },

  // --- dropped third strike: the batter becomes a runner, so first is live ---
  { bases: [], base: "first", force: true, kidPitch: true,
    lead: "Strike three skips past the catcher and the batter takes off for first.",
    why: "The second that ball gets by, he stops being a batter and starts being a runner — and every batter-runner is forced to first. Tag him or beat him to the bag." },
  { bases: ["second"], base: "first", force: true, kidPitch: true,
    lead: "Strike three gets away. First base is open, so the batter can run.",
    why: "First base is empty, so he's allowed to go. He's a runner now, which makes first a force. The throw beats him — no tag needed." },
  { bases: ["first", "second", "third"], base: "first", force: true, kidPitch: true, outs: 2,
    lead: "Two outs. Strike three gets by the catcher and the batter runs.",
    why: "With two outs he can run even though first is occupied. He's a batter-runner, so first is a force — and a force out at first for the third out means no run counts." },
];

/* ------------------------------------------------------------------
   SCENARIO BANK — "Who covers"
------------------------------------------------------------------ */
export const COVER = [
  { q: "Ground ball to the shortstop. Runner on first. Who covers second base?",
    bases: ["first"], ball: "SS",
    options: ["Second baseman", "Pitcher", "Third baseman", "Catcher"], answer: 0,
    why: "Whoever isn't fielding the ball takes the bag. Ball to the left side means the second baseman covers." },
  { q: "Ground ball to the second baseman. Runner on first. Who covers second base?",
    bases: ["first"], ball: "2B",
    options: ["Shortstop", "Pitcher", "First baseman", "Center fielder"], answer: 0,
    why: "Ball to the right side means the shortstop takes the bag. The two middle infielders trade off." },
  { q: "Ground ball pulls the first baseman way off the bag. Who covers first?",
    bases: [], ball: "1B",
    options: ["Pitcher", "Catcher", "Shortstop", "Right fielder"], answer: 0,
    why: "The pitcher breaks toward first on every ball hit to the right side. Run in a curve so you hit the bag square." },
  { q: "Bunt right in front of the plate. The catcher fields it. Who covers first base?",
    bases: [], ball: "C",
    options: ["Second baseman", "Shortstop", "Pitcher", "Left fielder"], answer: 0,
    why: "The first baseman charged in for the bunt, so the second baseman sprints over to take the throw." },
  { kidPitch: true, q: "Runner on first takes off to steal. Who backs up the throw in case it gets past second?",
    bases: ["first"], spot: [200, 306],
    options: ["Center fielder", "Pitcher", "Left fielder", "Third baseman"], answer: 0,
    why: "The center fielder charges in behind the bag. If it skips through, he keeps the runner from getting third." },
  { q: "Fly ball to center field, runner tagging from third. Who is the cutoff man for the throw home?",
    bases: ["third"], ball: "CF",
    options: ["First baseman", "Shortstop", "Pitcher", "Third baseman"], answer: 0,
    why: "From center or right, the first baseman is the cutoff — he's the one on that side of the field. Left field is the exception: that one goes to the third baseman." },
  { q: "Base hit to right field and the runner rounds second heading for third. Who covers third?",
    bases: ["second"], ball: "RF",
    options: ["Third baseman", "Shortstop", "Pitcher", "Catcher"], answer: 0,
    why: "The third baseman stays home on his bag. The shortstop goes out to be the relay man." },
  { q: "Pop fly floating between the shortstop and the third baseman. Who should call for it?",
    bases: [], spot: [141, 147],
    options: ["Shortstop", "Third baseman", "Pitcher", "Left fielder"], answer: 0,
    why: "The shortstop has more range and a better angle moving to his left. He calls it loud and everyone else clears out." },
  { q: "Pop fly between the second baseman and the right fielder. Who has priority?",
    bases: [], spot: [268, 113],
    options: ["Right fielder", "Second baseman", "First baseman", "Pitcher"], answer: 0,
    why: "An outfielder running in always beats an infielder running out. He can see the whole play in front of him." },
  { kidPitch: true, q: "Pitch gets past the catcher with a runner on third. Who covers home plate?",
    bases: ["third"], spot: [224, 324],
    options: ["Pitcher", "First baseman", "Third baseman", "Shortstop"], answer: 0,
    why: "The catcher is chasing the ball, so the pitcher sprints in to cover the plate and take the throw." },
  { kidPitch: true, q: "Runner on second takes off for third. Who covers third base?",
    bases: ["second"], spot: [200, 306],
    options: ["Third baseman", "Shortstop", "Pitcher", "Left fielder"], answer: 0,
    why: "The third baseman stays on his own bag for a steal. He's the closest man and he already knows where the bag is without looking." },
  { kidPitch: true, q: "Runner steals second and the catcher's throw skips past the bag. Where should the pitcher be?",
    bases: ["first"], spot: [200, 306],
    options: ["Backing up third base", "Covering second base", "Covering home", "Still on the mound"], answer: 0,
    why: "If the throw gets away, that runner is going to third. The pitcher's job on every steal is to get behind third and keep him from scoring." },
  { kidPitch: true, q: "Runner on second breaks for third. Which outfielder backs up the throw to third?",
    bases: ["second"], spot: [200, 306],
    options: ["Left fielder", "Center fielder", "Right fielder", "Nobody — the pitcher has it"], answer: 0,
    why: "Left field is directly behind third, so he charges in. The pitcher gets over there too, but the outfielder is the one deep enough to stop an overthrow from turning into a run." },
  { q: "Ground ball to the second baseman with nobody on base. Who covers first?",
    bases: [], ball: "2B",
    options: ["First baseman", "Pitcher", "Shortstop", "Catcher"], answer: 0,
    why: "He's already standing there. The pitcher only comes over when the ball pulls the first baseman off the bag." },
  { q: "Runner on first. Base hit into left field and he's rounding second for third. Who is the cutoff man for the throw to third?",
    bases: ["first"], ball: "LF",
    options: ["Shortstop", "Second baseman", "Pitcher", "Third baseman"], answer: 0,
    why: "The shortstop goes out toward left to meet the throw. The third baseman has to stay home on his bag or there's nobody there to catch it." },
  { q: "Fly ball to left field, runner tagging from third. Who is the cutoff man for the throw home?",
    bases: ["third"], ball: "LF",
    options: ["Third baseman", "First baseman", "Shortstop", "Pitcher"], answer: 0,
    why: "From left field it's the third baseman — he's already on that side of the diamond and the throw comes right down his line. From center or right it's the first baseman instead." },
  { q: "Fly ball to left field, runner tagging from third, and the third baseman goes out to cut the throw. Who covers third base?",
    bases: ["third"], ball: "LF",
    options: ["Shortstop", "Second baseman", "Pitcher", "Catcher"], answer: 0,
    why: "Somebody always has to be on the bag. When the third baseman leaves to be the cutoff, the shortstop slides over and takes his place." },
];

/* ------------------------------------------------------------------
   FIELD GEOMETRY
------------------------------------------------------------------ */
const BASE_XY = {
  home: [200, 288],
  first: [296, 192],
  second: [200, 96],
  third: [104, 192],
};
// Fielders sit where they actually play: corner infielders a few steps off
// their own bag toward second and BEHIND the baseline, not between home and
// the bag (that's bunt coverage, not a starting position).
export const FIELDER_XY = {
  P: [200, 192], C: [200, 316],
  "1B": [272, 162], "2B": [246, 132],
  SS: [154, 132], "3B": [128, 162],
  LF: [110, 95], CF: [200, 56], RF: [290, 95],
};
// Nudge each runner clear of the fielder standing nearest that bag.
const RUNNER_OFFSET = { first: [8, 0], second: [-20, 14], third: [-8, 0] };
// Leadoffs are legal, so on steals and pickoffs the runners are off the bag,
// edging toward the next one — and the first baseman holds his man on.
const LEADOFF_OFFSET = { first: [-21, -21], second: [-21, 21], third: [21, 21] };
const HOLDING_FIRST = [300, 162];
const INFIELD = ["P", "C", "1B", "2B", "SS", "3B"];
const FIELDER_NAME = {
  P: "pitcher", C: "catcher", "1B": "first baseman",
  "2B": "second baseman", SS: "shortstop", "3B": "third baseman",
  LF: "left fielder", CF: "center fielder", RF: "right fielder",
};
const BASE_LABEL = { first: "1st", second: "2nd", third: "3rd", home: "Home" };

const shuffle = (a) => {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
};

/* ------------------------------------------------------------------
   FIELD
------------------------------------------------------------------ */
function Runner({ x, y }) {
  return (
    <g>
      <circle cx={x} cy={y - 30} r="6.5" fill={C.red} stroke={C.chalk} strokeWidth="2" />
      <path d={`M${x - 7.5},${y - 21} q7.5,-5 15,0 l-2.5,15 q-5,3 -10,0 Z`}
            fill={C.red} stroke={C.chalk} strokeWidth="2" strokeLinejoin="round" />
    </g>
  );
}

function Ball({ x, y }) {
  return (
    <g>
      <circle cx={x} cy={y} r="8.5" fill={C.chalk} stroke={C.night} strokeWidth="1.5" />
      <path d={`M${x - 4.6},${y - 6.6} q3.4,6.6 0,13.2`} fill="none" stroke={C.red} strokeWidth="1.7" />
      <path d={`M${x + 4.6},${y - 6.6} q-3.4,6.6 0,13.2`} fill="none" stroke={C.red} strokeWidth="1.7" />
      <circle cx={x} cy={y} r="8.5" fill="none" stroke={C.chalk} strokeWidth="3" opacity="0.75">
        <animate attributeName="r" values="8.5;26;8.5" dur="1.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.75;0;0.75" dur="1.5s" repeatCount="indefinite" />
      </circle>
    </g>
  );
}

function Field({ runners = [], ball, spot, pickable, onPick, picked, correct,
                alsoOk = [], reveal, leadoff = false }) {
  const ballXY = spot || (ball && FIELDER_XY[ball] ? FIELDER_XY[ball] : null);
  const offsets = leadoff ? LEADOFF_OFFSET : RUNNER_OFFSET;
  const holding = leadoff && runners.includes("first");

  const baseNode = (name) => {
    const [x, y] = BASE_XY[name];
    const on = runners.includes(name);
    // Three outcomes, not two: best play, also-fine play, and actually wrong.
    const isBest = reveal && correct === name;
    const isFine = reveal && picked === name && alsoOk.includes(name);
    const isWrong = reveal && picked === name && !isBest && !isFine;
    let fill = C.chalk;
    if (isBest) fill = C.safe;
    else if (isFine) fill = C.bulb;
    else if (isWrong) fill = C.red;
    else if (picked === name) fill = C.bulb;

    return (
      <g key={name}>
        {name === "home" ? (
          <polygon
            points={`${x - 11},${y - 8} ${x + 11},${y - 8} ${x + 11},${y + 4} ${x},${y + 14} ${x - 11},${y + 4}`}
            fill={fill} stroke={C.night} strokeWidth="2"
          />
        ) : (
          <rect
            x={x - 11} y={y - 11} width="22" height="22" rx="3"
            transform={`rotate(45 ${x} ${y})`}
            fill={fill} stroke={C.night} strokeWidth="2"
          />
        )}
        {on && <Runner x={x + (offsets[name] || [0, 0])[0]}
                       y={y + (offsets[name] || [0, 0])[1]} />}
        {pickable && (
          <circle cx={x} cy={y} r="30" fill="transparent"
                  style={{ cursor: "pointer" }} onClick={() => onPick && onPick(name)} />
        )}
      </g>
    );
  };

  return (
    <svg viewBox="0 0 400 340" preserveAspectRatio="xMidYMid meet"
         style={{ width: "100%", height: "100%", display: "block" }} role="img"
         aria-label="Baseball diamond showing the current situation">
      <rect x="0" y="0" width="400" height="340" fill={C.grassDark} />
      <path d="M200 330 L20 150 A200 200 0 0 1 380 150 Z" fill={C.grass} />
      <polygon points="200,306 314,192 200,78 86,192" fill={C.clay} />
      <polygon points="200,272 280,192 200,112 120,192" fill={C.grass} />
      <line x1="200" y1="296" x2="352" y2="144" stroke={C.chalk} strokeWidth="2" opacity="0.55" />
      <line x1="200" y1="296" x2="48" y2="144" stroke={C.chalk} strokeWidth="2" opacity="0.55" />
      <circle cx="200" cy="192" r="26" fill={C.clayLight} />

      {Object.keys(FIELDER_XY).map((k) => {
        const [x, y] = (holding && k === "1B") ? HOLDING_FIRST : FIELDER_XY[k];
        if (ball === k) return null;   // the ball takes this spot instead
        return (
          <g key={k} opacity={INFIELD.includes(k) ? 0.45 : 0.3}>
            <circle cx={x} cy={y} r="11" fill="rgba(251,247,236,0.35)" />
            <text x={x} y={y + 4} textAnchor="middle"
                  style={{ fontFamily: F.display, fontSize: 10 }}
                  fill={C.night}>{k}</text>
          </g>
        );
      })}

      {ballXY && <Ball x={ballXY[0]} y={ballXY[1]} />}
      {["home", "first", "second", "third"].map(baseNode)}
    </svg>
  );
}

function Legend() {
  const item = { display: "flex", alignItems: "center", gap: 6 };
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 8,
                  fontSize: 11.5, color: "rgba(251,247,236,0.6)", fontWeight: 700,
                  letterSpacing: "0.04em" }}>
      <div style={item}>
        <svg width="16" height="20" viewBox="0 0 16 20">
          <circle cx="8" cy="5" r="4" fill={C.red} stroke={C.chalk} strokeWidth="1.5" />
          <path d="M3,11 q5,-3 10,0 l-1.7,8 q-3.3,2 -6.6,0 Z" fill={C.red}
                stroke={C.chalk} strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
        RUNNER ON BASE
      </div>
      <div style={item}>
        <svg width="18" height="18" viewBox="0 0 18 18">
          <circle cx="9" cy="9" r="7.5" fill={C.chalk} stroke={C.night} strokeWidth="1.2" />
          <path d="M5,3.5 q3,5.5 0,11" fill="none" stroke={C.red} strokeWidth="1.5" />
          <path d="M13,3.5 q-3,5.5 0,11" fill="none" stroke={C.red} strokeWidth="1.5" />
        </svg>
        BALL IS HERE
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   UMPIRE CALL — the moment the whole thing is built around
------------------------------------------------------------------ */
function Stamp({ ok }) {
  const label = ok ? "OUT!" : "SAFE!";
  const color = ok ? C.safe : C.red;
  return (
    <div aria-hidden="true" style={{
      position: "absolute", inset: 0, display: "flex",
      alignItems: "center", justifyContent: "center",
      pointerEvents: "none", zIndex: 5,
    }}>
      <div className="stamp" style={{
        fontFamily: F.display, fontSize: 96, fontWeight: 900,
        letterSpacing: "-0.02em", lineHeight: 1,
        color, WebkitTextStroke: `3px ${C.chalk}`,
        textShadow: "0 8px 0 rgba(0,0,0,0.35)",
      }}>{label}</div>
    </div>
  );
}

/* ------------------------------------------------------------------
   SCOREBOARD
------------------------------------------------------------------ */
function Scoreboard({ inning, outs, runs, streak }) {
  const cell = { textAlign: "center", padding: "0 10px" };
  const label = { fontSize: 10, letterSpacing: "0.16em", color: "rgba(243,239,226,0.5)",
                  fontFamily: F.body, fontWeight: 700 };
  const val = { fontFamily: F.display, fontSize: 34, lineHeight: 1, color: C.chalk,
                fontWeight: 800, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums" };
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                  background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10,
                  padding: "10px 6px", marginBottom: 14 }}>
      <div style={cell}><div style={label}>INN</div><div style={val}>{inning}</div></div>
      <div style={cell}>
        <div style={label}>OUTS</div>
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              width: 15, height: 15, borderRadius: "50%",
              background: i < outs ? C.bulb : "transparent",
              border: `2px solid ${i < outs ? C.bulb : "rgba(243,239,226,0.3)"}`,
              boxShadow: i < outs ? `0 0 10px ${C.bulb}` : "none",
              transition: "all .25s",
            }} />
          ))}
        </div>
      </div>
      <div style={cell}><div style={label}>RUNS ALLOWED</div><div style={{ ...val, color: runs > 0 ? C.out : C.chalk }}>{runs}</div></div>
      <div style={cell}><div style={label}>STREAK</div><div style={{ ...val, color: streak > 1 ? C.safe : C.chalk }}>{streak}</div></div>
    </div>
  );
}

/* ------------------------------------------------------------------
   APP
------------------------------------------------------------------ */
export const MODES = {
  play: { title: "Where's the Play?", blurb: "A ball is hit to you. Where does it go?", bank: PLAY },
  force: { title: "Force or Tag?", blurb: "Bag or tag?", bank: FORCE },
  cover: { title: "Who Covers?", blurb: "Everybody has a job on every pitch. Know yours.", bank: COVER },
};
const BUILD = "build 9";
const FEEDBACK_TO = "chasewilliams10@gmail.com";   // bump this and CACHE in public/sw.js on every deploy
const INNINGS = 3;
const MERCY = 8;  // runs allowed before we call it
const POSITIONS = ["any", "P", "C", "1B", "2B", "SS", "3B"];
const LEVELS = { "8u": "8U Coach Pitch", "10u": "10U Kid Pitch" };

// Coach pitch has no leadoffs, no steals and no dropped third strikes, so
// anything tagged kidPitch is filtered out at 8U.
export function buildDeck(m, level, position) {
  let bank = MODES[m].bank;
  if (level === "8u") bank = bank.filter((s) => !s.kidPitch);
  if (m === "play" && position !== "any") {
    const only = bank.filter((s) => s.f === position);
    if (only.length >= 6) bank = only;   // don't narrow into a pool too small to draw from
  }
  if (m === "cover") {
    // Banks list the right answer first for readability — scramble the
    // choices so the position never gives it away.
    bank = bank.map((q) => {
      const right = q.options[q.answer];
      const opts = shuffle(q.options);
      return { ...q, options: opts, answer: opts.indexOf(right) };
    });
  }
  return shuffle(bank);
}

/* Pure so it's unit-testable outside React: pick the next scenario matching
   outsNow, never repeating within the current out-count bucket until every
   scenario in it has been shown, and never showing the same one twice in a
   row. `used`/`last` are read-only in, and returned (possibly new) in the
   result — App() is responsible for writing them back into its refs. */
export function pickScenario(deck, outsNow, used, last) {
  const eligible = [];
  deck.forEach((s, i) => { if (s.outs === undefined || s.outs === outsNow) eligible.push(i); });
  if (!eligible.length) return { index: null, scenario: null, used };
  let pool = eligible.filter((i) => !used.has(i));
  let nextUsed = used;
  if (!pool.length) {
    // This out count has run out of fresh scenarios. Clear the history for
    // THIS bucket only — wiping the whole set would put scenarios from the
    // other out counts back in play before the player had seen them all.
    nextUsed = new Set(used);
    eligible.forEach((i) => nextUsed.delete(i));
    pool = eligible.filter((i) => i !== last);   // never twice in a row
    if (!pool.length) pool = eligible;
  }
  const i = pool[Math.floor(Math.random() * pool.length)];
  const usedOut = new Set(nextUsed);
  usedOut.add(i);
  return { index: i, scenario: deck[i], used: usedOut };
}

/* Pure: only overwrite a best score when the new run is a strict
   improvement. Returns the SAME object (by reference) when nothing should
   change, so callers can skip the state update and localStorage write. */
export function nextBestScores(records, key, runs) {
  const prev = records[key];
  if (prev !== undefined && prev <= runs) return records;
  return { ...records, [key]: runs };
}

export default function App() {
  const [screen, setScreen] = useState("menu");
  const [mode, setMode] = useState("play");
  const [level, setLevel] = useState("10u");
  const [position, setPosition] = useState("any");
  const [deck, setDeck] = useState([]);
  const [cur, setCur] = useState(null);
  const [qnum, setQnum] = useState(0);
  const [inning, setInning] = useState(1);
  const [outs, setOuts] = useState(0);
  const [runs, setRuns] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [picked, setPicked] = useState(null);
  const [result, setResult] = useState(null);
  const [records, setRecords] = useState({});

  const usedRef = useRef(new Set());   // scenarios already served this game
  const lastRef = useRef(null);        // the one just shown, so it can never repeat back to back

  useEffect(() => {
    if (document.getElementById("wtp-fonts")) return;
    const l = document.createElement("link");
    l.id = "wtp-fonts";
    l.rel = "stylesheet";
    l.href = FONT_HREF;
    document.head.appendChild(l);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("wtp.bestScores");
      if (raw) setRecords(JSON.parse(raw));
      const lv = localStorage.getItem("wtp.level");
      if (lv && LEVELS[lv]) setLevel(lv);
      const ps = localStorage.getItem("wtp.position");
      if (ps && POSITIONS.includes(ps)) setPosition(ps);
    } catch {
      /* private browsing or storage disabled — settings just won't persist */
    }
  }, []);

  const remember = (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };

  const saveRecord = useCallback((key, r) => {
    const next = nextBestScores(records, key, r);
    if (next === records) return;
    setRecords(next);
    try { localStorage.setItem("wtp.bestScores", JSON.stringify(next)); } catch { /* ignore */ }
  }, [records]);

  /* Draw a scenario that matches the out count actually showing on the
     scoreboard. Scenarios whose wording depends on the outs carry an `outs`
     field; the rest fit any count. This is what keeps a prompt from saying
     "two outs" while the board shows none. */
  const drawFor = useCallback((d, outsNow) => {
    const { index, scenario, used } = pickScenario(d, outsNow, usedRef.current, lastRef.current);
    if (index !== null) { usedRef.current = used; lastRef.current = index; }
    return scenario;
  }, []);

  const start = (m) => {
    const d = buildDeck(m, level, position);
    usedRef.current = new Set(); lastRef.current = null;
    setMode(m); setDeck(d);
    setInning(1); setOuts(0); setRuns(0);
    setStreak(0); setBestStreak(0); setPicked(null); setResult(null);
    setQnum(0); setCur(drawFor(d, 0));
    setScreen("game");
  };

  const s = cur;

  const answer = (choice, verdict) => {
    if (result) return;
    setPicked(choice);
    setResult(verdict);
    if (verdict.ok) {
      const st = streak + 1;
      setStreak(st);
      setBestStreak((b) => Math.max(b, st));
    } else {
      setStreak(0);
      setRuns((r) => r + 1);
    }
  };

  const next = () => {
    let o = outs, i = inning;
    if (result.ok) o += 1;
    if (o >= 3) { o = 0; i += 1; }
    setPicked(null); setResult(null);
    if (runs >= MERCY) { saveRecord(`${level}:${mode}`, runs); setScreen("over"); return; }
    if (i > INNINGS) { saveRecord(`${level}:${mode}`, runs); setScreen("over"); return; }
    setOuts(o); setInning(i);
    setQnum((q) => q + 1);
    setCur(drawFor(deck, o));
  };

  /* ---------- shared styles ---------- */
  const shell = {
    minHeight: "100%", background: C.night, color: C.chalk,
    fontFamily: F.body,
    padding: "18px 16px 32px", boxSizing: "border-box",
  };
  const btn = {
    fontFamily: F.display, fontSize: 21, fontWeight: 700, letterSpacing: "0.05em",
    textTransform: "uppercase",
    background: C.panel, color: C.chalk, border: `2px solid ${C.line}`,
    borderRadius: 10, padding: "16px 10px", cursor: "pointer", width: "100%",
    transition: "transform .12s, border-color .12s",
  };
  const prompt = { fontSize: 16.5, lineHeight: 1.35, textAlign: "center", margin: "10px 0 11px" };

  const fonts = (
    <style>{`
      button:active { transform: scale(0.97); }
      @keyframes slam {
        0%   { transform: rotate(-11deg) scale(2.9); opacity: 0; }
        55%  { transform: rotate(-11deg) scale(0.9);  opacity: 1; }
        75%  { transform: rotate(-11deg) scale(1.07); }
        100% { transform: rotate(-11deg) scale(1);    opacity: 1; }
      }
      @keyframes stampout { to { opacity: 0; } }
      .stamp { animation: slam .42s cubic-bezier(.2,.8,.3,1) both,
                          stampout .45s ease 1.15s forwards; }
      button:focus-visible { outline: 3px solid ${C.bulb}; outline-offset: 2px; }
      @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
    `}</style>
  );

  /* ---------- MENU ---------- */
  if (screen === "menu") {
    return (
      <div style={shell}>
        {fonts}
        <div style={{ maxWidth: 460, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 6 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.3em", color: C.bulb, fontWeight: 900 }}>
              KNOW BEFORE THE PITCH
            </div>
            <h1 style={{ fontFamily: F.display, fontSize: 60, lineHeight: 0.86,
                         margin: "12px 0 0", textTransform: "uppercase",
                         fontWeight: 900, letterSpacing: "-0.015em",
                         textShadow: `4px 4px 0 ${C.panel}` }}>
              Where's<br /><span style={{ color: C.red }}>The Play?</span>
            </h1>
            <p style={{ fontSize: 15, color: "rgba(243,239,226,0.7)", marginTop: 12 }}>
              You're on defense. Three innings. Every right call is an out —
              every wrong one lets a run score.
            </p>
          </div>

          <div style={{ marginTop: 22 }}>
            <div style={{ fontSize: 10.5, letterSpacing: "0.2em", fontWeight: 900,
                          color: "rgba(251,247,236,0.45)", marginBottom: 7 }}>LEVEL</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {Object.entries(LEVELS).map(([k, label]) => (
                <button key={k} onClick={() => { setLevel(k); remember("wtp.level", k); }}
                  style={{ ...btn, fontSize: 15, padding: "11px 6px",
                           background: level === k ? C.red : C.panel,
                           borderColor: level === k ? C.red : "rgba(251,247,236,0.22)" }}>
                  {label}
                </button>
              ))}
            </div>

            <div style={{ fontSize: 10.5, letterSpacing: "0.2em", fontWeight: 900,
                          color: "rgba(251,247,236,0.45)", margin: "16px 0 7px" }}>
              MY POSITION <span style={{ letterSpacing: 0, fontWeight: 700,
                                         textTransform: "none", opacity: 0.75 }}>
                — changes Where&rsquo;s the Play only</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 7 }}>
              {POSITIONS.map((k) => (
                <button key={k} onClick={() => { setPosition(k); remember("wtp.position", k); }}
                  style={{ ...btn, fontSize: 15, padding: "10px 4px",
                           background: position === k ? C.bulb : C.panel,
                           color: position === k ? C.night : C.chalk,
                           borderColor: position === k ? C.bulb : "rgba(251,247,236,0.22)" }}>
                  {k === "any" ? "ALL" : k}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gap: 12, marginTop: 22 }}>
            {Object.entries(MODES).map(([k, m]) => (
              <button key={k} onClick={() => start(k)}
                style={{ ...btn, textAlign: "left", padding: "16px 18px", borderColor: "rgba(243,239,226,0.22)" }}>
                <div style={{ fontSize: 22 }}>{m.title}</div>
                <div style={{ fontFamily: F.body, fontSize: 13, fontWeight: 400,
                              color: "rgba(243,239,226,0.65)", marginTop: 4, letterSpacing: 0 }}>
                  {m.blurb}
                </div>
                {records[`${level}:${k}`] !== undefined && (
                  <div style={{ fontFamily: F.body, fontSize: 12, fontWeight: 700,
                                color: C.bulb, marginTop: 6, letterSpacing: 0 }}>
                    Best: {records[`${level}:${k}`]} run{records[`${level}:${k}`] === 1 ? "" : "s"} allowed
                  </div>
                )}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 24, padding: "14px 12px", borderRadius: 10,
                        border: "1px solid rgba(251,247,236,0.18)", textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(251,247,236,0.7)" }}>
              Found something wrong? Tell me.
            </div>
            <a href={`mailto:${FEEDBACK_TO}?subject=${encodeURIComponent(
                   `Where's the Play — feedback (${BUILD})`)}`}
               style={{ display: "inline-block", marginTop: 7, color: C.bulb,
                        fontFamily: F.body, fontSize: 15, fontWeight: 700,
                        wordBreak: "break-all" }}>
              {FEEDBACK_TO}
            </a>
          </div>

          <div style={{ textAlign: "center", marginTop: 14, fontSize: 11,
                        letterSpacing: "0.06em", color: "rgba(251,247,236,0.35)" }}>
            &copy; {new Date().getFullYear()} Chase Williams
            <span style={{ opacity: 0.6 }}>
              {" · "}{BUILD} · {PLAY.length + FORCE.length + COVER.length} situations
            </span>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- GAME OVER ---------- */
  if (screen === "over") {
    const grade =
      runs === 0 ? ["GOLD GLOVE", "Perfect. Nobody scored on you."] :
      runs <= 2 ? ["ALL-STAR", "That's a defense a coach can trust."] :
      runs <= 5 ? ["STARTER", "Solid. Clean up the tough ones and you're there."] :
      runs < MERCY ? ["ROOKIE", "Every big leaguer started here. Run it back."] :
                  ["ROUGH INNING", "Ten runs and they pulled you. Go again — it clicks fast."];
    return (
      <div style={shell}>
        {fonts}
        <div style={{ maxWidth: 460, margin: "0 auto", textAlign: "center", paddingTop: 30 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.3em", color: "rgba(243,239,226,0.5)", fontWeight: 900 }}>
            FINAL
          </div>
          <div style={{ fontFamily: F.display, fontSize: 58, fontWeight: 900,
                        letterSpacing: "-0.01em", color: C.bulb, marginTop: 8,
                        textShadow: `3px 3px 0 ${C.panel}` }}>
            {grade[0]}
          </div>
          <p style={{ fontSize: 16, marginTop: 6 }}>{grade[1]}</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 34, margin: "28px 0 8px" }}>
            <div>
              <div style={{ fontFamily: F.display, fontSize: 42 }}>{runs}</div>
              <div style={{ fontSize: 11, letterSpacing: "0.16em", color: "rgba(243,239,226,0.55)" }}>RUNS ALLOWED</div>
            </div>
            <div>
              <div style={{ fontFamily: F.display, fontSize: 42, color: C.safe }}>{bestStreak}</div>
              <div style={{ fontSize: 11, letterSpacing: "0.16em", color: "rgba(243,239,226,0.55)" }}>BEST STREAK</div>
            </div>
          </div>
          <div style={{ display: "grid", gap: 10, marginTop: 26 }}>
            <button style={{ ...btn, background: C.bulb, color: C.night, borderColor: C.bulb }}
                    onClick={() => start(mode)}>PLAY AGAIN</button>
            <button style={btn} onClick={() => setScreen("menu")}>PICK A DIFFERENT GAME</button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- GAME ----------
     The answer choices and the result share one slot. Once you've picked,
     the choices have done their job, so the explanation takes their place
     instead of stacking underneath it and pushing itself off screen. */
  let fieldEl = null, promptEl = null, choicesEl = null;

  if (mode === "play") {
    const correct = s.answer;
    const pick = (base) => {
      if (base === correct) answer(base, { ok: true, partial: false, why: s.why, correct });
      else if ((s.alsoOk || []).includes(base))
        answer(base, { ok: true, partial: true, why: s.why, correct });
      else answer(base, { ok: false, partial: false, why: s.why, correct });
    };
    const okAlso = s.alsoOk || [];
    fieldEl = (
      <Field runners={s.bases} ball={s.f} pickable={!result} onPick={pick}
             picked={picked} correct={correct} alsoOk={okAlso} reveal={!!result} />
    );
    promptEl = (
      <p style={prompt}>
        You're the <strong style={{ color: C.bulb }}>{FIELDER_NAME[s.f]}</strong>.
        {" "}Ground ball right at you — where do you go with it?
      </p>
    );
    choicesEl = (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {["first", "second", "third", "home"].map((b) => (
          <button key={b} onClick={() => pick(b)} style={btn}>{BASE_LABEL[b]}</button>
        ))}
      </div>
    );
  }

  if (mode === "force") {
    const pick = (isForce) =>
      answer(isForce, { ok: isForce === s.force, partial: false, why: s.why,
                        correct: s.force ? "a force — the bag is enough"
                                         : "a tag — the bag does nothing here" });
    fieldEl = <Field runners={s.bases} leadoff={s.batterRuns === false} />;
    promptEl = (
      <p style={prompt}>
        {s.lead || "Ground ball!"} You're covering{" "}
        <strong style={{ color: C.bulb }}>{BASE_LABEL[s.base]}</strong>{" "}
        and the throw is coming. Step on the bag, or tag the runner?
      </p>
    );
    choicesEl = (
      <div style={{ display: "grid", gap: 10 }}>
        {[[true, "STEP ON THE BAG"], [false, "TAG THE RUNNER"]].map(([v, label]) => (
          <button key={label} onClick={() => pick(v)} style={btn}>{label}</button>
        ))}
      </div>
    );
  }

  if (mode === "cover") {
    const pick = (i) =>
      answer(i, { ok: i === s.answer, partial: false, why: s.why, correct: s.options[s.answer] });
    fieldEl = <Field runners={s.bases || []} ball={s.ball} spot={s.spot} />;
    promptEl = <p style={prompt}>{s.q}</p>;
    choicesEl = (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
        {s.options.map((o, i) => (
          <button key={o} onClick={() => pick(i)}
            style={{ ...btn, fontSize: 16, padding: "10px 6px", lineHeight: 1.05,
                     minHeight: 56, letterSpacing: "0.02em" }}>
            {o}
          </button>
        ))}
      </div>
    );
  }

  const verdict = result && (result.ok ? "OUT!" : "SAFE. RUN SCORES.");
  const showAnswer = result && (!result.ok || result.partial);

  return (
    <div style={shell}>
      {fonts}
      <div style={{ maxWidth: 460, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between",
                      alignItems: "center", marginBottom: 8 }}>
          <div>
            <div style={{ fontFamily: F.display, fontSize: 20, letterSpacing: "0.04em" }}>
              {MODES[mode].title.toUpperCase()}
            </div>
            <div style={{ fontSize: 10.5, letterSpacing: "0.14em", fontWeight: 800,
                          color: "rgba(251,247,236,0.45)", marginTop: 1 }}>
              {level === "8u" ? "8U" : "10U"}
              {mode === "play" && position !== "any" ? ` · ${position}` : ""}
            </div>
          </div>
          <button onClick={() => setScreen("menu")}
            style={{ background: "none", border: "none", color: "rgba(251,247,236,0.55)",
                     fontFamily: F.body, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            Quit
          </button>
        </div>

        <Scoreboard inning={inning} outs={outs} runs={runs} streak={streak} />

        {/* Capped so the whole question fits one screen on a phone. Who Covers
            fits four answers in two columns rather than shrinking the field. */}
        <div style={{ position: "relative", height: "min(38vh, 260px)" }}>
          {fieldEl}
          {result && <Stamp key={qnum + "-" + String(picked)} ok={result.ok} />}
        </div>

        {!result && <Legend />}
        {promptEl}

        {result ? (
          <div onClick={next} style={{
            padding: "14px 16px 16px", borderRadius: 12, background: C.panel,
            borderLeft: `6px solid ${result.ok ? C.safe : C.red}`, cursor: "pointer",
          }}>
            <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 900,
                          letterSpacing: "0.01em", color: result.ok ? C.safe : C.red }}>
              {verdict}
            </div>
            {result.partial && (
              <div style={{ fontSize: 14.5, fontWeight: 700, marginTop: 3 }}>
                Good play — that's a real out. There's just a better one here.
              </div>
            )}
            {showAnswer && (
              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 3, color: C.bulb }}>
                {result.partial ? "Best play: " : "It was "}
                {BASE_LABEL[result.correct] || result.correct}.
              </div>
            )}
            <p style={{ fontSize: 14.5, lineHeight: 1.45, marginTop: 7, marginBottom: 0,
                        color: "rgba(251,247,236,0.85)" }}>{result.why}</p>
            <button onClick={(e) => { e.stopPropagation(); next(); }}
              style={{ ...btn, marginTop: 12, background: C.bulb, color: C.night,
                       borderColor: C.bulb, fontSize: 18, padding: "13px 10px" }}>
              NEXT BATTER
            </button>
          </div>
        ) : choicesEl}
      </div>
    </div>
  );
}

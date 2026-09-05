import { describe, it, expect } from "vitest";
import { PLAY, FORCE, COVER, FIELDER_XY } from "../src/App.jsx";

const BASE_NAMES = ["first", "second", "third"];
const PLAY_ANSWERS = ["first", "second", "third", "home"];
const INFIELD = ["P", "C", "1B", "2B", "SS", "3B"];

// The force rule the whole game is built on: first is always forced (the
// batter always has to run); second/third/home are forced only when every
// base behind them is occupied by a runner who has nowhere else to go.
function forced(target, bases) {
  if (target === "first") return true;
  if (target === "second") return bases.includes("first");
  if (target === "third") return bases.includes("first") && bases.includes("second");
  if (target === "home") return bases.includes("first") && bases.includes("second") && bases.includes("third");
  throw new Error(`Unknown base "${target}"`);
}

function expectValidBases(bases) {
  expect(Array.isArray(bases)).toBe(true);
  bases.forEach((b) => expect(BASE_NAMES).toContain(b));
  expect(new Set(bases).size).toBe(bases.length); // no duplicate runners on one base
}

describe("PLAY bank (\"Where's the Play?\")", () => {
  PLAY.forEach((s, i) => {
    describe(`entry ${i} (${s.f}, bases=${JSON.stringify(s.bases)}, outs=${s.outs})`, () => {
      it("has a valid shape", () => {
        expectValidBases(s.bases);
        expect([0, 1, 2]).toContain(s.outs);
        expect(INFIELD).toContain(s.f);
        expect(PLAY_ANSWERS).toContain(s.answer);
        expect(typeof s.why).toBe("string");
        expect(s.why.length).toBeGreaterThan(0);
      });

      it("answers with a legally forced base", () => {
        expect(forced(s.answer, s.bases)).toBe(true);
      });

      if (s.alsoOk) {
        it("only offers partial credit for other legal forces", () => {
          expect(Array.isArray(s.alsoOk)).toBe(true);
          expect(s.alsoOk.length).toBeGreaterThan(0);
          s.alsoOk.forEach((base) => {
            expect(PLAY_ANSWERS).toContain(base);
            expect(base).not.toBe(s.answer); // redundant with the main answer
            expect(forced(base, s.bases)).toBe(true);
          });
        });
      }
    });
  });

  it("has no duplicate (fielder, bases, outs) situations", () => {
    const seen = new Set();
    PLAY.forEach((s) => {
      const key = `${s.f}|${[...s.bases].sort().join(",")}|${s.outs}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    });
  });
});

describe("FORCE bank (\"Force or Tag?\")", () => {
  FORCE.forEach((s, i) => {
    describe(`entry ${i} (base=${s.base}, bases=${JSON.stringify(s.bases)})`, () => {
      it("has a valid shape", () => {
        expectValidBases(s.bases);
        expect(PLAY_ANSWERS).toContain(s.base);
        expect(typeof s.force).toBe("boolean");
        expect(typeof s.why).toBe("string");
        expect(s.why.length).toBeGreaterThan(0);
        if (s.outs !== undefined) expect([0, 1, 2]).toContain(s.outs);
      });

      // Steals and pickoffs (kidPitch scenarios with batterRuns: false) are
      // the one case where a batted-ball force rule doesn't apply: nobody
      // hit the ball, so nothing is ever forced. Every other entry — ground
      // balls, and dropped-third-strike scenarios where the batter becomes a
      // runner — follows the same force rule as the PLAY bank.
      it("has a force value matching the batted-ball rule (unless it's a steal/pickoff)", () => {
        const isUnforced = s.kidPitch && s.batterRuns === false;
        const expected = isUnforced ? false : forced(s.base, s.bases);
        expect(s.force).toBe(expected);
      });
    });
  });

  it("has no duplicate (bases, base, kidPitch) situations", () => {
    const seen = new Set();
    FORCE.forEach((s) => {
      const key = `${[...s.bases].sort().join(",")}|${s.base}|${!!s.kidPitch}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    });
  });
});

describe("COVER bank (\"Who Covers?\")", () => {
  COVER.forEach((s, i) => {
    describe(`entry ${i}`, () => {
      it("has a valid shape", () => {
        expect(typeof s.q).toBe("string");
        expect(s.q.trim().endsWith("?")).toBe(true);
        expectValidBases(s.bases || []);
        expect(Array.isArray(s.options)).toBe(true);
        expect(s.options.length).toBe(4);
        expect(new Set(s.options).size).toBe(s.options.length); // no duplicate choices
        if (s.ball !== undefined) expect(Object.keys(FIELDER_XY)).toContain(s.ball);
        if (s.spot !== undefined) {
          expect(s.spot).toHaveLength(2);
          s.spot.forEach((n) => expect(typeof n).toBe("number"));
        }
      });

      // Source lists the correct choice first for readability; buildDeck is
      // what scrambles it for play. If this ever isn't 0, the deck-building
      // shuffle-and-remap logic silently marks the wrong option correct.
      it("lists the correct answer first in source", () => {
        expect(s.answer).toBe(0);
      });
    });
  });

  it("has no duplicate questions", () => {
    const seen = new Set();
    COVER.forEach((s) => {
      expect(seen.has(s.q)).toBe(false);
      seen.add(s.q);
    });
  });
});

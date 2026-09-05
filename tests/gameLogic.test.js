import { describe, it, expect } from "vitest";
import { PLAY, FORCE, COVER, buildDeck, pickScenario, nextBestScores } from "../src/App.jsx";

describe("buildDeck", () => {
  it("includes every FORCE scenario at 10U", () => {
    expect(buildDeck("force", "10u", "any")).toHaveLength(FORCE.length);
  });

  it("filters out kidPitch scenarios at 8U", () => {
    const deck = buildDeck("force", "8u", "any");
    const expectedCount = FORCE.filter((s) => !s.kidPitch).length;
    expect(deck).toHaveLength(expectedCount);
    deck.forEach((s) => expect(s.kidPitch).toBeFalsy());
  });

  it("filters COVER's kidPitch scenarios at 8U too", () => {
    const deck = buildDeck("cover", "8u", "any");
    const expectedCount = COVER.filter((s) => !s.kidPitch).length;
    expect(deck).toHaveLength(expectedCount);
    deck.forEach((s) => expect(s.kidPitch).toBeFalsy());
  });

  it("filters PLAY down to one position when the pool is big enough", () => {
    const deck = buildDeck("play", "10u", "SS");
    const ssCount = PLAY.filter((s) => s.f === "SS").length;
    expect(ssCount).toBeGreaterThanOrEqual(6);
    expect(deck).toHaveLength(ssCount);
    deck.forEach((s) => expect(s.f).toBe("SS"));
  });

  it("returns the full PLAY bank for position 'any'", () => {
    expect(buildDeck("play", "10u", "any")).toHaveLength(PLAY.length);
  });

  it("re-scrambles COVER options without changing which one is correct", () => {
    const deck = buildDeck("cover", "10u", "any");
    deck.forEach((shuffled) => {
      const original = COVER.find((s) => s.q === shuffled.q);
      const correctText = original.options[original.answer];
      expect(shuffled.options[shuffled.answer]).toBe(correctText);
      expect([...shuffled.options].sort()).toEqual([...original.options].sort());
    });
  });
});

describe("pickScenario", () => {
  const deck = [
    { id: "a", outs: 0 },
    { id: "b", outs: 0 },
    { id: "c", outs: undefined }, // fits any out count
    { id: "d", outs: 1 },
  ];

  it("only draws scenarios matching the requested out count (or with no out requirement)", () => {
    for (let trial = 0; trial < 50; trial++) {
      const { scenario } = pickScenario(deck, 0, new Set(), null);
      expect(["a", "b", "c"]).toContain(scenario.id);
    }
  });

  it("returns null when nothing in the deck matches the out count", () => {
    const noMatch = [{ id: "only-one-out", outs: 1 }];
    const { index, scenario } = pickScenario(noMatch, 0, new Set(), null);
    expect(index).toBeNull();
    expect(scenario).toBeNull();
  });

  it("never repeats a scenario within a bucket until every eligible one has been shown", () => {
    // Bucket for outs=0 is {a, b, c} (3 eligible). Draw 3 times: all distinct.
    let used = new Set();
    let last = null;
    const seenFirstCycle = new Set();
    for (let i = 0; i < 3; i++) {
      const r = pickScenario(deck, 0, used, last);
      expect(seenFirstCycle.has(r.index)).toBe(false);
      seenFirstCycle.add(r.index);
      used = r.used;
      last = r.index;
    }
    expect(seenFirstCycle.size).toBe(3);
  });

  it("never draws the same scenario twice in a row, even across a bucket reset", () => {
    let used = new Set();
    let last = null;
    let prevIndex = null;
    for (let i = 0; i < 200; i++) {
      const r = pickScenario(deck, 0, used, last);
      if (prevIndex !== null) expect(r.index).not.toBe(prevIndex);
      used = r.used;
      last = r.index;
      prevIndex = r.index;
    }
  });

  it("tracks used scenarios per out-count bucket independently", () => {
    // Exhaust the outs=0 bucket, then confirm outs=1's single scenario is
    // still fresh (its own bucket was never touched).
    let used = new Set();
    let last = null;
    for (let i = 0; i < 3; i++) {
      const r = pickScenario(deck, 0, used, last);
      used = r.used;
      last = r.index;
    }
    const r1 = pickScenario(deck, 1, used, last);
    expect(r1.scenario.id).toBe("d");
  });
});

describe("nextBestScores", () => {
  it("records a first-ever score for a key", () => {
    const records = {};
    const next = nextBestScores(records, "10u:play", 3);
    expect(next).toEqual({ "10u:play": 3 });
  });

  it("overwrites when the new run is strictly better (fewer runs allowed)", () => {
    const records = { "10u:play": 5 };
    const next = nextBestScores(records, "10u:play", 2);
    expect(next).toEqual({ "10u:play": 2 });
  });

  it("leaves the record alone (same reference) when the new run is worse", () => {
    const records = { "10u:play": 2 };
    const next = nextBestScores(records, "10u:play", 5);
    expect(next).toBe(records);
  });

  it("leaves the record alone (same reference) when the new run ties", () => {
    const records = { "10u:play": 3 };
    const next = nextBestScores(records, "10u:play", 3);
    expect(next).toBe(records);
  });

  it("doesn't mutate the original records object", () => {
    const records = { "10u:play": 5 };
    nextBestScores(records, "10u:play", 1);
    expect(records).toEqual({ "10u:play": 5 });
  });

  it("keeps other keys untouched", () => {
    const records = { "10u:play": 5, "10u:force": 1 };
    const next = nextBestScores(records, "10u:play", 2);
    expect(next).toEqual({ "10u:play": 2, "10u:force": 1 });
  });
});

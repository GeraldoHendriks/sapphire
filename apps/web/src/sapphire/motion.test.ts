import { describe, expect, it } from "vite-plus/test";

import { claimEntrance, heroGreetingFor, isFreshlyCreated } from "./motion";

describe("isFreshlyCreated", () => {
  it("animates only rows created moments ago, tolerating small clock skew", () => {
    const now = Date.parse("2026-11-19T20:00:00.000Z");
    expect(isFreshlyCreated("2026-11-19T19:59:59.500Z", now)).toBe(true);
    expect(isFreshlyCreated("2026-11-19T20:00:01.000Z", now)).toBe(true);
    expect(isFreshlyCreated("2026-11-19T19:59:50.000Z", now)).toBe(false);
    expect(isFreshlyCreated("not a date", now)).toBe(false);
  });
});

describe("heroGreetingFor", () => {
  it("splits the day at 5, 12, 18 and 23", () => {
    expect([4, 5, 11, 12, 17, 18, 22, 23].map(heroGreetingFor)).toEqual([
      "night",
      "morning",
      "morning",
      "afternoon",
      "afternoon",
      "evening",
      "evening",
      "night",
    ]);
  });
});

describe("claimEntrance", () => {
  it("lets one row animate a message, keeps its claim, and expires old claims", () => {
    const now = 1_000_000;
    expect(claimEntrance("user:hello", "optimistic-1", now)).toBe(true);
    expect(claimEntrance("user:hello", "optimistic-1", now + 50)).toBe(true);
    expect(claimEntrance("user:hello", "server-1", now + 300)).toBe(false);
    expect(claimEntrance("user:hello", "server-2", now + 10_000)).toBe(true);
  });
});

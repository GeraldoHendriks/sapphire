import { describe, expect, it } from "vite-plus/test";

import { entranceForRow, heroGreetingFor, isFreshlyCreated, openLaunchWindow } from "./motion";

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

describe("entranceForRow", () => {
  const at = (now: number) => new Date(now).toISOString();

  it("plays one entrance per message and keeps each row's choice", () => {
    const now = Date.parse("2026-11-20T10:00:00.000Z");
    const message = { messageId: "m1", role: "user" as const, createdAt: at(now) };
    expect(entranceForRow({ ...message, rowId: "optimistic-m1", now })).toBe("user");
    expect(entranceForRow({ ...message, rowId: "optimistic-m1", now: now + 5_000 })).toBe("user");
    expect(entranceForRow({ ...message, rowId: "server-m1", now: now + 300 })).toBeNull();
    const old = { messageId: "m0", role: "assistant" as const, createdAt: at(now - 60_000) };
    expect(entranceForRow({ ...old, rowId: "m0", now })).toBeNull();
  });

  it("gives the launch to the first new user message after the window opens", () => {
    const now = Date.parse("2026-11-20T11:00:00.000Z");
    openLaunchWindow(now);
    const first = { role: "user" as const, createdAt: at(now) };
    expect(entranceForRow({ ...first, messageId: "a", rowId: "a", now: now + 100 })).toBe("launch");
    expect(entranceForRow({ ...first, messageId: "b", rowId: "b", now: now + 200 })).toBe("user");
  });
});

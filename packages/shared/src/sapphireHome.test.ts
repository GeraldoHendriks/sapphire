import { describe, expect, it } from "vite-plus/test";

import { isolateSapphireHomeEnv, isT3CodeHome, sapphireLiveHome } from "./sapphireHome.ts";

describe("isolateSapphireHomeEnv", () => {
  it("adopts SAPPHIRE_HOME, drops an inherited ~/.t3, and never passes SAPPHIRE_HOME on", () => {
    const own: NodeJS.ProcessEnv = { SAPPHIRE_HOME: "/data/sapphire", T3CODE_HOME: "/home/a/.t3" };
    isolateSapphireHomeEnv(own, "/home/a");
    expect(own).toEqual({ T3CODE_HOME: "/data/sapphire", SAPPHIRE_LIVE_HOME: "/data/sapphire" });
    expect(sapphireLiveHome(own, "/home/a")).toBe("/data/sapphire");

    const pointsAtT3: NodeJS.ProcessEnv = { SAPPHIRE_HOME: "~/.t3" };
    isolateSapphireHomeEnv(pointsAtT3, "/home/a");
    expect(pointsAtT3).toEqual({});

    const devRunner: NodeJS.ProcessEnv = { SAPPHIRE_HOME: "/data/sapphire" };
    isolateSapphireHomeEnv(devRunner, "/home/a", { adoptSapphireHome: false });
    expect(devRunner).toEqual({});

    const elsewhere: NodeJS.ProcessEnv = { T3CODE_HOME: "/home/a/.t3/dev" };
    isolateSapphireHomeEnv(elsewhere, "/home/a");
    expect(elsewhere.T3CODE_HOME).toBe("/home/a/.t3/dev");
  });
});

describe("isT3CodeHome", () => {
  it("recognizes ~/.t3 however it is spelled", () => {
    for (const dir of ["/home/a/.t3", "~/.t3", "/home/a//.t3/", "/home/a/x/../.t3"]) {
      expect(isT3CodeHome(dir, "/home/a")).toBe(true);
    }
    expect(isT3CodeHome("C:\\Users\\A\\.t3", "C:\\Users\\a")).toBe(true);
    expect(isT3CodeHome("/home/a/.t3/dev", "/home/a")).toBe(false);
    expect(isT3CodeHome("/home/a/.sapphire", "/home/a")).toBe(false);
  });
});

describe("sapphireLiveHome", () => {
  it("follows SAPPHIRE_HOME and defaults to ~/.sapphire", () => {
    expect(sapphireLiveHome({ SAPPHIRE_HOME: "/data/sapphire" }, "/home/a")).toBe("/data/sapphire");
    expect(sapphireLiveHome({}, "/home/a/")).toBe("/home/a/.sapphire");
  });
});

import { describe, expect, it } from "vite-plus/test";

import { isolateSapphireHomeEnv } from "./sapphireHome.ts";

describe("isolateSapphireHomeEnv", () => {
  it("prefers SAPPHIRE_HOME and drops a T3CODE_HOME that points at T3 Code's home", () => {
    const own: NodeJS.ProcessEnv = { SAPPHIRE_HOME: "/data/sapphire", T3CODE_HOME: "/home/a/.t3" };
    isolateSapphireHomeEnv(own, "/home/a");
    expect(own.T3CODE_HOME).toBe("/data/sapphire");

    for (const inherited of ["/home/a/.t3", "~/.t3", "/home/a/.t3/"]) {
      const env: NodeJS.ProcessEnv = { T3CODE_HOME: inherited };
      isolateSapphireHomeEnv(env, "/home/a");
      expect(env.T3CODE_HOME).toBeUndefined();
    }

    const elsewhere: NodeJS.ProcessEnv = { T3CODE_HOME: "/home/a/.t3/dev" };
    isolateSapphireHomeEnv(elsewhere, "/home/a");
    expect(elsewhere.T3CODE_HOME).toBe("/home/a/.t3/dev");
  });
});

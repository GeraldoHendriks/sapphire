/**
 * Sapphire keeps its own home and must never open an installed T3 Code's. `SAPPHIRE_HOME` names
 * Sapphire's home (it stands in for `T3CODE_HOME`). A `T3CODE_HOME` that points at T3 Code's
 * own home, such as one inherited from a shell T3 Code started, is dropped, so the default
 * `~/.sapphire` applies.
 */
export function isolateSapphireHomeEnv(env: NodeJS.ProcessEnv, homeDirectory: string): void {
  const own = env.SAPPHIRE_HOME?.trim();
  if (own) {
    env.T3CODE_HOME = own;
    return;
  }
  const inherited = env.T3CODE_HOME?.trim();
  if (inherited && isT3CodeHome(inherited, homeDirectory)) delete env.T3CODE_HOME;
}

/** Whether `dir` is an installed T3 Code's home, `~/.t3`. */
function isT3CodeHome(dir: string, homeDirectory: string): boolean {
  const expanded = dir === "~" || dir.startsWith("~/") ? homeDirectory + dir.slice(1) : dir;
  const trim = (value: string) => value.replace(/[\\/]+$/, "");
  return trim(expanded) === `${trim(homeDirectory)}/.t3`;
}

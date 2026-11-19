/**
 * Sapphire keeps its own home and must never open an installed T3 Code's `~/.t3`.
 * `SAPPHIRE_HOME` names Sapphire's live home; children never inherit it, so a dev server or an
 * agent shell cannot be steered onto that live data by accident.
 */
export function sapphireLiveHome(env: NodeJS.ProcessEnv, homeDirectory: string): string {
  return (
    env.SAPPHIRE_HOME?.trim() ||
    env.SAPPHIRE_LIVE_HOME?.trim() ||
    `${trimSeparators(homeDirectory)}/.sapphire`
  );
}

/**
 * Ignores a `T3CODE_HOME` or `SAPPHIRE_HOME` that points at T3 Code's `~/.t3`. With
 * `adoptSapphireHome` (server, desktop), `SAPPHIRE_HOME` stands in for `T3CODE_HOME`; the dev
 * runner passes false because it picks its own sandboxed home.
 */
export function isolateSapphireHomeEnv(
  env: NodeJS.ProcessEnv,
  homeDirectory: string,
  options: { readonly adoptSapphireHome: boolean } = { adoptSapphireHome: true },
): void {
  const own = env.SAPPHIRE_HOME?.trim();
  delete env.SAPPHIRE_HOME;
  if (own && options.adoptSapphireHome && !isT3CodeHome(own, homeDirectory)) {
    env.T3CODE_HOME = own;
    // Children inherit T3CODE_HOME; this tells a dev runner among them that it is a live home.
    env.SAPPHIRE_LIVE_HOME = own;
    return;
  }
  const inherited = env.T3CODE_HOME?.trim();
  if (inherited && isT3CodeHome(inherited, homeDirectory)) delete env.T3CODE_HOME;
}

/** Whether `dir` is T3 Code's `~/.t3`, however it is spelled (separators, `~`, case on Windows). */
export function isT3CodeHome(dir: string, homeDirectory: string): boolean {
  const home = normalize(homeDirectory);
  const expanded = dir === "~" || /^~[\\/]/.test(dir) ? home + dir.slice(1) : dir;
  const candidate = normalize(expanded);
  const target = `${home}/.t3`;
  const windows = /^[a-z]:\//i.test(target);
  return windows ? candidate.toLowerCase() === target.toLowerCase() : candidate === target;
}

function normalize(path: string): string {
  const parts: string[] = [];
  for (const part of path.replaceAll("\\", "/").split("/")) {
    if (part === "" || part === ".") continue;
    if (part === "..") parts.pop();
    else parts.push(part);
  }
  const absolute = path.startsWith("/") || path.startsWith("\\");
  return `${absolute ? "/" : ""}${parts.join("/")}`;
}

function trimSeparators(path: string): string {
  return path.replace(/[\\/]+$/, "");
}

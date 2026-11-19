/** How long after it was created a timeline row still plays its entrance animation. */
const ENTER_WINDOW_MS = 1500;

/**
 * Whether something created at `createdAt` is new enough to animate in. Rows the virtualized
 * timeline mounts while scrolling through history are old, so they never replay an entrance.
 */
export function isFreshlyCreated(createdAt: string, now: number = Date.now()): boolean {
  const created = Date.parse(createdAt);
  if (!Number.isFinite(created)) return false;
  const age = now - created;
  return age >= -ENTER_WINDOW_MS && age <= ENTER_WINDOW_MS;
}

const claimedEntrances = new Map<string, { readonly rowId: string; readonly at: number }>();

/**
 * Whether the row `rowId` should play the entrance for the message `signature`. A sent message
 * shows up twice in a row (the optimistic copy, then the server's) under different row ids;
 * only the first row to claim the signature animates, so the swap doesn't replay the entrance.
 * The same row keeps its claim across re-renders.
 */
export function claimEntrance(signature: string, rowId: string, now: number = Date.now()): boolean {
  for (const [key, claim] of claimedEntrances) {
    if (now - claim.at > ENTER_WINDOW_MS * 2) claimedEntrances.delete(key);
  }
  const existing = claimedEntrances.get(signature);
  if (existing) return existing.rowId === rowId;
  claimedEntrances.set(signature, { rowId, at: now });
  return true;
}

export type HeroGreeting = "morning" | "afternoon" | "evening" | "night";

/** The part of the day the home screen greets the user with. */
export function heroGreetingFor(hour: number): HeroGreeting {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 23) return "evening";
  return "night";
}

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

export type Entrance = "user" | "assistant" | "launch";

const claims = new Map<string, { readonly rowId: string; readonly at: number }>();
const rowEntrances = new Map<string, { readonly entrance: Entrance | null; readonly at: number }>();
let launchAvailableUntil = 0;

/** Opens the window in which the next new user message plays the launch (a new thread starts). */
export function openLaunchWindow(now: number = Date.now()): void {
  launchAvailableUntil = now + ENTER_WINDOW_MS;
}

/**
 * The entrance a timeline row plays, decided once per row and then kept, so a re-render never
 * swaps the animation (which would restart it). A message plays only one entrance: the optimistic
 * copy and the server's copy share a message id, so the swap between them doesn't replay it. The
 * launch is used up by the first user message after the window opens.
 */
export function entranceForRow(input: {
  readonly rowId: string;
  readonly messageId: string;
  readonly role: "user" | "assistant" | "system";
  readonly createdAt: string;
  readonly now?: number;
}): Entrance | null {
  const now = input.now ?? Date.now();
  for (const [key, value] of rowEntrances) {
    if (now - value.at > ENTER_WINDOW_MS * 4) rowEntrances.delete(key);
  }
  for (const [key, value] of claims) {
    if (now - value.at > ENTER_WINDOW_MS * 4) claims.delete(key);
  }
  const decided = rowEntrances.get(input.rowId);
  if (decided) return decided.entrance;
  let entrance: Entrance | null = null;
  if (input.role !== "system" && isFreshlyCreated(input.createdAt, now)) {
    const claim = claims.get(input.messageId);
    if (!claim || claim.rowId === input.rowId) {
      claims.set(input.messageId, { rowId: input.rowId, at: now });
      if (input.role === "user" && now <= launchAvailableUntil) {
        launchAvailableUntil = 0;
        entrance = "launch";
      } else {
        entrance = input.role;
      }
    }
  }
  rowEntrances.set(input.rowId, { entrance, at: now });
  return entrance;
}

export type HeroGreeting = "morning" | "afternoon" | "evening" | "night";

/** The part of the day the home screen greets the user with. */
export function heroGreetingFor(hour: number): HeroGreeting {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 23) return "evening";
  return "night";
}

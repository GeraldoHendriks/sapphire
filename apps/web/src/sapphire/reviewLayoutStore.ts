import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { resolveStorage } from "../lib/storage";

/** The two panes Review mode tiles: the changes (diff, PR, files) and the running app. */
export type ReviewPaneId = "changes" | "device";

export interface ReviewLayout {
  /** Which pane comes first (left, or top when stacked). */
  readonly first: ReviewPaneId;
  /** Side by side, or one above the other. */
  readonly stacked: boolean;
  /** The first pane's share of the space, between MIN_SPLIT and MAX_SPLIT. */
  readonly split: number;
  /** One pane filling the workspace, or null for the tiled view. */
  readonly maximized: ReviewPaneId | null;
}

const MIN_SPLIT = 0.2;
const MAX_SPLIT = 0.8;

export const DEFAULT_REVIEW_LAYOUT: ReviewLayout = {
  first: "changes",
  stacked: false,
  split: 0.5,
  maximized: null,
};

export type ReviewDropEdge = "left" | "right" | "top" | "bottom";

/** Where a pane dragged onto an edge of the workspace ends up. */
export function layoutForDrop(
  layout: ReviewLayout,
  pane: ReviewPaneId,
  edge: ReviewDropEdge,
): ReviewLayout {
  const other: ReviewPaneId = pane === "changes" ? "device" : "changes";
  const stacked = edge === "top" || edge === "bottom";
  const first = edge === "left" || edge === "top" ? pane : other;
  if (layout.stacked === stacked && layout.first === first) return layout;
  return { ...layout, stacked, first, maximized: null };
}

export function clampSplit(split: number): number {
  if (!Number.isFinite(split)) return DEFAULT_REVIEW_LAYOUT.split;
  return Math.min(MAX_SPLIT, Math.max(MIN_SPLIT, split));
}

interface ReviewLayoutStore {
  readonly byProjectKey: Record<string, ReviewLayout>;
  readonly update: (projectKey: string, updater: (layout: ReviewLayout) => ReviewLayout) => void;
}

/** Review mode's pane arrangement, remembered per project. */
export const useReviewLayoutStore = create<ReviewLayoutStore>()(
  persist(
    (set) => ({
      byProjectKey: {},
      update: (projectKey, updater) =>
        set((state) => {
          const current = state.byProjectKey[projectKey] ?? DEFAULT_REVIEW_LAYOUT;
          const next = updater(current);
          if (next === current) return state;
          return { byProjectKey: { ...state.byProjectKey, [projectKey]: next } };
        }),
    }),
    {
      name: "sapphire:review-layout:v1",
      storage: createJSONStorage(() =>
        resolveStorage(typeof window !== "undefined" ? window.localStorage : undefined),
      ),
      partialize: (state) => ({ byProjectKey: state.byProjectKey }),
    },
  ),
);

export function selectReviewLayout(
  byProjectKey: Record<string, ReviewLayout>,
  projectKey: string,
): ReviewLayout {
  return byProjectKey[projectKey] ?? DEFAULT_REVIEW_LAYOUT;
}

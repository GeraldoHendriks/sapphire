import { describe, expect, it } from "vite-plus/test";

import { clampSplit, DEFAULT_REVIEW_LAYOUT, layoutForDrop } from "./reviewLayoutStore";

describe("layoutForDrop", () => {
  it("places the dragged pane on the edge it was dropped on", () => {
    expect(layoutForDrop(DEFAULT_REVIEW_LAYOUT, "device", "left")).toMatchObject({
      first: "device",
      stacked: false,
    });
    expect(layoutForDrop(DEFAULT_REVIEW_LAYOUT, "device", "top")).toMatchObject({
      first: "device",
      stacked: true,
    });
    expect(layoutForDrop(DEFAULT_REVIEW_LAYOUT, "changes", "bottom")).toMatchObject({
      first: "device",
      stacked: true,
    });
  });

  it("keeps the same layout object when nothing moves, and leaves a maximized pane", () => {
    expect(layoutForDrop(DEFAULT_REVIEW_LAYOUT, "changes", "left")).toBe(DEFAULT_REVIEW_LAYOUT);
    const maximized = { ...DEFAULT_REVIEW_LAYOUT, maximized: "changes" as const };
    expect(layoutForDrop(maximized, "changes", "right").maximized).toBeNull();
  });
});

describe("clampSplit", () => {
  it("keeps both panes usable and recovers from bad stored values", () => {
    expect(clampSplit(0.05)).toBe(0.2);
    expect(clampSplit(0.95)).toBe(0.8);
    expect(clampSplit(Number.NaN)).toBe(DEFAULT_REVIEW_LAYOUT.split);
  });
});

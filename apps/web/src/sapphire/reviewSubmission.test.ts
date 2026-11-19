import { describe, expect, it } from "vite-plus/test";

import { manualEditNote, reviewSubmissionMessage } from "./reviewSubmission";

describe("reviewSubmissionMessage", () => {
  it("puts the verdict first, then the note, then the comment count", () => {
    expect(
      reviewSubmissionMessage({
        verdict: "request-changes",
        note: "  Use the theme token.  ",
        commentCount: 2,
      }),
    ).toBe(
      "Review: changes requested. Please address this feedback before moving on.\n\nUse the theme token.\n\nSee the 2 line comments attached.",
    );
    expect(reviewSubmissionMessage({ verdict: "approve", note: "", commentCount: 0 })).toBe(
      "Review: approved. The changes look good.",
    );
    expect(reviewSubmissionMessage({ verdict: "comment", note: "", commentCount: 1 })).toBe(
      "Review: comments.\n\nSee the line comment attached.",
    );
  });
});

describe("manualEditNote", () => {
  it("names each hand-edited file and is empty when there are none", () => {
    expect(manualEditNote([])).toBe("");
    expect(manualEditNote(["src/a.ts", "src/b.css"])).toBe(
      "(I edited `src/a.ts`, `src/b.css` by hand. Keep my change.)",
    );
  });
});

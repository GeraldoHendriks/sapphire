export type ReviewVerdict = "comment" | "request-changes" | "approve";

/**
 * The message a submitted review sends to the agent. The line comments travel as the composer's
 * review-comment attachments, so the text only carries the verdict and the reviewer's note.
 */
export function reviewSubmissionMessage(input: {
  readonly verdict: ReviewVerdict;
  readonly note: string;
  readonly commentCount: number;
}): string {
  const note = input.note.trim();
  const comments =
    input.commentCount === 0
      ? ""
      : input.commentCount === 1
        ? "See the line comment attached."
        : `See the ${input.commentCount} line comments attached.`;
  const heading = {
    comment: "Review: comments.",
    "request-changes": "Review: changes requested. Please address this feedback before moving on.",
    approve: "Review: approved. The changes look good.",
  }[input.verdict];
  return [heading, note, comments].filter((part) => part.length > 0).join("\n\n");
}

/** The note the agent gets after the user edits a file by hand in the quick-edit popup. */
export function manualEditNote(relativePaths: ReadonlyArray<string>): string {
  if (relativePaths.length === 0) return "";
  const list = relativePaths.map((path) => `\`${path}\``).join(", ");
  // oxlint-disable-next-line t3code/no-untranslated-copy -- prompt text for the agent, not UI copy
  return `(I edited ${list} by hand. Keep my change.)`;
}

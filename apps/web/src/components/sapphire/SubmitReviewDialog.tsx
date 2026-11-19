import { useGT } from "gt-react";
import { useState } from "react";

import { type ReviewVerdict } from "~/sapphire/reviewSubmission";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";

/**
 * Finishes a review the way a GitHub review ends: comment, request changes or approve, with an
 * optional note. The line comments made on the diff go along with it.
 */
export function SubmitReviewDialog(props: {
  readonly open: boolean;
  readonly pendingCommentCount: number;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSubmit: (verdict: ReviewVerdict, note: string) => void;
}) {
  const gt = useGT();
  const [verdict, setVerdict] = useState<ReviewVerdict>("comment");
  const [note, setNote] = useState("");
  const options: ReadonlyArray<{ value: ReviewVerdict; label: string; description: string }> = [
    {
      value: "comment",
      label: gt("Comment"),
      description: gt("Send your feedback without a verdict."),
    },
    {
      value: "request-changes",
      label: gt("Request changes"),
      description: gt("The agent should fix these before you continue."),
    },
    {
      value: "approve",
      label: gt("Approve"),
      description: gt("The changes look good."),
    },
  ];
  const nothingToSend =
    verdict === "comment" && note.trim().length === 0 && props.pendingCommentCount === 0;
  const submit = () => {
    if (nothingToSend) return;
    props.onSubmit(verdict, note.trim());
    setNote("");
    setVerdict("comment");
  };
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogPopup className="sm:max-w-md">
        <form
          className="flex min-h-0 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <DialogHeader>
            <DialogTitle>{gt("Submit review")}</DialogTitle>
            <DialogDescription>
              {props.pendingCommentCount === 0
                ? gt("No line comments yet. You can still leave a note.")
                : props.pendingCommentCount === 1
                  ? gt("1 line comment will be sent with your review.")
                  : gt("{count} line comments will be sent with your review.", {
                      count: props.pendingCommentCount,
                    })}
            </DialogDescription>
          </DialogHeader>
          <DialogPanel>
            <div className="flex flex-col gap-3">
              <Textarea
                autoFocus
                value={note}
                onChange={(event) => setNote(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                    event.preventDefault();
                    submit();
                  }
                }}
                placeholder={gt("Leave a note (optional)")}
                rows={4}
              />
              <div
                role="radiogroup"
                aria-label={gt("Review verdict")}
                className="flex flex-col gap-1"
              >
                {options.map((option) => (
                  <label
                    key={option.value}
                    data-selected={verdict === option.value ? "true" : undefined}
                    className="sapphire-verdict flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2"
                  >
                    <input
                      type="radio"
                      name="sapphire-review-verdict"
                      value={option.value}
                      checked={verdict === option.value}
                      onChange={() => setVerdict(option.value)}
                      className="mt-1 accent-primary"
                    />
                    <span className="flex flex-col">
                      <span className="text-sm font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </DialogPanel>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => props.onOpenChange(false)}>
              {gt("Cancel")}
            </Button>
            <Button type="submit" disabled={nothingToSend}>
              {gt("Submit review")}
            </Button>
          </DialogFooter>
        </form>
      </DialogPopup>
    </Dialog>
  );
}

import { useGT } from "gt-react";
import type { ReactNode } from "react";

import type { RightPanelSurface } from "~/rightPanelStore";
import { Dialog, DialogPopup, DialogTitle } from "../ui/dialog";

/**
 * A file opened from Review mode, in a popup for a quick hand fix (a padding, a typo the agent
 * made). It edits the real file and saves as you type; closing it returns to the review.
 */
export function QuickEditDialog(props: {
  readonly surface: Extract<RightPanelSurface, { kind: "file" }> | null;
  readonly onClose: (surface: Extract<RightPanelSurface, { kind: "file" }>) => void;
  readonly renderSurface: (surface: RightPanelSurface, visible: boolean) => ReactNode;
}) {
  const gt = useGT();
  const { surface } = props;
  return (
    <Dialog
      open={surface !== null}
      onOpenChange={(open) => {
        if (!open && surface) props.onClose(surface);
      }}
    >
      <DialogPopup className="max-w-6xl" showCloseButton>
        <DialogTitle className="sr-only">
          {surface ? gt("Edit {path}", { path: surface.relativePath }) : gt("Edit file")}
        </DialogTitle>
        <div className="sapphire-quick-edit relative">
          {surface ? props.renderSurface(surface, true) : null}
        </div>
      </DialogPopup>
    </Dialog>
  );
}

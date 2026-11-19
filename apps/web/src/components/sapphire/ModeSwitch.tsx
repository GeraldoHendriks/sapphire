import { useGT } from "gt-react";

import { cn } from "../../lib/utils";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../ui/tooltip";

export type ThreadMode = "chat" | "review";

/**
 * The thread's two modes. Chat is where the agent works; Review is where the user checks and
 * tests that work. A dot on Review means the agent opened something there while you were in Chat.
 */
export function ModeSwitch(props: {
  readonly mode: ThreadMode;
  readonly reviewAvailable: boolean;
  readonly unseen: boolean;
  readonly shortcutLabel: string | null;
  readonly onChange: (mode: ThreadMode) => void;
}) {
  const gt = useGT();
  const { mode, reviewAvailable, unseen, shortcutLabel, onChange } = props;
  const label = shortcutLabel
    ? gt("Switch between Chat and Review ({shortcut})", { shortcut: shortcutLabel })
    : gt("Switch between Chat and Review");
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div
            role="tablist"
            aria-label={gt("Thread mode")}
            data-sapphire-mode-switch
            data-mode={mode}
            className="sapphire-mode-switch relative flex h-7 shrink-0 items-center rounded-full p-0.5 [-webkit-app-region:no-drag]"
          />
        }
      >
        <span aria-hidden className="sapphire-mode-switch-thumb" />
        <ModeButton active={mode === "chat"} disabled={false} onSelect={() => onChange("chat")}>
          {gt("Chat")}
        </ModeButton>
        <ModeButton
          active={mode === "review"}
          disabled={!reviewAvailable}
          onSelect={() => onChange("review")}
        >
          {gt("Review")}
          {unseen && mode !== "review" ? (
            <span
              aria-label={gt("Something new is waiting in Review")}
              className="sapphire-unseen-dot absolute top-1 right-1.5 size-1.5 rounded-full"
            />
          ) : null}
        </ModeButton>
      </TooltipTrigger>
      <TooltipPopup side="bottom">{label}</TooltipPopup>
    </Tooltip>
  );
}

function ModeButton(props: {
  readonly active: boolean;
  readonly disabled: boolean;
  readonly onSelect: () => void;
  readonly children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={props.active}
      disabled={props.disabled}
      onClick={props.onSelect}
      className={cn(
        "relative z-10 flex h-6 w-18 items-center justify-center rounded-full text-xs font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40",
        props.active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {props.children}
    </button>
  );
}

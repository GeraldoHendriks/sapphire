import { scopeThreadRef } from "@t3tools/client-runtime/environment";
import type { EnvironmentId, PreviewSessionSnapshot, ThreadId } from "@t3tools/contracts";
import { useGT } from "gt-react";
import {
  ChevronUpIcon,
  Columns2Icon,
  GlobeIcon,
  Maximize2Icon,
  Minimize2Icon,
  RefreshCwIcon,
  Rows2Icon,
  SquareTerminalIcon,
  XIcon,
} from "lucide-react";
import {
  Fragment,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useRef,
  useState,
} from "react";

import { cn } from "~/lib/utils";
import { workspaceAreaProps } from "~/lib/workspaceFocus";
import type { RightPanelSurface } from "~/rightPanelStore";
import {
  clampSplit,
  layoutForDrop,
  type ReviewDropEdge,
  type ReviewLayout,
  type ReviewPaneId,
  selectReviewLayout,
  useReviewLayoutStore,
} from "~/sapphire/reviewLayoutStore";
import { useQuietThreadShell } from "~/state/entities";
import { surfaceTitle } from "../RightPanelTabs";
import { Button } from "../ui/button";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../ui/tooltip";

const DIFF_SURFACE: RightPanelSurface = { id: "diff", kind: "diff" };
const DRAG_THRESHOLD_PX = 6;

/** Which Review pane a surface belongs to; quick-edit files open in a popup instead. */
function reviewPaneOf(surface: RightPanelSurface): ReviewPaneId | "popup" {
  switch (surface.kind) {
    case "preview":
    case "device":
      return "device";
    case "file":
      return "popup";
    default:
      return "changes";
  }
}

export interface ReviewTerminalStrip {
  readonly available: boolean;
  readonly open: boolean;
  readonly runningCount: number;
  readonly shortcutLabel: string | null;
  readonly onToggle: () => void;
  /** The thread's terminal drawer, shown under the strip while open. */
  readonly drawer: ReactNode;
}

export interface ReviewWorkspaceProps {
  readonly environmentId: EnvironmentId;
  readonly layoutKey: string;
  readonly surfaces: ReadonlyArray<RightPanelSurface>;
  readonly activeSurfaceId: string | null;
  readonly previewSessions: Readonly<Record<string, PreviewSessionSnapshot>>;
  readonly terminalLabelsById: ReadonlyMap<string, string>;
  readonly diffAvailable: boolean;
  readonly browserAvailable: boolean;
  readonly agentWorking: boolean;
  readonly snapshotStale: boolean;
  readonly pendingReviewCommentCount: number;
  readonly canSubmitReview: boolean;
  readonly terminal: ReviewTerminalStrip;
  readonly onRefreshSnapshot: () => void;
  readonly onSubmitReview: () => void;
  readonly onAddBrowser: () => void;
  readonly onActivateSurface: (surface: RightPanelSurface) => void;
  readonly onCloseSurface: (surface: RightPanelSurface) => void;
  readonly renderSurface: (surface: RightPanelSurface, visible: boolean) => ReactNode;
}

/**
 * Review mode: the thread's changes and the running app side by side, with the terminal as a
 * strip along the bottom. Panes can be swapped, stacked, resized and maximized, and the
 * arrangement is remembered per project. There is no free-form docking on purpose.
 */
export function ReviewWorkspace(props: ReviewWorkspaceProps) {
  const gt = useGT();
  const storedLayout = useReviewLayoutStore((state) =>
    selectReviewLayout(state.byProjectKey, props.layoutKey),
  );
  const updateLayout = (updater: (layout: ReviewLayout) => ReviewLayout) =>
    useReviewLayoutStore.getState().update(props.layoutKey, updater);

  const changesSurfaces: RightPanelSurface[] = [
    ...(props.diffAvailable && !props.surfaces.some((surface) => surface.kind === "diff")
      ? [DIFF_SURFACE]
      : []),
    ...props.surfaces.filter((surface) => reviewPaneOf(surface) === "changes"),
  ];
  const deviceSurfaces = props.surfaces.filter((surface) => reviewPaneOf(surface) === "device");

  // Each pane keeps its own tab, and follows the store whenever it activates one of the pane's
  // surfaces (a reveal, an opened PR, a new browser).
  const [selected, setSelected] = useState<Record<ReviewPaneId, string | null>>({
    changes: null,
    device: null,
  });
  const [followedActiveId, setFollowedActiveId] = useState<string | null>(null);
  if (props.activeSurfaceId !== followedActiveId) {
    setFollowedActiveId(props.activeSurfaceId);
    const active = props.surfaces.find((surface) => surface.id === props.activeSurfaceId);
    const pane = active ? reviewPaneOf(active) : null;
    if (active && pane !== null && pane !== "popup" && selected[pane] !== active.id) {
      setSelected({ ...selected, [pane]: active.id });
    }
  }
  const activeIn = (pane: ReviewPaneId, surfaces: ReadonlyArray<RightPanelSurface>) =>
    surfaces.find((surface) => surface.id === selected[pane]) ?? surfaces[0] ?? null;
  const activeChanges = activeIn("changes", changesSurfaces);
  const activeDevice = activeIn("device", deviceSurfaces);

  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const [liveSplit, setLiveSplit] = useState<number | null>(null);
  const [drag, setDrag] = useState<{
    readonly pane: ReviewPaneId;
    readonly startX: number;
    readonly startY: number;
    readonly active: boolean;
    readonly edge: ReviewDropEdge | null;
  } | null>(null);

  const showChanges = changesSurfaces.length > 0;
  const showDevice = deviceSurfaces.length > 0;
  const bothShown = showChanges && showDevice;
  const maximized = bothShown ? storedLayout.maximized : null;
  const split = clampSplit(liveSplit ?? storedLayout.split);
  const order: ReviewPaneId[] =
    storedLayout.first === "changes" ? ["changes", "device"] : ["device", "changes"];

  const dropEdgeAt = (clientX: number, clientY: number): ReviewDropEdge | null => {
    const rect = workspaceRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return null;
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    const candidates: Array<[ReviewDropEdge, number]> = [
      ["left", x],
      ["right", 1 - x],
      ["top", y],
      ["bottom", 1 - y],
    ];
    const [edge, distance] = candidates.reduce((best, next) => (next[1] < best[1] ? next : best));
    return distance < 0.3 ? edge : null;
  };

  const onHeaderPointerDown = (pane: ReviewPaneId) => (event: ReactPointerEvent<HTMLElement>) => {
    if (!bothShown || event.button !== 0) return;
    if ((event.target as HTMLElement).closest("button, a, input, [role='tab']")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ pane, startX: event.clientX, startY: event.clientY, active: false, edge: null });
  };
  const onHeaderPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (!drag) return;
    const moved = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
    if (!drag.active && moved < DRAG_THRESHOLD_PX) return;
    setDrag({ ...drag, active: true, edge: dropEdgeAt(event.clientX, event.clientY) });
  };
  const onHeaderPointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    if (!drag) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const { pane, active, edge } = drag;
    setDrag(null);
    if (active && edge) updateLayout((layout) => layoutForDrop(layout, pane, edge));
  };

  const onDividerPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setLiveSplit(storedLayout.split);
  };
  const onDividerPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (liveSplit === null) return;
    const rect = workspaceRef.current?.getBoundingClientRect();
    if (!rect) return;
    const next = storedLayout.stacked
      ? (event.clientY - rect.top) / rect.height
      : (event.clientX - rect.left) / rect.width;
    setLiveSplit(clampSplit(next));
  };
  const onDividerPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (liveSplit === null) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const committed = liveSplit;
    setLiveSplit(null);
    updateLayout((layout) => ({ ...layout, split: committed }));
  };

  const toggleMaximized = (pane: ReviewPaneId) => {
    if (!bothShown) return;
    updateLayout((layout) => ({ ...layout, maximized: layout.maximized === pane ? null : pane }));
  };

  const paneHeaderProps = (pane: ReviewPaneId) => ({
    onPointerDown: onHeaderPointerDown(pane),
    onPointerMove: onHeaderPointerMove,
    onPointerUp: onHeaderPointerUp,
    onPointerCancel: onHeaderPointerUp,
    onDoubleClick: (event: ReactMouseEvent<HTMLElement>) => {
      if ((event.target as HTMLElement).closest("button, a, input, [role='tab']")) return;
      toggleMaximized(pane);
    },
  });

  const layoutControls = bothShown ? (
    <>
      <IconAction
        label={storedLayout.stacked ? gt("Place side by side") : gt("Stack vertically")}
        onClick={() =>
          updateLayout((layout) => ({ ...layout, stacked: !layout.stacked, maximized: null }))
        }
      >
        {storedLayout.stacked ? <Columns2Icon /> : <Rows2Icon />}
      </IconAction>
    </>
  ) : null;

  const renderPane = (pane: ReviewPaneId) => {
    const surfaces = pane === "changes" ? changesSurfaces : deviceSurfaces;
    const active = pane === "changes" ? activeChanges : activeDevice;
    const hidden = maximized !== null && maximized !== pane;
    const isMaximized = maximized === pane;
    return (
      <section
        key={pane}
        data-review-pane={pane}
        aria-hidden={hidden}
        className={cn(
          "sapphire-pane flex min-h-0 min-w-0 flex-col overflow-hidden",
          hidden && "hidden",
          drag?.active && drag.pane === pane && "opacity-60",
        )}
        style={
          maximized === null && bothShown
            ? { flexBasis: 0, flexGrow: pane === order[0] ? split : 1 - split }
            : { flexBasis: 0, flexGrow: 1 }
        }
      >
        <header
          {...paneHeaderProps(pane)}
          className={cn(
            "sapphire-pane-header flex h-9 shrink-0 items-center gap-1 pr-1.5 pl-1",
            bothShown && "cursor-grab active:cursor-grabbing",
          )}
        >
          <div role="tablist" className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
            {surfaces.map((surface) => {
              const isActive = surface.id === active?.id;
              const closable = surface.id !== DIFF_SURFACE.id;
              return (
                <div
                  key={surface.id}
                  className={cn(
                    "sapphire-tab group/tab flex h-7 max-w-52 shrink-0 items-center rounded-md text-xs",
                    isActive ? "sapphire-tab-active text-foreground" : "text-muted-foreground",
                  )}
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => {
                      setSelected({ ...selected, [pane]: surface.id });
                      props.onActivateSurface(surface);
                    }}
                    className="flex h-full min-w-0 items-center truncate px-2.5 hover:text-foreground"
                  >
                    <span className="truncate">
                      {surface.kind === "diff" ? (
                        gt("Diff")
                      ) : surface.kind === "side-chat" ? (
                        <SideChatTitle
                          environmentId={props.environmentId}
                          threadId={surface.threadId}
                          fallback={surfaceTitle(
                            surface,
                            props.previewSessions,
                            props.terminalLabelsById,
                          )}
                        />
                      ) : (
                        surfaceTitle(surface, props.previewSessions, props.terminalLabelsById)
                      )}
                    </span>
                  </button>
                  {closable ? (
                    <button
                      type="button"
                      aria-label={gt("Close tab")}
                      onClick={() => props.onCloseSurface(surface)}
                      className="mr-1 flex size-4 items-center justify-center rounded-sm opacity-0 transition-opacity group-hover/tab:opacity-100 hover:bg-accent focus-visible:opacity-100"
                    >
                      <XIcon className="size-3" />
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
          {pane === "device" && props.browserAvailable ? (
            <IconAction label={gt("New browser tab")} onClick={props.onAddBrowser}>
              <GlobeIcon />
            </IconAction>
          ) : null}
          {pane === order[0] ? layoutControls : null}
          {bothShown ? (
            <IconAction
              label={isMaximized ? gt("Restore layout") : gt("Maximize pane")}
              onClick={() => toggleMaximized(pane)}
            >
              {isMaximized ? <Minimize2Icon /> : <Maximize2Icon />}
            </IconAction>
          ) : null}
          {pane === "changes" && props.canSubmitReview ? (
            <Button size="compact" className="ml-1" onClick={props.onSubmitReview}>
              {gt("Submit review")}
              {props.pendingReviewCommentCount > 0 ? (
                <span className="sapphire-count-badge">{props.pendingReviewCommentCount}</span>
              ) : null}
            </Button>
          ) : null}
        </header>
        <div className="relative min-h-0 flex-1">
          {active ? (
            <div
              key={active.id}
              data-right-panel-surface-content
              className="absolute inset-0 flex flex-col"
            >
              {props.renderSurface(active, !hidden)}
            </div>
          ) : null}
        </div>
      </section>
    );
  };

  const panes = order.filter((pane) => (pane === "changes" ? showChanges : showDevice));

  return (
    <div
      // The workspace focus system finds panel surfaces (side chats, terminals) in this area.
      {...workspaceAreaProps("panel", 4, gt("Review"))}
      data-sapphire-review-workspace
      className="sapphire-review-workspace absolute inset-0 flex flex-col outline-none"
    >
      {props.agentWorking ? (
        <div className="sapphire-agent-banner mx-3 mb-2 flex h-8 shrink-0 items-center gap-2 rounded-lg px-3 text-xs">
          <span aria-hidden className="sapphire-pulse size-1.5 shrink-0 rounded-full" />
          <span className="min-w-0 flex-1 truncate">
            {props.snapshotStale
              ? gt("The agent has made more changes since this snapshot.")
              : gt(
                  "The agent is still making changes. This is a snapshot; come back when it's done.",
                )}
          </span>
          {props.snapshotStale ? (
            <Button size="compact" variant="ghost" onClick={props.onRefreshSnapshot}>
              <RefreshCwIcon />
              {gt("Refresh")}
            </Button>
          ) : null}
        </div>
      ) : null}
      <div
        ref={workspaceRef}
        className={cn(
          "relative flex min-h-0 flex-1 gap-0 px-3",
          storedLayout.stacked ? "flex-col" : "flex-row",
        )}
      >
        {panes.length === 0 ? (
          <EmptyReview
            browserAvailable={props.browserAvailable}
            onAddBrowser={props.onAddBrowser}
          />
        ) : null}
        {panes.map((pane, index) => (
          <Fragment key={pane}>
            {index === 1 && maximized === null ? (
              <div
                role="separator"
                aria-orientation={storedLayout.stacked ? "horizontal" : "vertical"}
                onPointerDown={onDividerPointerDown}
                onPointerMove={onDividerPointerMove}
                onPointerUp={onDividerPointerUp}
                onPointerCancel={onDividerPointerUp}
                onDoubleClick={() => updateLayout((layout) => ({ ...layout, split: 0.5 }))}
                data-dragging={liveSplit !== null ? "true" : undefined}
                className={cn(
                  "sapphire-divider shrink-0",
                  storedLayout.stacked ? "h-2 cursor-row-resize" : "w-2 cursor-col-resize",
                )}
              />
            ) : null}
            {renderPane(pane)}
          </Fragment>
        ))}
        {drag?.active && drag.edge ? <DropPreview edge={drag.edge} /> : null}
        {liveSplit !== null ? <div className="absolute inset-0 z-40 cursor-grabbing" /> : null}
      </div>
      <TerminalStrip terminal={props.terminal} />
    </div>
  );
}

/** A side chat's tab shows the side chat's own title, like upstream's panel tabs. */
function SideChatTitle(props: {
  readonly environmentId: EnvironmentId;
  readonly threadId: ThreadId;
  readonly fallback: string;
}) {
  const shell = useQuietThreadShell(scopeThreadRef(props.environmentId, props.threadId));
  return <>{shell?.title ?? props.fallback}</>;
}

function DropPreview(props: { readonly edge: ReviewDropEdge }) {
  const position = {
    left: "inset-y-0 left-0 w-1/2",
    right: "inset-y-0 right-0 w-1/2",
    top: "inset-x-0 top-0 h-1/2",
    bottom: "inset-x-0 bottom-0 h-1/2",
  }[props.edge];
  return (
    <div
      aria-hidden
      className={cn("sapphire-drop-preview pointer-events-none absolute z-30 rounded-xl", position)}
    />
  );
}

function EmptyReview(props: {
  readonly browserAvailable: boolean;
  readonly onAddBrowser: () => void;
}) {
  const gt = useGT();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
      <p className="text-sm text-muted-foreground">{gt("Nothing to review yet.")}</p>
      {props.browserAvailable ? (
        <Button size="compact" variant="outline" onClick={props.onAddBrowser}>
          <GlobeIcon />
          {gt("Open a browser")}
        </Button>
      ) : null}
    </div>
  );
}

function TerminalStrip(props: { readonly terminal: ReviewTerminalStrip }) {
  const gt = useGT();
  const { terminal } = props;
  if (!terminal.available) return <div aria-hidden className="h-6 shrink-0" />;
  const label = terminal.shortcutLabel
    ? gt("Toggle terminal ({shortcut})", { shortcut: terminal.shortcutLabel })
    : gt("Toggle terminal");
  return (
    <div className="sapphire-terminal-strip mx-3 mt-2 mb-6 flex min-h-0 shrink-0 flex-col overflow-hidden rounded-lg">
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              onClick={terminal.onToggle}
              aria-expanded={terminal.open}
              className="flex h-7 shrink-0 items-center gap-2 px-3 text-xs text-muted-foreground hover:text-foreground"
            />
          }
        >
          <SquareTerminalIcon className="size-3.5" />
          <span>{gt("Terminal")}</span>
          {terminal.runningCount > 0 ? (
            <span className="text-muted-foreground/80">
              {gt("· {count} running", { count: terminal.runningCount })}
            </span>
          ) : null}
          <ChevronUpIcon
            className={cn(
              "ml-auto size-3.5 transition-transform duration-200",
              terminal.open && "rotate-180",
            )}
          />
        </TooltipTrigger>
        <TooltipPopup side="top">{label}</TooltipPopup>
      </Tooltip>
      {terminal.open ? <div className="min-h-0">{terminal.drawer}</div> : null}
    </div>
  );
}

function IconAction(props: {
  readonly label: string;
  readonly onClick: () => void;
  readonly children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            size="icon-sm"
            variant="ghost-muted"
            aria-label={props.label}
            onClick={props.onClick}
            className="size-7 sm:size-7 [&_svg]:size-3.5!"
          />
        }
      >
        {props.children}
      </TooltipTrigger>
      <TooltipPopup side="bottom">{props.label}</TooltipPopup>
    </Tooltip>
  );
}

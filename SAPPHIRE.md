# Sapphire

Sapphire is a fork of [T3 Code](https://github.com/pingdotgg/t3code). It keeps T3 Code's engine
(the server, providers, threads and the sidebar workflow) and changes the interface on top, the
way Zen builds on Firefox or Helium on Chromium.

## What Sapphire changes

- **Two modes per thread.** _Chat_ is where the agent works. _Review_ is where you check and test
  that work. The switch sits in the middle of the top bar.
- **No side panes.** Everything that lived in T3 Code's right panel moved into Review mode:
  - The diff, pull request and linked items share the _changes_ pane.
  - Browsers and simulators share the _device_ pane.
  - The terminal is a strip along the bottom that you can expand.
- **Panes you can arrange.** In Review mode you can drag a pane header onto an edge to swap sides
  or stack the panes, drag the divider to resize, and double-click a header to maximize. The
  layout is remembered per project. There is no free-form docking.
- **Review the way GitHub does.** Leave comments on diff lines, then _Submit review_ as
  _Comment_, _Request changes_ or _Approve_, with an optional note.
- **A dock composer.** In Review mode the composer hides at the bottom edge and slides up when you
  point at it. Once it holds anything it stays up until you close it. Sending a message returns
  you to Chat.
- **Quick edits by hand.** Opening a file from the diff opens it in a popup editor for small fixes.
  When you close it, a note tells the agent which files you changed so it keeps your edit.
- **Snapshots while the agent works.** While the agent is running, Review keeps showing the diff
  as it was when the work started and says so. Refresh, or the agent finishing, shows the latest.
- **The agent waits for you.** When an agent opens a browser or device, or a turn ends with a
  diff, Sapphire marks the Review switch with a dot instead of pulling you out of Chat. An agent
  that explicitly reveals a page still switches you to Review.
- **A quieter look.** Flat surfaces, a sapphire accent, few animations, and a plain wordmark.

## Staying close to T3 Code

- `main` tracks upstream. To update it, run `git fetch upstream` and then
  `git merge upstream/main`. Sapphire changes reach `main` only through pull requests.
- Sapphire code lives in its own files wherever possible: `apps/web/src/sapphire/`,
  `apps/web/src/components/sapphire/`, `assets/sapphire/`, and the "Sapphire" block at the end of
  `apps/web/src/index.css`.
- Edits to upstream files are kept small and marked with a `Sapphire:` comment, so merge
  conflicts are easy to read. Upstream modules Sapphire no longer uses, such as
  `ChatRightPanel.tsx`, stay in place (knip ignores them) instead of being deleted.
- `package.json` versions follow the upstream release a build is based on. T3 Code compares
  them for server and client compatibility, feature gates and database checks. Sapphire's own
  version, and the upstream commit it is based on, live in `sapphire.json`.
- Sapphire keeps its own data: the server home is `~/.sapphire`, the desktop app data folder is
  `sapphire`, and the desktop app id is `dev.sapphire.app`. It can run beside an installed
  T3 Code without sharing a database.
- The upstream GitHub workflows need T3's Blacksmith runners, so they are disabled in this
  repository's Actions settings. `.github/workflows/sapphire-ci.yml` runs the checks on GitHub's
  own runners.

## Known gaps (0.1.0)

- Agents cannot yet switch a thread's mode, or arrange its panes, through MCP tools. They can
  reveal a browser tab, which opens Review mode.
- Self-update, the `t3` CLI and SSH remote setup still use T3 Code's releases and npm package,
  because Sapphire publishes none yet. Don't use the in-app server update for now.
- Desktop packaging is renamed (Sapphire, `dev.sapphire.app`, `sapphire` executable) but has not
  been built or tested. The Linux AppStream metadata, window class and `t3code://` URL scheme are
  still T3 Code's, so they clash with an installed T3 Code.
- Mobile is untouched.

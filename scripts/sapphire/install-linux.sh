#!/usr/bin/env bash
# Installs or updates the Sapphire desktop app on Linux from the newest GitHub
# release (built by .github/workflows/sapphire-release.yml).
#
#   install-linux.sh                  install the newest release if it is new
#   install-linux.sh --file <path>    install a local AppImage instead
#   install-linux.sh --force          reinstall even when up to date
#   install-linux.sh --enable-timer   also check for new releases every 30 minutes
#   install-linux.sh --disable-timer  stop the automatic checks
#   install-linux.sh --uninstall      remove the app (keeps ~/.sapphire data)
#
# The AppImage is extracted to ~/.local/opt/sapphire/<version>, so it needs no
# FUSE and the running app keeps its files while a newer one is installed.
# The repository is private, so downloads go through an authenticated `gh`.
set -euo pipefail

repo="${SAPPHIRE_RELEASE_REPO:-GeraldoHendriks/sapphire}"
prefix="${SAPPHIRE_INSTALL_DIR:-$HOME/.local/opt/sapphire}"
data_home="${XDG_DATA_HOME:-$HOME/.local/share}"
apps_dir="$data_home/applications"
icon_dir="$data_home/icons/hicolor/512x512/apps"
units_dir="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
bin_dir="$HOME/.local/bin"
app_id="dev.sapphire.Sapphire"

file=""
force=false
action=install
while [[ $# -gt 0 ]]; do
  case "$1" in
    --file) file="$2"; shift 2 ;;
    --force) force=true; shift ;;
    --enable-timer) action=enable-timer; shift ;;
    --disable-timer) action=disable-timer; shift ;;
    --uninstall) action=uninstall; shift ;;
    -h | --help) sed -n '2,13p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown option: $1" >&2; exit 2 ;;
  esac
done

log() { echo "sapphire-update: $*"; }

installed_version() { cat "$prefix/installed-version" 2>/dev/null || true; }

notify() {
  if command -v notify-send >/dev/null 2>&1 && [[ -n "${DBUS_SESSION_BUS_ADDRESS:-}" ]]; then
    notify-send --app-name=Sapphire --icon="$app_id" "$1" "$2" 2>/dev/null || true
  fi
}

install_self() {
  mkdir -p "$prefix" "$bin_dir"
  local self
  self="$(readlink -f "$0")"
  if [[ "$self" != "$prefix/install-linux.sh" ]]; then
    install -m 0755 "$self" "$prefix/install-linux.sh"
  fi
  ln -sfn "$prefix/install-linux.sh" "$bin_dir/sapphire-update"
}

enable_timer() {
  install_self
  mkdir -p "$units_dir"
  cat > "$units_dir/sapphire-update.service" <<EOF
[Unit]
Description=Install the newest Sapphire release
Wants=network-online.target
After=network-online.target

[Service]
Type=oneshot
Nice=10
ExecStart=$prefix/install-linux.sh
EOF
  cat > "$units_dir/sapphire-update.timer" <<EOF
[Unit]
Description=Check for new Sapphire releases

[Timer]
OnStartupSec=2min
OnUnitActiveSec=30min
Persistent=true

[Install]
WantedBy=timers.target
EOF
  systemctl --user daemon-reload
  systemctl --user enable --now sapphire-update.timer >/dev/null
  log "checking for new releases every 30 minutes (systemctl --user status sapphire-update.timer)"
}

disable_timer() {
  systemctl --user disable --now sapphire-update.timer >/dev/null 2>&1 || true
  rm -f "$units_dir/sapphire-update.service" "$units_dir/sapphire-update.timer"
  systemctl --user daemon-reload
  log "automatic checks stopped"
}

uninstall() {
  disable_timer
  rm -f "$apps_dir/$app_id.desktop" "$icon_dir/$app_id.png" "$bin_dir/sapphire-desktop" "$bin_dir/sapphire-update"
  rm -rf "$prefix"
  command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database "$apps_dir" || true
  log "removed (your data in ~/.sapphire is untouched)"
}

install_appimage() {
  local appimage="$1" version="$2"
  local work target
  mkdir -p "$prefix"
  work="$(mktemp -d "$prefix/.work.XXXXXX")"
  trap 'rm -rf "$work"' RETURN

  cp "$appimage" "$work/Sapphire.AppImage"
  chmod +x "$work/Sapphire.AppImage"
  (cd "$work" && ./Sapphire.AppImage --appimage-extract >/dev/null)
  local root="$work/squashfs-root"
  local exe="$root/sapphire"
  [[ -x "$exe" ]] || { echo "No sapphire executable in the AppImage" >&2; return 1; }

  target="$prefix/$version"
  rm -rf "$target"
  mv "$root" "$target"
  echo "$version" > "$prefix/installed-version"
  ln -sfn "$version" "$prefix/current.new"
  mv -T "$prefix/current.new" "$prefix/current"

  mkdir -p "$bin_dir" "$apps_dir" "$icon_dir"
  cat > "$bin_dir/sapphire-desktop" <<EOF
#!/bin/sh
exec "$prefix/current/sapphire" "\$@"
EOF
  chmod +x "$bin_dir/sapphire-desktop"

  local icon
  icon="$(find "$target" -maxdepth 1 -name '*.png' | head -n 1)"
  [[ -n "$icon" ]] && cp "$icon" "$icon_dir/$app_id.png"

  cat > "$apps_dir/$app_id.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=Sapphire
Comment=Coding agents, with a calmer interface
Exec=$prefix/current/sapphire %U
Icon=$app_id
Terminal=false
Categories=Development;
StartupWMClass=$app_id
X-Sapphire-Version=$version
EOF
  command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database "$apps_dir" || true
  command -v gtk-update-icon-cache >/dev/null 2>&1 && gtk-update-icon-cache -q "$data_home/icons/hicolor" 2>/dev/null || true

  # Keep the new version and the one before it; a running app may still use the old files.
  local keep_previous
  keep_previous="$(ls -1t "$prefix" | grep -Ev '^(current|installed-version|install-linux\.sh)$' | grep -vx "$version" | head -n 1 || true)"
  for entry in "$prefix"/*; do
    local name="${entry##*/}"
    case "$name" in current | installed-version | install-linux.sh | "$version" | "$keep_previous") continue ;; esac
    [[ -d "$entry" ]] && rm -rf "$entry"
  done
}

case "$action" in
  enable-timer) enable_timer; exit 0 ;;
  disable-timer) disable_timer; exit 0 ;;
  uninstall) uninstall; exit 0 ;;
esac

install_self

if [[ -n "$file" ]]; then
  version="$(basename "$file" | sed -nE 's/^Sapphire-(.+)-x86_64\.AppImage$/\1/p')"
  version="${version:-local}"
  install_appimage "$file" "$version"
  log "installed Sapphire $version from $file"
  exit 0
fi

tag="$(gh release view --repo "$repo" --json tagName -q .tagName)"
version="${tag#v}"
if [[ "$version" == "$(installed_version)" && "$force" != true ]]; then
  log "Sapphire $version is up to date"
  exit 0
fi

download="$(mktemp -d)"
trap 'rm -rf "$download"' EXIT
gh release download "$tag" --repo "$repo" --pattern '*.AppImage' --pattern '*.AppImage.sha256' --dir "$download"
(cd "$download" && sha256sum --quiet -c ./*.sha256)
install_appimage "$(ls "$download"/*.AppImage)" "$version"
log "installed Sapphire $version"
if pgrep -u "$(id -u)" -f "^$prefix/" >/dev/null 2>&1; then
  notify "Sapphire $version installed" "Restart Sapphire to use the new version."
else
  notify "Sapphire $version installed" "Open Sapphire from the app menu."
fi

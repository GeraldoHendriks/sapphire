#!/usr/bin/env bash
# Installs or updates the Sapphire desktop app (.deb) from the newest GitHub
# release, built by .github/workflows/sapphire-release.yml. Runs as root.
#
#   sapphire-update                  install the newest release if it is new
#   sapphire-update --file <deb>     install a local .deb instead
#   sapphire-update --force          reinstall even when up to date
#   sapphire-update --enable-timer   install this script and check every 30 minutes
#   sapphire-update --disable-timer  stop the automatic checks
#
# A running Sapphire is never upgraded underneath itself: the install waits
# until the app is closed (the timer tries again later).
set -euo pipefail

repo="${SAPPHIRE_RELEASE_REPO:-GeraldoHendriks/sapphire}"
self_path=/usr/local/sbin/sapphire-update
unit_dir=/etc/systemd/system

file=""
force=false
action=install
while [[ $# -gt 0 ]]; do
  case "$1" in
    --file) file="$(readlink -f "$2")"; shift 2 ;;
    --force) force=true; shift ;;
    --enable-timer) action=enable-timer; shift ;;
    --disable-timer) action=disable-timer; shift ;;
    -h | --help) sed -n '2,13p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown option: $1" >&2; exit 2 ;;
  esac
done

if [[ $EUID -ne 0 ]]; then
  echo "sapphire-update needs root; run it with sudo" >&2
  exit 1
fi

log() { echo "sapphire-update: $*"; }

enable_timer() {
  install -m 0755 "$(readlink -f "$0")" "$self_path"
  cat > "$unit_dir/sapphire-update.service" <<UNIT
[Unit]
Description=Install the newest Sapphire release
Wants=network-online.target
After=network-online.target

[Service]
Type=oneshot
Nice=10
ExecStart=$self_path
UNIT
  cat > "$unit_dir/sapphire-update.timer" <<UNIT
[Unit]
Description=Check for new Sapphire releases

[Timer]
OnBootSec=2min
OnUnitActiveSec=30min
Persistent=true

[Install]
WantedBy=timers.target
UNIT
  systemctl daemon-reload
  systemctl enable --now sapphire-update.timer >/dev/null
  log "checking for new releases every 30 minutes (journalctl -u sapphire-update)"
}

disable_timer() {
  systemctl disable --now sapphire-update.timer >/dev/null 2>&1 || true
  rm -f "$unit_dir/sapphire-update.service" "$unit_dir/sapphire-update.timer"
  systemctl daemon-reload
  log "automatic checks stopped"
}

case "$action" in
  enable-timer) enable_timer; exit 0 ;;
  disable-timer) disable_timer; exit 0 ;;
esac

if pgrep -f '^/opt/Sapphire/sapphire' >/dev/null; then
  log "Sapphire is running; the update waits until it is closed"
  exit 0
fi

if [[ -n "$file" ]]; then
  apt-get install -y --allow-downgrades "$file"
  exit 0
fi

tag="$(curl -fsSL "https://api.github.com/repos/$repo/releases/latest" | jq -r .tag_name)"
[[ "$tag" == v* ]] || { echo "No release found for $repo" >&2; exit 1; }
version="${tag#v}"
installed="$(dpkg-query -W -f '${Version}' sapphire 2>/dev/null || true)"
if [[ "${installed%%+*}" == "$version" && "$force" != true ]]; then
  log "Sapphire $version is up to date"
  exit 0
fi

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
chmod 0755 "$work"
deb="sapphire_${version}_amd64.deb"
base="https://github.com/$repo/releases/download/$tag"
curl -fsSL -o "$work/$deb" "$base/$deb"
curl -fsSL -o "$work/SHA256SUMS" "$base/SHA256SUMS"
(cd "$work" && grep " $deb\$" SHA256SUMS | sha256sum --quiet -c -)
chmod 0644 "$work/$deb"
apt-get install -y --allow-downgrades "$work/$deb"
log "installed Sapphire $version"

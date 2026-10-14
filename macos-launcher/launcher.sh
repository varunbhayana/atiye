#!/bin/bash
# Maths Adventure — macOS launcher (becomes Contents/MacOS/MathsAdventure inside the .app).
# Opens the offline app in its own Google Chrome window with a dedicated profile.
# No server, no network, no ports: the app is a single local HTML file.
set -u

APP_TITLE="Maths Adventure"
SUPPORT="$HOME/Library/Application Support/MathsAdventure"
APP_DIR="$SUPPORT/app"
PROFILE_DIR="$SUPPORT/chrome-profile"
LOG_DIR="$HOME/Library/Logs/MathsAdventure"
LOG="$LOG_DIR/launcher.log"

mkdir -p "$APP_DIR" "$PROFILE_DIR" "$LOG_DIR" 2>/dev/null
log() { echo "$(date '+%Y-%m-%d %H:%M:%S') $*" >> "$LOG" 2>/dev/null; }
alert() {
  /usr/bin/osascript - "$1" <<'OSA' >/dev/null 2>&1
on run argv
  display dialog (item 1 of argv) with title "Maths Adventure" buttons {"OK"} default button "OK" with icon caution
end run
OSA
}

HERE="$(cd "$(dirname "$0")" && pwd)"
SRC="$HERE/../Resources/web/index.html"
log "launch requested (bundle: $HERE)"

if [ ! -f "$SRC" ]; then
  log "ERROR: app files missing at $SRC"
  alert "Maths Adventure could not start because its files are missing. Please copy the app again from the download."
  exit 1
fi

# Copy the app to a fixed location. This keeps the address stable even if the .app is moved
# or run from a Downloads/translocated folder, so saved progress is always found again.
if ! /usr/bin/cmp -s "$SRC" "$APP_DIR/index.html"; then
  if /bin/cp "$SRC" "$APP_DIR/index.html.tmp" && /bin/mv -f "$APP_DIR/index.html.tmp" "$APP_DIR/index.html"; then
    log "installed app files to $APP_DIR"
  else
    log "ERROR: could not copy app files"
    alert "Maths Adventure could not prepare its files (is the disk full?). Please try again."
    exit 1
  fi
fi

# file:// URL with spaces encoded
URL="file://$(printf '%s' "$APP_DIR/index.html" | /usr/bin/sed 's/ /%20/g')"

find_chrome() {
  for c in "/Applications/Google Chrome.app" "$HOME/Applications/Google Chrome.app"; do
    if [ -d "$c" ]; then echo "$c"; return; fi
  done
  /usr/bin/mdfind "kMDItemCFBundleIdentifier == 'com.google.Chrome'" 2>/dev/null | head -n 1
}
CHROME="$(find_chrome)"

if [ -z "$CHROME" ] || [ ! -d "$CHROME" ]; then
  log "Chrome not found"
  CHOICE=$(/usr/bin/osascript <<'OSA' 2>/dev/null
button returned of (display dialog "Maths Adventure is designed for Google Chrome, which is not installed on this Mac." & return & return & "You can open it in Safari instead (it still works offline), or install Google Chrome and open Maths Adventure again." with title "Maths Adventure" buttons {"Cancel", "Get Chrome", "Open in Safari"} default button "Open in Safari" with icon note)
OSA
)
  case "$CHOICE" in
    "Open in Safari") /usr/bin/open -a Safari "$URL" && log "opened in Safari" ;;
    "Get Chrome") /usr/bin/open "https://www.google.com/chrome/" ;;
  esac
  exit 0
fi

# If Maths Adventure is already running, Chrome hands this request to the existing instance
# (same profile) and simply opens/raises a window — no duplicate processes, no lost progress.
if /usr/bin/open -na "$CHROME" --args \
  --user-data-dir="$PROFILE_DIR" \
  --app="$URL" \
  --no-first-run \
  --no-default-browser-check \
  --disable-sync \
  --disable-background-networking \
  --disable-component-update \
  --disable-domain-reliability \
  --no-pings \
  --disable-features=Translate,MediaRouter,OptimizationHints \
  --window-size=1280,860; then
  log "started Chrome: $CHROME"
else
  log "ERROR: Chrome failed to start"
  alert "Google Chrome could not be started. Please open Chrome once by itself, then try Maths Adventure again."
  exit 1
fi
exit 0

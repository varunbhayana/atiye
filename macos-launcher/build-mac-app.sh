#!/bin/bash
# Builds "Maths Adventure.app" plus a .zip and .dmg in ./release
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT="$(pwd)"
VERSION="$(node -p "require('./package.json').version")"
NAME="Maths Adventure"
OUT="$ROOT/release"
APP="$OUT/$NAME.app"
WORK="$ROOT/macos-launcher/build"

echo "▶ Building web app (single offline HTML file)…"
npm run build --silent

echo "▶ Assembling $NAME.app (v$VERSION)…"
rm -rf "$APP" "$WORK"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources/web" "$WORK"
cp macos-launcher/launcher.sh "$APP/Contents/MacOS/MathsAdventure"
chmod +x "$APP/Contents/MacOS/MathsAdventure"
sed "s/__VERSION__/$VERSION/g" macos-launcher/Info.plist > "$APP/Contents/Info.plist"
cp dist/index.html "$APP/Contents/Resources/web/index.html"

echo "▶ Making the icon…"
if node macos-launcher/render-icon.mjs macos-launcher/icon.svg "$WORK/icon-1024.png" 2>/dev/null; then
  ICONSET="$WORK/AppIcon.iconset"
  mkdir -p "$ICONSET"
  for s in 16 32 128 256 512; do
    sips -z $s $s "$WORK/icon-1024.png" --out "$ICONSET/icon_${s}x${s}.png" >/dev/null
    d=$((s * 2))
    sips -z $d $d "$WORK/icon-1024.png" --out "$ICONSET/icon_${s}x${s}@2x.png" >/dev/null
  done
  iconutil -c icns "$ICONSET" -o "$APP/Contents/Resources/AppIcon.icns"
else
  echo "  (icon rendering skipped: Google Chrome not available to render the SVG)"
fi

plutil -lint "$APP/Contents/Info.plist" >/dev/null
# Ad-hoc signature so macOS treats the bundle as one consistent app (not a notarised Developer ID).
codesign --force --deep --sign - "$APP" 2>/dev/null || echo "  (codesign skipped)"
xattr -cr "$APP" 2>/dev/null || true

echo "▶ Packaging…"
cp docs/PARENT_GUIDE.md "$OUT/READ ME FIRST.md" 2>/dev/null || true
rm -f "$OUT/Maths-Adventure-macOS.zip" "$OUT/Maths-Adventure.dmg"
(cd "$OUT" && ditto -c -k --keepParent "$NAME.app" "Maths-Adventure-macOS.zip")
DMG_SRC="$WORK/dmg"
mkdir -p "$DMG_SRC"
cp -R "$APP" "$DMG_SRC/"
ln -s /Applications "$DMG_SRC/Applications"
cp "$OUT/READ ME FIRST.md" "$DMG_SRC/" 2>/dev/null || true
hdiutil create -volname "$NAME" -srcfolder "$DMG_SRC" -ov -format UDZO "$OUT/Maths-Adventure.dmg" >/dev/null && echo "  dmg created" || echo "  (dmg step failed — the .app and .zip are still usable)"

echo "✅ Done:"
ls -la "$OUT"

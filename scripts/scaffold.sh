#!/bin/bash
# Scaffold a product film project from the skill's templates.
#
#   bash scaffold.sh <film-dir> [--accent "#RRGGBB"] [--app <path-to-frontend>] [--no-install] [--no-smoke]
#
# - copies assets/templates into <film-dir>
# - wires the app path (path A: mounting real components) into remotion.config.ts + tsconfig
# - matches React to the app's major version when an app is given
# - installs pinned, known-good versions
# - generates grain tiles + a dithered glow in the accent colour
# - renders one smoke-test still (out/smoke.png) to prove the pipeline works
set -e

SKILL="$(cd "$(dirname "$0")/.." && pwd)"
DIR="$1"
[ -z "$DIR" ] && { echo "usage: scaffold.sh <film-dir> [--accent #hex] [--app path] [--no-install] [--no-smoke]"; exit 1; }
shift
ACCENT="#00c4ab"; APP=""; INSTALL=1; SMOKE=1
while [ $# -gt 0 ]; do
  case "$1" in
    --accent) ACCENT="$2"; shift 2 ;;
    --app) APP="$2"; shift 2 ;;
    --no-install) INSTALL=0; shift ;;
    --no-smoke) SMOKE=0; shift ;;
    *) echo "unknown option $1"; exit 1 ;;
  esac
done

if [ -e "$DIR/package.json" ]; then echo "$DIR already has a package.json — refusing to overwrite"; exit 1; fi
# resolve the app path relative to where the command was run, before we cd
if [ -n "$APP" ]; then
  APP_ABS="$(python3 -c "import os,sys;print(os.path.abspath(sys.argv[1]))" "$APP")"
  [ -f "$APP_ABS/package.json" ] || echo "WARN: no package.json in $APP_ABS (path A needs the app's frontend root)"
fi
mkdir -p "$DIR"
cp -R "$SKILL/assets/templates/." "$DIR/"
cd "$DIR"
FILM_ABS="$(pwd)"
mkdir -p docs public/film out

# ---- app path (path A) ----
if [ -n "$APP" ]; then
  APP_REL="$(python3 -c "import os,sys;print(os.path.relpath(sys.argv[1], sys.argv[2]))" "$APP_ABS" "$FILM_ABS")"
else
  APP_REL="../app"
fi
python3 - "$APP_REL" "$ACCENT" <<'PY'
import sys, colorsys
app_rel, accent = sys.argv[1], sys.argv[2].lstrip("#")
r, g, b = (int(accent[i:i+2], 16) / 255 for i in (0, 2, 4))
h, l, s = colorsys.rgb_to_hls(r, g, b)
br = colorsys.hls_to_rgb(h, min(0.82, l + 0.08), s * 0.9)
bright = "#" + "".join(f"{int(round(c*255)):02x}" for c in br)
for f in ("remotion.config.ts", "tsconfig.json"):
    s_ = open(f).read().replace("__APP_REL__", app_rel); open(f, "w").write(s_)
t = open("src/tokens.ts").read().replace("__ACCENT_BRIGHT__", bright).replace("__ACCENT__", "#" + accent)
open("src/tokens.ts", "w").write(t)
print(f"app: {app_rel}   accent: #{accent}  bright: {bright}")
PY

# ---- placeholder logo (replace with the product's) ----
cat > public/film/logo.svg <<SVG
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="22" fill="#1e1e1e"/><path d="M34 70 L48 30 H66 L52 70 Z" fill="$ACCENT"/></svg>
SVG

# ---- dependencies (versions proven together) ----
REACT="19.2.4"
if [ -n "$APP" ] && [ -f "$APP_ABS/package.json" ]; then
  APP_REACT="$(node -e "try{const p=require('$APP_ABS/node_modules/react/package.json');console.log(p.version)}catch(e){}")"
  [ -n "$APP_REACT" ] && REACT="$APP_REACT"
fi
if [ "$INSTALL" = "1" ]; then
  npm install --save-exact --no-audit --no-fund \
    remotion@4.0.529 @remotion/cli@4.0.529 @remotion/bundler@4.0.529 @remotion/tailwind-v4@4.0.529 \
    react@"$REACT" react-dom@"$REACT" \
    @fontsource-variable/inter-tight @fontsource-variable/geist-mono >/dev/null
  npm install --save-dev --save-exact --no-audit --no-fund \
    typescript @types/react @types/react-dom tailwindcss@4.2.0 >/dev/null
  echo "installed (react $REACT)"
fi

# react-dom shim → the film's real react-dom
REAL="$FILM_ABS/node_modules/react-dom/index.js"
python3 - "$REAL" <<'PY'
import sys
p = "src/stubs/react-dom.js"; s = open(p).read().replace("__REAL_REACT_DOM__", sys.argv[1]); open(p, "w").write(s)
PY

# ---- textures ----
python3 -c "import numpy, PIL" 2>/dev/null || echo "WARN: python3 needs numpy + pillow (pip3 install numpy pillow scipy)"
python3 -c "import scipy" 2>/dev/null || echo "WARN: the sound design needs scipy (pip3 install scipy)"
python3 scripts/gen_assets.py "$ACCENT"
command -v ffmpeg >/dev/null || echo "WARN: ffmpeg not found (brew install ffmpeg) — needed for masters and contact sheets"

# ---- smoke test ----
if [ "$INSTALL" = "1" ] && [ "$SMOKE" = "1" ]; then
  npx remotion still src/index.ts Film9x16 out/smoke.png --frame=700 --log=error && echo "smoke still: $FILM_ABS/out/smoke.png"
fi

cat <<TXT

Scaffolded $FILM_ABS
Next:
  1. src/tokens.ts      palette + fonts (the product's), BEATS, COPY
  2. src/film.css       import the app's CSS (path A) + @source
  3. remotion.config.ts STUBS for the app's API client / heavy modules
  4. src/surfaces.tsx   real UI mounts;  src/filmData.ts demo data in real shapes
  5. src/scenes.tsx     your beats;  src/Film.tsx the timeline
  6. scripts/preview.sh Film9x16  →  out/sheet-Film9x16.png
  7. scripts/master.sh 9x16 <name>  &&  scripts/master.sh 16x9 <name>
TXT

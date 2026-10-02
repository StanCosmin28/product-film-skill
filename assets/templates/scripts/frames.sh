#!/bin/zsh
# Full-res (1×) render + chosen frames, for the preview loop:  scripts/frames.sh Film9x16 120 250 400
# Preview at 1×, not --scale=0.5: at another device-pixel-ratio text can break onto different lines,
# so a half-scale preview can show layouts the master won't have.
set -e
cd "$(dirname "$0")/.."
COMP=$1; shift
npx remotion render src/index.ts ${COMP} out/full-${COMP}.mp4 --codec=h264 --crf=18 --log=error 2>&1 | grep -v "404 (Not Found)" || true
for n in "$@"; do
  ffmpeg -loglevel error -y -i out/full-${COMP}.mp4 -vf "select=eq(n\,${n})" -vsync vfr -frames:v 1 out/s-${COMP}-${n}.png
done
python3 - "$COMP" "$@" <<'PY'
import sys
from PIL import Image, ImageDraw
comp, fs = sys.argv[1], sys.argv[2:]
if not fs: sys.exit()
ims = [Image.open(f"out/s-{comp}-{n}.png") for n in fs]
w = 300 if ims[0].height > ims[0].width else 480
h = int(ims[0].height * w / ims[0].width)
cols = min(len(ims), 6)
rows = (len(ims) + cols - 1) // cols
s = Image.new("RGB", (cols * w, rows * (h + 22)), (40, 40, 40))
d = ImageDraw.Draw(s)
for i, (n, im) in enumerate(zip(fs, ims)):
    x, y = (i % cols) * w, (i // cols) * (h + 22)
    s.paste(im.resize((w, h)), (x, y + 22))
    d.text((x + 4, y + 4), f"f{n}", fill=(255, 230, 0))
s.save(f"out/grid-{comp}.png")
print(f"out/grid-{comp}.png")
PY

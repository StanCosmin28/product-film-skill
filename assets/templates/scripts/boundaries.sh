#!/bin/zsh
# Handoff check: extract frames (from-1, from) at each beat boundary of a rendered
# video and tile them side by side.  scripts/boundaries.sh out/preview-Film9x16.mp4 60 120 630
# (pass the `from` frames of every beat after the first; a half-scale preview is fine)
set -e
cd "$(dirname "$0")/.."
VIDEO=$1; shift
rm -rf out/cuts && mkdir -p out/cuts
for fr in "$@"; do
  for g in $((fr - 1)) $fr; do
    ffmpeg -loglevel error -y -i $VIDEO -vf "select=eq(n\,$g)" -vsync vfr -frames:v 1 out/cuts/f$(printf %04d $g).png
  done
done
python3 - <<'PY'
import glob
from PIL import Image, ImageDraw
fs = sorted(glob.glob('out/cuts/f*.png'))
ims = [Image.open(f) for f in fs]
w = 360; h = int(ims[0].height * w / ims[0].width)
cols = len(ims) // 2
sheet = Image.new('RGB', (w * cols, (h + 24) * 2), (40, 40, 40))
d = ImageDraw.Draw(sheet)
for i, (f, im) in enumerate(zip(fs, ims)):
    c, r = i // 2, i % 2
    sheet.paste(im.resize((w, h)), (c * w, r * (h + 24) + 24))
    d.text((c * w + 6, r * (h + 24) + 6), f.split('/')[-1], fill=(255, 230, 0))
sheet.save('out/cuts-sheet.png')
print('out/cuts-sheet.png  (top row = last frame of a beat, bottom = first frame of the next)')
PY

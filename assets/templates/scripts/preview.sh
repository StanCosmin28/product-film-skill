#!/bin/zsh
# Half-scale preview render + contact sheet every 15 frames.
set -e
cd "$(dirname "$0")/.."
COMP=${1:-Film9x16}
npx remotion render src/index.ts $COMP out/preview-$COMP.mp4 --scale=0.5 --codec=h264 --crf=22 --log=error
rm -rf out/frames-$COMP && mkdir -p out/frames-$COMP
ffmpeg -loglevel error -i out/preview-$COMP.mp4 -vf "select='not(mod(n\,15))'" -vsync vfr out/frames-$COMP/f%03d.png
python3 scripts/sheet.py out/frames-$COMP out/sheet-$COMP.png 15 0 ${2:-9} ${3:-216}

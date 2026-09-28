#!/bin/zsh
# Final master:  scripts/master.sh <9x16|16x9> [film-name] [--silent]
#  1. render SUB=4 sub-frames per frame (180° shutter) to ProRes 4444
#  2. average each group of 4 in ffmpeg at 16-bit → true motion blur (one rounding)
#  3. H.264 60 fps + the sound design at -14 LUFS, plus a silent copy
# Compositions: Film<FMT>Sub (rename COMP below if you add more films).
set -e
cd "$(dirname "$0")/.."
FMT=${1:-9x16}
NAME=${2:-film}
SILENT_ONLY=${3:-}
COMP=Film${FMT}Sub
OUT=out/$NAME-$FMT.mp4
SUBMOV=out/sub-$NAME-$FMT.mov
WAV=out/audio/sound.wav
mkdir -p out/audio
npx remotion render src/index.ts $COMP $SUBMOV --codec=prores --prores-profile=4444 --log=error
VF="format=yuv444p16le,tmix=frames=4,select=not(mod(n+1\,4)),setpts=N/(60*TB),format=yuv420p"
if [[ "$SILENT_ONLY" == "--silent" ]]; then
  ffmpeg -loglevel error -y -i $SUBMOV -filter_complex "[0:v]${VF}[v]" -map "[v]" \
    -c:v libx264 -preset slow -crf 16 -r 60 -movflags +faststart ${OUT%.mp4}-silent.mp4
else
  python3 scripts/sound.py > /dev/null
  ffmpeg -loglevel error -y -i $WAV -af "loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 ${WAV%.wav}-norm.wav
  ffmpeg -loglevel error -y -i $SUBMOV -i ${WAV%.wav}-norm.wav \
    -filter_complex "[0:v]${VF}[v]" -map "[v]" -map 1:a \
    -c:v libx264 -preset slow -crf 16 -r 60 -c:a aac -b:a 256k -movflags +faststart -shortest $OUT
  ffmpeg -loglevel error -y -i $OUT -an -c:v copy ${OUT%.mp4}-silent.mp4
fi
rm -f $SUBMOV
echo "${OUT}"

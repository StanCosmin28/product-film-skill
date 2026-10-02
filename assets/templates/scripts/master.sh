#!/bin/zsh
# Final master:  scripts/master.sh <9x16|16x9> [film-name] [--silent]
#  1. render SUB=4 sub-frames per frame (180° shutter) at SCALE× (default 2 = 4K) to ProRes 422 HQ
#  2. average each group of 4 in ffmpeg at 16-bit: true motion blur, one rounding
#  3. H.264 60 fps: a 4K master + a 1080p copy downsampled from the 4K average (supersampled),
#     the mix at -14 LUFS / -1.5 dBTP (two-pass, linear), and silent copies of both
# Sound: scripts/mix.py (real music + sfx) when it's there, else the procedural scripts/sound.py.
# REUSE=1 keeps a finished sub-frame render (re-encode only). SCALE=1 for a quick 1080p-only master.
# zsh note: always write ${VAR}: "$VAR:l..." is a zsh modifier and eats the text after the colon.
set -e
cd "$(dirname "$0")/.."
FMT=${1:-9x16}
NAME=${2:-film}
SILENT=${3:-}
SCALE=${SCALE:-2}
COMP=Film${FMT}Sub
SUBMOV=out/sub-${NAME}-${FMT}.mov
mkdir -p out/audio
[[ -s ${SUBMOV} && -n "${REUSE}" ]] || npx remotion render src/index.ts ${COMP} ${SUBMOV} --codec=prores --prores-profile=hq --scale=${SCALE} --log=error
X264=(-c:v libx264 -preset slow -crf 14 -profile:v high -x264-params aq-mode=3:aq-strength=0.9 -r 60 -movflags +faststart)
AVG="format=yuv444p16le,tmix=frames=4,select=not(mod(n+1\,4)),setpts=N/(60*TB)"
if [[ "${SCALE}" == "2" ]]; then
  VF="${AVG},split=2[hi][lo];[hi]format=yuv420p[v4k];[lo]scale=iw/2:ih/2:flags=lanczos+accurate_rnd+full_chroma_int,format=yuv420p[v1k]"
else
  VF="${AVG},format=yuv420p,split=2[v4k][v1k]"
fi
if [[ "${SILENT}" == "--silent" ]]; then
  ffmpeg -loglevel error -y -i ${SUBMOV} -filter_complex "[0:v]${VF}" \
    -map "[v4k]" ${X264} out/${NAME}-${FMT}-4k-silent.mp4 -map "[v1k]" ${X264} out/${NAME}-${FMT}-silent.mp4
else
  if [[ -f scripts/mix.py && -d audio-src ]]; then python3 scripts/mix.py > /dev/null; WAV=out/audio/mix.wav; else python3 scripts/sound.py > /dev/null; WAV=out/audio/sound.wav; fi
  NORM=${WAV%.wav}-norm.wav
  M=$(ffmpeg -hide_banner -i ${WAV} -af "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p')
  read II ITP ILRA ITH OFF <<< "$(echo ${M} | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['input_i'],d['input_tp'],d['input_lra'],d['input_thresh'],d['target_offset'])")"
  ffmpeg -loglevel error -y -i ${WAV} -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=${II}:measured_TP=${ITP}:measured_LRA=${ILRA}:measured_thresh=${ITH}:offset=${OFF}:linear=true,alimiter=limit=0.83:level=false" -ar 48000 ${NORM}
  ffmpeg -loglevel error -y -i ${SUBMOV} -i ${NORM} -filter_complex "[0:v]${VF}" \
    -map "[v4k]" -map 1:a ${X264} -c:a aac -b:a 320k -shortest out/${NAME}-${FMT}-4k.mp4 \
    -map "[v1k]" -map 1:a ${X264} -c:a aac -b:a 320k -shortest out/${NAME}-${FMT}.mp4
  ffmpeg -loglevel error -y -i out/${NAME}-${FMT}-4k.mp4 -an -c:v copy out/${NAME}-${FMT}-4k-silent.mp4
  ffmpeg -loglevel error -y -i out/${NAME}-${FMT}.mp4 -an -c:v copy out/${NAME}-${FMT}-silent.mp4
fi
rm -f ${SUBMOV}
[[ "${SCALE}" == "2" ]] || rm -f out/${NAME}-${FMT}-4k*.mp4
echo "out/${NAME}-${FMT}.mp4 (+ -4k, -silent)"

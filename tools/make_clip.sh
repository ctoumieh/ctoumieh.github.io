#!/usr/bin/env bash
# Turn a flight video (or a GIF) into a short, muted, looping web clip plus its poster frame.
#
#   bash tools/make_clip.sh INPUT NAME [START] [DURATION]
#
#   INPUT     any video ffmpeg can read: .mp4, .mov, .mkv, .webm, .gif, ...
#   NAME      output name, e.g. ral26-xfly  ->  media/clips/ral26-xfly.mp4
#                                             media/posters/ral26-xfly.jpg
#   START     where the clip starts: seconds (72) or [hh:]mm:ss (1:12). Default 0.
#   DURATION  clip length in seconds. Default 8.
#
# Optional settings, as environment variables:
#   WIDTH=1280    output width in pixels (never upscaled)
#   FPS=30        frame rate; FPS=60 for fast manoeuvres
#   CRF=24        quality: lower is sharper and larger (18 to 30 is sensible)
#   ASPECT=16:9   centre-crop to this aspect ratio first (the page frame is 16:9);
#                 ASPECT=none keeps the source framing
#   PAD=colour    pad to ASPECT with this colour instead of cropping, for sources
#                 that would lose too much, e.g. PAD=0x2f2d2f (dark grey), PAD=white
#   CROP=w:h:x:y  cut this rectangle (in source pixels) out first: one panel of a
#                 collage, or the picture without a video's black bars
#   FILTERS=...   extra ffmpeg filters applied after the crop, e.g. a colour
#                 correction: FILTERS=colorchannelmixer=rr=1.07:bb=0.85 warms a bluish video
#
# Examples:
#   FPS=60 bash tools/make_clip.sh ~/Videos/xfly_flight.mp4 ral26-xfly 1:12 8
#   PAD=0x2f2d2f WIDTH=720 bash tools/make_clip.sh circular.gif tro24-circular 0 15
#   CROP=572:322:663:290 ASPECT=none FPS=15 bash tools/make_clip.sh gif_swarmnxt.gif swarmnxt-pillars 0 14.4

set -euo pipefail

usage() { awk 'NR > 1 && /^#/ { sub(/^# ?/, ""); print; next } NR > 1 { exit }' "$0"; }
if [ $# -lt 2 ]; then usage; exit 1; fi
if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg not found. Install it with 'brew install ffmpeg' (macOS) or 'sudo apt install ffmpeg' (Linux)." >&2
  exit 1
fi

input=$1
name=$2
start=${3:-0}
duration=${4:-8}
width=${WIDTH:-1280}
fps=${FPS:-30}
crf=${CRF:-24}
aspect=${ASPECT:-16:9}
pad=${PAD:-}
crop=${CROP:-}
extra=${FILTERS:-}

if [ ! -f "$input" ]; then echo "Input not found: $input" >&2; exit 1; fi

site=$(cd "$(dirname "$0")/.." && pwd)
clip="$site/media/clips/$name.mp4"
poster="$site/media/posters/$name.jpg"
mkdir -p "$site/media/clips" "$site/media/posters"

filters=""
if [ -n "$crop" ]; then filters="crop=$crop:exact=1,"; fi   # exact: no rounding to even offsets
case "$input" in
  *.gif|*.GIF) filters="${filters}hqdn3d=1.5:1.5:6:6," ;;   # GIF dithering is noise that wastes bits
esac
if [ -n "$extra" ]; then filters="${filters}${extra},"; fi
if [ "$aspect" != "none" ]; then
  a=${aspect%%:*}
  b=${aspect##*:}
  if [ -n "$pad" ]; then
    filters="${filters}pad='ceil(max(iw,ih*$a/$b)/2)*2':'ceil(max(ih,iw*$b/$a)/2)*2':(ow-iw)/2:(oh-ih)/2:color=$pad,"
  else
    filters="${filters}crop='min(iw,ih*$a/$b)':'min(ih,iw*$b/$a)',"
  fi
fi
filters="${filters}scale='trunc(min($width,iw)/2)*2':-2:flags=lanczos,fps=$fps,format=yuv420p"

ffmpeg -nostdin -hide_banner -loglevel error -y \
  -i "$input" -ss "$start" -t "$duration" -an \
  -vf "$filters" \
  -c:v libx264 -preset slow -crf "$crf" -profile:v high -movflags +faststart \
  "$clip"

# First frame as the poster, so the still and the video hand over seamlessly.
ffmpeg -nostdin -hide_banner -loglevel error -y -i "$clip" -frames:v 1 -q:v 3 "$poster"

echo "Clip:   media/clips/$name.mp4 ($(du -h "$clip" | cut -f1))"
echo "Poster: media/posters/$name.jpg"

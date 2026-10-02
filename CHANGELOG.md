# Changelog

## v2.0 · October 2026

Distilled from a 20-second brand film (three cuts) made for stan-cosmin.com.

- **Brand films.** A second film type next to product films: pain → fix rows, the real services on a 3D carousel,
  the strategy → architecture → design → code → deploy tower, a 20 s beat template, and rules for face time.
- **Real music.** `scripts/music.py` searches Mixkit's royalty-free catalog, analyzes tracks (tempo, drops,
  spectrograms) and measures the exact beat grid. The film is cut to the track: the drop on the turn, the logo on a
  downbeat, a beat of silence before it. Procedural sound stays as a fallback.
- **Real sound effects.** `scripts/sfx_pack.py` fetches a curated pack and measures each file's peak;
  `scripts/mix.py` lands every peak on its frame, ducks the music under hits, and rides out with a low-pass sweep.
- **4K masters.** Sub-frames rendered at 2× to ProRes 422 HQ, averaged at 16-bit, delivered as 4K plus a
  supersampled 1080p, CRF 14 with `aq-mode=3`. Two-pass loudness. `REUSE=1` re-encodes without re-rendering.
- **The real logo.** Find the original file and extract the exact vector, including from Illustrator `.ai` files.
- **Kit.** `Rig` (a camera that pins any measured element to the screen), `RiseWord`, `RollWords`, `logerp`,
  `IsoGrid`, `punchAt` (camera punches on downbeats), `rectIn` (layout measuring), a `FontGate` that mounts after fonts.
- **Preview loop.** `scripts/frames.sh`: full-res renders and frame grids (half-scale previews can change line breaks).
- **Feedback rounds.** Versioned snapshots (`v1/`, `v2/`…) and a table of client notes and what they mean.
- **Example.** `assets/examples/brand-film/`: the complete source of the shipped brand film.
- Ten new pitfalls with fixes (measuring roots, fixed elements, overlay widths, swipe overlaps, zsh modifiers, certificates…).

## v1.0 · September 2026

First public release.

- Workflow: intake, UI path (live components, capture or screenshots), plan, scaffold, build, preview loop, verification, masters
- Beat templates for 10, 13, 15, 20 and 30 s
- Pace presets (kinetic, standard, calm) and style presets
- True motion blur in post (4 sub-frames, 16-bit average)
- Procedural sound design on a 120 BPM grid, -14 LUFS
- 9:16 and 16:9 masters, silent copies, posters, contact sheets and a verification report

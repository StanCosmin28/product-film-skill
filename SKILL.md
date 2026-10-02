---
name: product-film
description: Make a 10–30 s motion film for ANY app, SaaS, website, digital product or personal brand. It's built in Remotion from the product's REAL UI (its live React components when the source is available, real captures otherwise), cut to a real music track's beat, with kinetic typography, 2.5D camera moves, true motion blur, real sound effects, 4K masters and a verified story (problem → solution → one logo reveal → CTA ending on a question). Use this whenever someone asks for a product video, launch film, promo, teaser, reel / TikTok / Shorts / LinkedIn video, feature video, demo video, brand film, "about me" or services video, "video wow" or "motion graphics" for their app, site or brand, or mentions Remotion for a product, even if they don't say "film". Also use it for follow-ups on such a film: another feature video, a new cut, a different length, pace, format, style, music or no sound.
---

# Product film

You make a short film that sells a product, or a person's services, by showing **the real thing**.
Every piece of UI on screen is real: live components mounted with demo data, or a real capture of the
running app. Kinetic type carries the story. The UI is the proof. The music is a real track and the cuts
land on its beat. The result should feel like a top-tier studio made it: minimal frames, purposeful
motion, nothing generic.

This skill was distilled from five films that shipped (two product films, three cuts of a brand film).
Every rule below exists because breaking it produced a visible defect, or a note from the client.
The technical fixes live in `references/pipeline.md`. Read it before you build.

## Workflow

Work through these steps in order. Don't skip the verification step: it catches the bugs that
contact sheets reveal and a reviewer would call "glitches".

1. **Intake.** Build a brief from what you can discover, and ask only for what you can't (below).
2. **Film type.** A *product film* (launch, feature) or a *brand film* (a person or studio: who, what they
   solve, what they offer, how they work). See `references/craft.md` §1 and §2.
3. **Choose the UI path.** A: mount live components. B: capture the real app. C: use the user's screenshots.
4. **Pick the music** (`references/sound.md` §2–3): search, fetch, analyze, shortlist, measure the beat grid.
   The beat map in pass 1 is built on that grid.
5. **Pass 1.** Write the inventory, music, story, beat map (in beats, `B(n)`) and copy to `docs/PASS1.md`.
6. **Scaffold.** `bash <skill-dir>/scripts/scaffold.sh <film-dir> --accent "#RRGGBB"`
7. **Build.** tokens → surfaces → scenes → timeline, using the templates (and `assets/examples/` for patterns).
8. **Preview loop.** `scripts/frames.sh <Comp> <frames…>` (full-res) → read the grid → fix → repeat.
9. **Sound.** `scripts/sfx_pack.py`, then the cue list in `scripts/mix.py`, one line per visual event.
10. **Verify.** Run the checks below, with evidence.
11. **Master and deliver.** 4K + supersampled 1080p, motion blur, sound, silent copies, posters, a short report.
12. **Feedback round.** Snapshot the version (`v1/`, `v2/`…), apply the notes, re-master.

`<skill-dir>` is the folder containing this file.

## 1. Intake

Discover before you ask. In a repo, read the design tokens, fonts, logo files, pricing config,
marketing copy and README. For a live site, fetch the homepage. For a brand film, also read the CV,
the about page and the services. Pull real language, real prices and real numbers from there.
**Never invent claims or statistics.** If there's no source, leave the number out.

**The logo:** search the machine for the original (`.ai`, `.svg`, `.pdf`, `*logo*`, `*<brand>*`) before
using a PNG, and extract the exact vector (`pdftocairo -svg` on an `.ai`). Use its real colours. If there are
several variants, show them and ask which is primary. Never trace a PNG when a vector exists.

Ask only what blocks you, in one short message. Use these defaults for everything else and
state them in the plan:

| Knob | Default |
|---|---|
| Length | 13 s product film, 20 s brand film (60 fps) |
| Formats | 9:16 master (rendered at 2160×3840) + 16:9 (3840×2160), each also as 1080p |
| Pace | set by the track: 90–100 BPM cinematic, 110–130 BPM kinetic |
| Style | the product's own design system; if it has none, "dark editorial" (see `references/craft.md`) |
| Language | the language of the product's UI |
| Music | a real royalty-free track (Mixkit), shortlisted from data, plus 2 alternates; procedural only as fallback |
| Sound effects | real effects (Mixkit pack), peak-aligned to frames |
| Demo data | a clearly fictional demo user in the product's real data shapes |
| Person on screen | brand films: the avatar their own site shows is enough. No full-screen portrait, no signature, unless asked |
| Ending | the real logo, joined to a question headline and the real CTA component |

Blocking questions are usually just these. What's the one honest sentence the product (or person)
promises? Are there words or claims it must never use? Which 3–5 features or services matter most?
If the user already said "just do it", pick them yourself from the real copy and say which you picked.

## 2. Choose the UI path

- **A: Live components (best).** The source is available and it's React (or can be bundled by
  webpack). Mount the real components in Remotion with demo data. Everything stays crisp at any
  zoom, and you can animate elements from outside (see the pipeline reference). Use this whenever you can.
- **B: Capture.** No source, or a non-React stack. Run the app or site, and capture element-level
  screenshots (deviceScaleFactor 3) or frame sequences with Playwright. Then animate the captures
  in Remotion. Animations inside the app become short clips.
- **C: Provided screenshots.** Use them as-is. Crop and animate. Never repaint them.

Grey skeleton UI is allowed in exactly one place: the **problem** beat, where it stands for
"the old way". The product itself is never drawn by hand. Film chrome built from real data is fine:
a code panel showing the real source, a build log from a real build, a diagram of the real stack.

## 3. Pass 1: plan on paper (`docs/PASS1.md`)

Write these sections:

1. **Component inventory.** Each piece of real UI you'll show, its source path or capture URL,
   the demo data that feeds it, and whether it mounts directly or needs a capture.
2. **Music.** The track, why (tempo, drop, energy curve), the 2 alternates, and the grid
   (`BEAT`, `DROP`, the track offset). Where the drop, the breaks and the strongest downbeats fall.
3. **Story.** Problem → turn → 3–5 proof beats → logo + question + CTA. See the story patterns
   and beat templates in `references/craft.md`. Give each beat one idea and one accent payoff word.
4. **Beat map.** Frames as `B(n)`, kinetic copy, real UI, motion verb, transition out and sound cue for
   each beat. The turn sits on the drop, the logo on a downbeat, flips and swaps on snares.
   Adjacent beats hand off on an exact shared frame (the same element in the same place).
5. **Copy.** Every on-screen string, checked against the reading-time rule.
6. **Anti-slop list.** What would make *this* film look generic, and how you avoid each point.

In a one-shot request, don't stop for approval. Post the beat map in 5–8 lines and keep
going. Stop only if the user asked to review the plan first.

## 4. Scaffold

```bash
bash <skill-dir>/scripts/scaffold.sh ./product-film --accent "#00c4ab" [--app ../path-to-frontend]
```

It copies the templates, pins the dependency versions that are known to work, installs them,
and generates the grain tiles and the dithered glow in the brand accent. Then fill in:

- `src/tokens.ts`: palette, fonts, `BEAT` / `DROP` / `B(n)` / `MUSIC`, `BEATS`, `COPY` (every on-screen string), layouts.
- `remotion.config.ts`: path A only. The `APP` path, aliases and stubs (see the pipeline reference).
- `src/film.css`: import the app's own CSS in the order its entry file does. Add `@source` for Tailwind,
  and override scroll-reveal classes that start hidden.

## 5. Build

- `src/kit.tsx` holds the motion primitives: Slam, Roll, Stagger, Odometer, SlotNumber, Lanes, Shock, Sheen,
  Glow, Grain, Camera, and the v2 ones: `Rig` (the camera), `RiseWord`, `RollWords`, `logerp`, `IsoGrid`, `punchAt`.
  Extend it; don't rewrite it.
- `src/surfaces.tsx` holds the real UI mounts, `FontGate`, the readiness hooks and `rectIn` (measuring).
  One surface per real component, with demo data in a `filmData.ts` built in the product's real data shapes.
- `src/scenes.tsx` has one component per beat, with LOCAL frames. Every string comes from `COPY` and every
  timing from `BEATS`, `B(n)` or named local constants.
- `src/Film.tsx` holds one `<Sequence>` per beat, `TAIL` overlaps for the handoffs, the camera punch on
  `PUNCHES`, and the sub-frame wrapper for motion blur.
- `assets/examples/brand-film/` is a complete shipped film: copy its patterns (dot-as-period match cut,
  pain → fix flips, a 3D carousel of real cards, the layer tower, the real logo slam, the mix).

Frame 0 must already be moving. The last frame holds the logo, the question and the CTA.

## 6. Preview loop

```bash
scripts/frames.sh Film9x16 0 120 240 400 600 800      # full-res render + those frames + out/grid-Film9x16.png
scripts/boundaries.sh out/full-Film9x16.mp4 <from of each beat…>
```

Read the grid (Read the PNG). Check every beat boundary: the top row is the last frame of
a beat and the bottom row is the first frame of the next. Confirm there's no jump in scale,
scroll, position or glow, and that two scenes' text never overlaps during a swipe.
Preview at 1×: a `--scale=0.5` render can break text onto different lines than the master.
Then render one or two `--scale=2` stills of the densest frames and check them at 100%.

## 7. Verify (write the results to `docs/VERIFICATION.md`)

1. **The problem appears before the solution.** No product UI or accent colour until the turn.
2. **Every displayed time and date is chronological.** Clocks never go backwards. Countdowns only decrease.
3. **There is exactly one logo reveal, joined to the final CTA, and it's the real logo** (vector, real colours).
   Disclose any small brand mark that the product itself renders inside its UI.
4. **Figures are specific and sourced** (1,842, not 2,000). Totals add up across panels.
5. **Reading time:** each card is on screen for at least `words × 0.25 s + 0.3 s`. Report it in a table.
   UI labels that are purely decorative are the only exception, and you list them.
6. **The film ends on a question.**
7. **The cut sits on the music:** list the drop, the logo frame and the flips with their `B(n)`, and confirm
   the track offset puts the drop on the turn.
8. **Extras:** frame 0 is already moving, the handoffs are clean, safe zones hold (9:16: text within
   y 250–1620), there are no trademarked third-party names or logos in the demo data, loudness is −14 LUFS
   with TP ≤ −1.5 dBTP, and the music licence is recorded in `docs/CREDITS.md`.

## 8. Master and deliver

```bash
scripts/master.sh 9x16 <film>           # 4K sub-frames → 16-bit average → H.264 4K + 1080p, sound, silent copies
scripts/master.sh 16x9 <film>
REUSE=1 scripts/master.sh 9x16 <film>   # re-encode only, when the sub-frame render already exists
SCALE=1 scripts/master.sh 9x16 <film>   # quick 1080p-only master
```

A 4K master renders in about 12–13 min per format on a 10-core Mac, and needs ~20 GB of free disk for the
ProRes intermediate (deleted at the end). Then build contact sheets (one frame every 0.5 s) and posters
(the final frame plus the strongest frame), and report back:
- a file table with the formats, which one is the master, and which one is silent;
- a 6-line beat summary;
- the music (title, artist, licence) and the alternates you can swap in;
- decisions the user hasn't signed off on (copy, anything you replaced or hid);
- the honest caveats. You can't listen to the sound, so say so. List anything you couldn't
  render and why.

If the user will post it, offer captions per platform: LinkedIn (a story or a technical angle),
and short ones for Instagram and TikTok. Real claims only, and no price unless they asked for it.
Recommend uploading the 4K file: platforms compress better from it.

## 9. Feedback rounds

Before changing anything, copy `src/`, `scripts/` and `docs/` into `vN/`, so every cut stays reproducible.
Notes that came up on shipped films, and what they mean:

| Note | Do |
|---|---|
| "too fast" | a slower track (90–100 BPM), longer holds, masked rises instead of slams |
| "a bit faster, more wow" | a 95–110 BPM track with a hard drop, camera punches on downbeats, flips on snares |
| "too much of my photo" | cut the portrait beat; the avatar in their site's menu is enough |
| "that's not my logo" | find the original file and use its exact vector and colours |
| "more about what I offer / solve" | pain → fix rows and the real services, ahead of the person |
| "I don't like the sound" | a different genre from the shortlist (see `references/sound.md`), not a remix of the same |
| "it looks pixelated" | 4K render + supersampled 1080p, CRF 14, `aq-mode=3`, grain ≤ 3 % |

## Non-negotiables (and why)

- **Nothing runs on wall-clock time.** Disable every CSS transition and animation, and turn off
  chart libraries' animations. Remotion renders frames out of order across tabs, so anything
  timer-driven flickers.
- **Motion blur is applied in post, never in the browser.** Render 4 sub-frames per frame and average
  them in ffmpeg at 16-bit. In-browser `CameraMotionBlur` averages in 8-bit and bands gradients.
- **Counters step on whole frames.** Discrete numbers that change between sub-frames blend into
  garbage. Keep the text lines next to counters at their final values, so nothing re-wraps mid-count.
- **Handoffs end on the last frame.** An exit ease must reach 1 at `durationInFrames - 1`, not at
  `durationInFrames`. Otherwise the next beat jumps.
- **The music sets the grid, not the other way round.** Measure the track; never assume its BPM.
- **Render at 2×.** A 1080p render of a desktop UI inside a 9:16 frame puts 11 px text on screen; 4K keeps it crisp.
- **Real UI only, real claims only, the real logo.** When the product's own demo data is branded, uses real
  trademarks or would duplicate the logo reveal, make film-only data in the same shapes and say so.
- **One accent word per beat, and one logo reveal.** The restraint is what makes it look expensive.

## Reference files

- `references/craft.md`: film types, story patterns, beat templates (10 / 13 / 15 / 20 / 30 s, brand 20 s),
  pace presets, kinetic type, motion language, transitions catalogue, style presets, format safe zones,
  copy rules and the anti-slop checklist. **Read it during Pass 1.**
- `references/pipeline.md`: mounting real components, determinism, readiness, measuring the real DOM,
  the Rig camera, capture path B, devices, 4K masters, motion blur, glow and grain, performance, and every
  pitfall hit so far with its fix. **Read it before step 6.**
- `references/sound.md`: picking and measuring a real track, the beat grid, real sound effects, the mix,
  loudness, and the procedural fallback. **Read it before step 4.**
- `assets/examples/brand-film/`: a complete shipped brand film (v3), with a map of its patterns.
- `GUIDE.md` is for humans: how to ask for a film and every knob they can turn.

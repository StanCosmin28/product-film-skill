---
name: product-film
description: Make a 10–30 s kinetic launch / promo film for ANY app, SaaS, website or digital product. It's built in Remotion from the product's REAL UI (its live React components when the source is available, real captures otherwise), with fast kinetic typography, 2.5D camera moves, true motion blur, procedural sound design and a verified story (problem → solution → one logo reveal → CTA ending on a question). Use this whenever someone asks for a product video, launch film, promo, teaser, reel / TikTok / Shorts / LinkedIn video, feature video, demo video, "video wow" or "motion graphics" for their app, site or brand, or mentions Remotion for a product, even if they don't say "film". Also use it for follow-ups on such a film: another feature video, a new cut, a different length, pace, format, style, music or no sound.
---

# Product film

You make a short film that sells a product by showing **the product itself**. Every piece of UI
on screen is real: live components mounted with demo data, or a real capture of the running
app. Kinetic type carries the story. The UI is the proof. The result should feel like a
top-tier product studio made it: minimal frames, a lot of purposeful motion, nothing generic.

This skill was distilled from two films that shipped. Every rule below exists because
breaking it produced a visible defect. The technical fixes live in `references/pipeline.md`.
Read it before you build.

## Workflow

Work through these steps in order. Don't skip the verification step: it catches the bugs that
contact sheets reveal and a reviewer would call "glitches".

1. **Intake.** Build a brief from what you can discover, and ask only for what you can't (below).
2. **Choose the UI path.** A: mount live components. B: capture the real app. C: use the user's screenshots.
3. **Pass 1.** Write the inventory, story, beat map and copy to `docs/PASS1.md`.
4. **Scaffold.** `bash <skill-dir>/scripts/scaffold.sh <film-dir> --accent "#RRGGBB"`
5. **Build.** tokens → surfaces → scenes → timeline, using the templates.
6. **Preview loop.** Half-scale render → contact sheet → handoff frames → fix → repeat.
7. **Verify.** Run the checks below, with evidence.
8. **Master and deliver.** Motion-blurred masters, a silent copy, posters, contact sheets and a short report.

`<skill-dir>` is the folder containing this file.

## 1. Intake

Discover before you ask. In a repo, read the design tokens, fonts, logo files, pricing config,
marketing copy and README. For a live site, fetch the homepage. Pull real product language, real
prices and real numbers from there. **Never invent claims or statistics.** If there's no source,
leave the number out.

Ask only what blocks you, in one short message. Use these defaults for everything else and
state them in the plan:

| Knob | Default |
|---|---|
| Length | 13 s (780 frames at 60 fps) |
| Formats | 9:16 master (1080×1920) + 16:9 (1920×1080) re-frame |
| Pace | kinetic (cuts on a 120 BPM grid) |
| Style | the product's own design system; if it has none, "dark editorial" (see `references/craft.md`) |
| Language | the language of the product's UI |
| Sound | procedural sound design + a silent copy for licensed music |
| Demo data | a clearly fictional demo user in the product's real data shapes |
| Ending | a question headline + one logo reveal + the real sign-up / CTA component |

Blocking questions are usually just these. What's the one honest sentence the product
promises? Are there words or claims it must never use? Which 3–5 features matter most? If the user already
said "just do it", pick them yourself from the product's marketing copy and say which you picked.

## 2. Choose the UI path

- **A: Live components (best).** The source is available and it's React (or can be bundled by
  webpack). Mount the real components in Remotion with demo data. Everything stays crisp at any
  zoom, and you can animate elements from outside (see the pipeline reference). Use this whenever you can.
- **B: Capture.** No source, or a non-React stack. Run the app or site, and capture element-level
  screenshots (deviceScaleFactor 3) or frame sequences with Playwright. Then animate the captures
  in Remotion. Animations inside the app become short clips.
- **C: Provided screenshots.** Use them as-is. Crop and animate. Never repaint them.

Grey skeleton UI is allowed in exactly one place: the **problem** beat, where it stands for
"the old way". The product itself is never drawn by hand.

## 3. Pass 1: plan on paper (`docs/PASS1.md`)

Write these sections:

1. **Component inventory.** Each piece of real UI you'll show, its source path or capture URL,
   the demo data that feeds it, and whether it mounts directly or needs a capture.
2. **Story.** Problem → turn → 3–5 proof beats → question + logo + CTA. See the story patterns
   and beat templates in `references/craft.md`. Give each beat one idea and one teal/accent payoff word.
3. **Beat map.** Frames, kinetic copy, real UI, motion verb, transition out and audio cue for
   each beat. Adjacent beats hand off on an exact shared frame (the same element in the same place).
4. **Copy.** Every on-screen string, checked against the reading-time rule.
5. **Anti-slop list.** What would make *this* film look generic, and how you avoid each point.

In a one-shot request, don't stop for approval. Post the beat map in 5–8 lines and keep
going. Stop only if the user asked to review the plan first.

## 4. Scaffold

```bash
bash <skill-dir>/scripts/scaffold.sh ./product-film --accent "#00c4ab" [--app ../path-to-frontend]
```

It copies the templates, pins the dependency versions that are known to work, installs them,
and generates the grain tiles and the dithered glow in the brand accent. Then fill in:

- `src/tokens.ts`: palette, fonts, `BEATS`, `COPY` (every on-screen string), layouts.
- `remotion.config.ts`: path A only. The `APP` path, aliases and stubs (see the pipeline reference).
- `src/film.css`: import the app's own CSS in the order its entry file does. Add `@source` for Tailwind.

## 5. Build

- `src/kit.tsx` holds the motion primitives (Slam, Roll, Stagger, Odometer, SlotNumber, Lanes,
  Shock, Sheen, Glow, Grain, Camera). Extend it; don't rewrite it.
- `src/surfaces.tsx` holds the real UI mounts and the readiness hooks. There's one surface per real
  component, with demo data in a `filmData.ts` built in the product's real data shapes.
- `src/scenes.tsx` has one component per beat, with LOCAL frames. Every string comes from `COPY` and every
  timing from `BEATS` or named local constants.
- `src/Film.tsx` holds one `<Sequence>` per beat, small `TAIL` overlaps for the handoffs, and the
  sub-frame wrapper for motion blur.

Frame 0 must already be moving. The last frame holds the question, the logo and the CTA.

## 6. Preview loop

```bash
scripts/preview.sh <CompositionId>           # half-scale mp4 + contact sheet every 15 frames
```

Look at the sheet (Read the PNG), then check every beat boundary with
`scripts/boundaries.sh out/preview-<Id>.mp4 <from of each beat…>`. The top row is the last frame of
a beat and the bottom row is the first frame of the next. Confirm there's no jump in scale,
scroll, position or glow. Fix, re-render, and look again. Two or three loops is normal.
At the end, render full-res stills of the densest frames to check text legibility.

## 7. Verify (write the results to `docs/VERIFICATION.md`)

1. **The problem appears before the solution.** No product UI or accent colour until the turn.
2. **Every displayed time and date is chronological.** Clocks never go backwards. Countdowns only decrease.
   Lists are consistently ordered.
3. **There is exactly one logo reveal, and it's joined to the final CTA.** Disclose any small brand
   mark that the product itself renders inside its UI.
4. **Figures are specific and sourced** (1,842, not 2,000). Totals add up across panels.
5. **Reading time:** each card is on screen for at least `words × 0.25 s + 0.3 s`. Report it in a table.
   UI labels that are purely decorative are the only exception, and you list them.
6. **The film ends on a question.**
7. **Extras:** frame 0 is already moving, the handoffs are clean, safe zones hold (9:16: text within
   y 250–1620), there are no trademarked third-party names or logos in the demo data, and loudness is −14 LUFS with TP −1.5 dBTP.

## 8. Master and deliver

```bash
scripts/master.sh 9x16 <film>     # sub-frames → 16-bit average → H.264 60 fps + sound + silent copy
scripts/master.sh 16x9 <film>
```

Then build contact sheets (one frame every 0.5 s) and posters (the final frame plus the strongest
product frame), and report back:
- a file table with the formats, which one is the master, and which one is silent;
- a 6-line beat summary;
- decisions the user hasn't signed off on (demo name, copy, anything you replaced);
- the honest caveats. You can't listen to the sound, so say so. List anything you couldn't
  render and why.

If the user will post it, offer captions per platform: LinkedIn (a story or a technical angle),
and short ones for Instagram and TikTok. Real claims only, and no price unless they asked for it.

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
- **Real UI only, real claims only.** When the product's own demo data is branded, uses real
  trademarks (event names, media, sportswear logos) or would duplicate the logo reveal, make
  film-only data in the same shapes and say so.
- **One accent word per beat, and one logo reveal.** The restraint is what makes it look expensive.

## Reference files

- `references/craft.md`: story patterns, beat templates (10 / 13 / 15 / 20 / 30 s), pace presets,
  kinetic type, motion language, transitions catalogue, style presets, format safe zones, copy
  rules and the anti-slop checklist. **Read it during Pass 1.**
- `references/pipeline.md`: mounting real components (webpack config, stubs, portals, film clock,
  typing into real inputs), determinism, readiness hooks, capture path B, device frames, motion
  blur, glow and grain, performance, and every pitfall hit so far with its fix. **Read it before step 4.**
- `references/sound.md`: procedural sound design on the beat grid, the cue sheet from frame
  numbers, mixing, loudness, licensed-music handoff. **Read it before step 8.**
- `GUIDE.md` is for humans: how to ask for a film and every knob they can turn.

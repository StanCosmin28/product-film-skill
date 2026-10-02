# Craft: story, pace, type, motion, style

Contents: 1. Story patterns (product and brand films) · 2. Beat templates · 3. Pace presets ·
4. Kinetic type · 5. Motion language · 6. Transitions catalogue · 7. Style presets ·
8. Formats and safe zones · 9. Copy rules · 10. Anti-slop checklist · 11. Worked examples

---

## 1. Story patterns

Every film follows **problem → turn → proof → question**. Pick the pattern that fits the brief:

| Pattern | Shape | Good for |
|---|---|---|
| **Buried → one link** | the old way piles up (grey skeleton tiles, filenames, "link 4 of 7") → implodes into one point → the product | launch films, "all-in-one" products |
| **Stale → live** | a grey, outdated version ("last updated · 14 months ago") → a refresh sweep → real editing → it's live | editors, CMS, profiles, dashboards |
| **Before / after split** | the same task, slow on the left, instant on the right | automation, speed claims |
| **One object, many lives** | one real element transforms: link → card → story → chart | products with one core artefact |
| **Feature reel** | 3–5 features, one per beat, each with a single verb headline | feature videos in a series |

**Brand films** (a person or a studio) follow the same arc, but the "product" is what they solve and offer:

| Pattern | Shape | Good for |
|---|---|---|
| **Pain → fix** | 3 problems in grey rows, each struck through and flipped (rotateX) into the fix, on the snares | "what I solve" |
| **Real services carousel** | the site's real service cards on a 3D carousel, the front card turning on the beat, the tier name rolling above | "what I offer" |
| **The tower** | an exploded stack of real layers: strategy (process steps) → architecture (the real stack) → design (the live site) → code (the real source) → deploy (a real build log); the camera rides down, one layer lit per word | "how I work", "one person, end to end" |
| **Their own site** | the headline match cut, a pull-back into the real site in a window, the window stepping back behind the next beat | "who" without a portrait |

Rules for brand films:
- **The person appears as their site shows them**: the avatar in their own menu is enough. No full-screen
  portrait held for seconds, no signature, unless they ask. Viewers came for what they solve.
- **Lead with problems and services, then the method, then the logo.** Name and role go on the end card.
- **The fixes are their own promises**, quoted or trimmed from the site (hero, about, services, process).

Rules that make stories land:
- **The problem is visual, not a slogan.** Show the mess in grey, and keep the accent colour out until the turn.
- **The turn is one physical event:** a snap, a sweep or a morph. The product's first element grows out of that event.
- **Proof beats show the real UI doing one thing each.** Don't show two ideas in one frame.
- **End on a question aimed at the viewer** ("Where will your next sponsor find you?"),
  with the logo and the real CTA underneath. The last frame should visually rhyme with frame 0,
  so the video loops.
- **In a series**, the same end card (lanes → logo → CTA) becomes the signature. Change only the question.

## 2. Beat templates (60 fps; a 120 BPM grid means 30 frames per beat)

**13 s (780 f), the default, 7 beats:**
```
B1 problem 0–60 · B2 turn 60–120 · B3 hero proof 120–270 · B4 wow moment 270–390
B5 breadth 390–540 · B6 numbers 540–630 · B7 question+logo+CTA 630–780
```
**10 s (600 f):** problem 0–60 · turn 60–120 · proof 120–240 · proof 240–360 · proof 360–450 · end 450–600
**15 s (900 f):** 13 s plus one more proof beat (+120 f), with a longer end hold.
**20 s (1200 f):** problem 0–90 · turn 90–180 · 5 proof beats of 150 f · end 930–1200.
**30 s (1800 f):** use the **calm** pace. Add a 2–3 s product "tour" beat (a slow push through
one real screen) and allow 2 words per card more.

**20 s brand film (1200 f), cut to a 95 BPM track (one beat = 37.9 f, `B(n)` = 120 + n × 37.9):**
```
problem 0–120 (over the riser) · DROP + turn 120–272 (the dot lands on B(3)) · the real site 272–340 ·
what I solve 300–575 (flips on B(7), B(8), B(9)) · what I offer 537–753 (carousel turns on B(13), B(15)) ·
the tower 715–1010 (lights on B(16), B(17.5), B(19), B(20.5), B(22); B(16) is where the beat comes back) ·
end 1010–1200 (the logo locks on B(24), a bar downbeat)
```
Scenes overlap by 12–40 f wherever a swipe or a lift is shared; both scenes ride one curve.

Give the end card at least 150 f. The question needs about 2 s, and the CTA's reading time must fit after the logo.

## 3. Pace presets

| Preset | Cut grid | Type hits | Holds | Easing feel | Use for |
|---|---|---|---|---|---|
| **kinetic** (default) | 30 f (quarter note at 120 BPM) | every 7–15 f | ≤ 30 f | punchy springs, overshoot ≤ 6 % | Reels, TikTok, Shorts |
| **standard** | 45 f | every 15–20 f | ≤ 45 f | enter / exit curves, gentle springs | LinkedIn, landing hero |
| **calm** | 60 f (90–100 BPM) | every 30 f | ≤ 90 f | long glides, no shake, no punch | luxury, B2B, 20–30 s cuts |

With a real track, the track sets the grid: at 60 fps one beat is `3600 / BPM` frames
(95 BPM → 37.9 f, 100 → 36, 126 → 28.6). Fractional frames are fine: every cue is `B(n)`.
90–100 BPM reads as cinematic, 95–110 with a hard 808 drop as "modern and wow", 120–130 as kinetic.

To make it **slower**, raise the grid, drop the impact shake, change `Slam` to a masked rise, and double the holds.
To make it **faster**, keep the grid but add sixteenth-note UI micro-moves (7–8 f) and more roll-swaps.

## 4. Kinetic type

- **Display face** at 800 weight, uppercase for hero words, tracking −0.05 to −0.06 em,
  leading 0.86–0.92. Use the product's own display font if it has one.
- **Size in 9:16:** hero words 200–240 px alone on screen, and 120–170 px when UI shares the frame.
  **Always size headlines with `fitSize(text, max, usableWidth)`** from `kit.tsx`. Product copy
  varies, and overflowing words are the most common layout bug. For a stack, use the smallest fit of its words.
- **Moves** (in `kit.tsx`):
  - `Slam`: scale 1.35→1 in about 8 f with weight 480→800, plus a 2 f impact shake. Frame 0 starts
    mid-slam (`at: -4`).
  - `Roll`: a vertical mask push. The incoming and outgoing words ride **the same curve**, so they
    never overlap. When two headlines share a word ("Every view." / "Every click."), keep the
    shared word static and roll only the one that changes.
  - `Stagger`: per-word rise out of a baseline mask, 3 f apart. Use it for the final question
    (sentence case, 700 weight).
  - `Odometer` / `SlotNumber`: rolling digits. They move continuously, so motion blur reads as motion.
- **One accent word per beat**, the payoff ("LINK.", "RESULT.", "12", "find you?").
- A mono caption (uppercase, 0.22 em tracking) is for small supporting lines only.

## 5. Motion language

- Use **two easings** plus one punch spring: enter `cubic-bezier(0.16,1,0.3,1)`, exit
  `cubic-bezier(0.7,0,0.84,0)`, glide `cubic-bezier(0.65,0,0.35,1)` for camera moves that
  start and end at rest.
- **Every beat has a camera move:** a 2.5D tilt that settles, a push, a pull-back, a dive
  (zoom ×1.4 into the one thing that matters), or a conveyor.
- **Animate only transform and opacity** (plus clip-path for masks). Never animate a blur radius.
  Motion blur comes from the master.
- **Negative space:** one focal point per frame, and at least 40 % of the frame empty.
- **Stagger real UI from outside:** inject per-frame CSS on `:nth-child` of the real DOM
  (opacity + rise + pop) instead of rebuilding the component.

## 6. Transitions catalogue (motivated, never cross-dissolves)

| Transition | How | Example |
|---|---|---|
| Implode → point | the scene scales to 0 around the next element's point, with a slight rotation and blur | the pile of skeleton tiles collapses into the URL pill |
| Shape morph | a rounded rect interpolates from one real element's rect to the next | URL pill → phone screen |
| Pull-back reveal | zoom out from ×1.1 to ×0.7 while neighbours slide in | one phone → a reel of 12 themes |
| Lift-out | a real section lifts from the screen with a 3D tilt and scale, and the device dims | the sponsors grid lifts out of the phone |
| Side whip | the card exits sideways with rotateY and a slight rotateZ, and the next rises from the device | sponsors ← / → shop |
| Screen takeover | a real artefact grows from the device's screen rect to exactly full frame | the story export fills the 9:16 frame at 1:1 |
| Shared-curve swipe | the outgoing scene goes up and the incoming comes up **on the same easing** | story ↑ analytics |
| Refresh sweep | an accent line sweeps down and clips the old scene away | stale profile → dashboard |
| Zoom-through | scale ×5 into an object, then the next scene emerges | QR code → the opened profile |
| Lanes collapse | the brand motif's lines squeeze into the logo's plate | → the one logo reveal |
| Dot as period | a point is born on the drop, flies in and lands as the period of the real headline; it then rides that period through the pull-back | the turn |
| Match cut onto real UI | a film copy of a real element (same classes, measured box) animates, then the real one takes over pixel for pixel | headline → the live site |
| Step back | the window shrinks, tilts back (rx ~20°) and dims to ~40 % behind the next beat's content | site → "what I solve" |
| Strike and flip | a line strikes the problem, the row flips on rotateX to the fix (backface hidden), a sheen and a ring on the landing | pain → fix rows |
| Carousel turn | real cards on a circle (`translateZ(-R) rotateY(a) translateZ(R)`), the front card brighter, turning on the beat | the services |
| Tower descent | layers in Z, the stack shifts so the lit layer sits at the camera; passed layers fade fast so they never cross the headline | the method |
| Collapse to the disc | the tower implodes into a dot; the dot opens into the logo's disc, the halves slam in on an accelerating curve and lock on the downbeat | → the logo |
| Camera punch | the whole frame scales 1.022 → 1 over ~7 f on the big downbeats | the drop, the beat's return, the logo |

## 7. Style presets

Take the product's own design system if it has one. If it doesn't, pick one of these:

| Preset | Canvas | Type | Accent use | Motion |
|---|---|---|---|---|
| **Dark editorial** (default) | near-black radial gradient, film grain 5 % | heavy grotesk uppercase + mono captions | one saturated accent | kinetic |
| **Light editorial** | off-white `#f7f8fa`, soft shadows, no grain | same, ink `#0a0c10` | a darker accent (≥ 4.5:1) | standard |
| **Playful** | brand colour fields that swap per beat | rounded display, mixed case | 2 brand colours, max 1 per frame | kinetic with bouncier springs (overshoot ≤ 10 %) |
| **Luxury / calm** | deep solid colour, no grain | a high-contrast serif or light grotesk, generous tracking | metallic or none | calm |
| **Technical** | dark with a subtle grid, code-like mono | mono headlines, grotesk body | a terminal-green or brand accent | standard, with cursor and typing beats |

Glows are static and dithered (see the pipeline reference). They're never animated and never more than one per scene.

## 8. Formats and safe zones

| Format | Size | Keep text inside | Notes |
|---|---|---|---|
| 9:16 (master) | 1080×1920 | y 250–1620, x 72–1008 (right side 120 px on TikTok) | platform UI covers the top and bottom |
| 16:9 | 1920×1080 | 90 px margins | type on the left, UI on the right; a 9:16 artefact sits over its own blurred copy |
| 1:1 | 1080×1080 | 80 px margins | stack the type above the UI, with a smaller device |
| 4:5 | 1080×1350 | y 120–1230 | an Instagram feed crop of the 9:16 layout |

Every layout value lives in `layoutFor(W, H)` in `tokens.ts`. Scenes branch on
`L.portrait`, so extra formats are just more compositions.

## 9. Copy rules

- The copy is the product's own language, in short imperatives or nouns. It's 1–3 words per kinetic card, and
  the final question has at most 7–8 words.
- **Reading time:** `words × 0.25 s + 0.3 s` of on-screen time before the card's exit begins.
- **Banned by default:** revolutionary, game-changer, seamless, unlock, elevate, AI-powered,
  "Introducing", "the future of", invented user counts, and any unsourced number.
- **Figures:** specific and sourced (the demo data's real values, config limits, real prices).
  Totals must add up across panels (a breakdown line equals its total).
- **Honesty:** label demo numbers ("demo athlete", "demo data"). Don't show a price unless the user
  wants it. If you show one, use the real config value. A per-month equivalent must say "billed yearly".
- **Third parties:** no real event, media or brand names in the demo data, and no branded product photos.

## 10. Anti-slop checklist

Before rendering, confirm none of these are present:
- fake dashboards, HUD overlays or "futuristic" chrome
- particle bursts, lens flares, bokeh, glitch or RGB-split effects
- every word animated the same way; blur-in on everything
- more than one accent colour per frame; a rainbow gradient
- round or invented numbers; stock "grin" photos
- an "Introducing…" opener; the logo at both the start and the end
- a static hold longer than the preset allows; cross-dissolves
- text touching the safe-zone edges; truncated or overlapping headlines
- two scenes' headlines on screen at once during a swipe (roll the outgoing one out first)
- the person's portrait full-screen for seconds, or their signature, in a film about their services
- a traced or "close enough" logo when the real vector exists; a second brand colour invented next to it
- a procedural soundtrack when a real track could be used

## 11. Worked examples (all shipped)

**Film A, "launch" (13 s):**
YOUR · BEST · RESULTS → BURIED. (skeleton avalanche) → implode → a teal point → ONE LINK. with
a URL pill typing `product.com/yourname` → the pill morphs into the phone → EVERY RESULT. (real
profile cascade, a dive ×1.38 into the results, a medal glint) → pull back into a reel of 12
real themes (odometer 01→12) → SPONSORS. SHOP. STORY. (real sections lift out, and the real share
card takes over the full frame) → 1,842 profile views (slot digits + the real chart drawing) →
"Where will your next sponsor find you?" → lanes → the logo → the real sign-up bar.

**Film B, "features" (13 s):**
NEW RESULT. / OLD PROFILE. (a grey stale card) → refresh sweep → EDIT. (the real Add Result
dialog, typed field by field, a cursor clicks Save) → LIVE. (the new row opens on the phone) →
NEXT RACE. (the real events section with its live countdown, synced to the phone clock) →
EVERY view. / click. (real stat cards count, bars grow) → ONE SCAN. (a real QR scanned, then a
zoom-through to the profile) → "Who will look you up next?" → the same end card.

**Film C, "brand" (20 s, 3 cuts; v3 shipped).** Source in `assets/examples/brand-film/`.
Most ideas / never ship. (grey wireframes on an iso floor, over the track's riser) → implode into a white
point → **the 808 drop**: it turns green → "I build software that ships." (the real h1, the dot lands as its
period on B(3)) → pull back into the real site, which steps back → What I solve: 3 rows flip from pain to fix
on the snares → What I offer: the 3 real service cards on a carousel → the tower: Strategy (real process
steps) / Architecture (the real stack) / Design (the live site) / Code (the real hero.jsx) / Deploy (a real
build log), lit on the beat → collapse into the dot → the real logo (vector from the .ai) slams together on
B(24) after a beat of silence → name, role, "What are we building next?", the real "Let's Build" button.
Notes that shaped it: v1 was "too fast"; v2 had "too much of my photo" and "not my logo"; v3 asked for
"more about what I offer" and "more modern sound".

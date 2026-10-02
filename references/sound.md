# Sound: a real track, real effects, cut on the beat

Sound is half the perceived quality, and it's where v1 lost the client: procedural music sounded
like a demo. The default since v2 is **a real royalty-free track** that the film is cut to, plus
**real sound effects** placed on frames. Procedural sound stays as a fallback. You can't listen to any
of it, so every choice is made from data and stated as such. Tell the user to listen before publishing,
and always deliver silent copies.

## 1. The grammar

- **The track leads.** Its drop lands on the turn, its strongest downbeat on the logo, its snares on
  the flips and swaps. Measure the track first, then build the beat map on its grid.
- **The problem plays over the build** (the intro or riser before the drop), about 5 dB back.
- **The turn is the drop.** The first green dot, the first real UI, the first accent colour.
- **Every visual event gets an effect:** whooshes on camera moves, ticks on UI pops, a click on flips and
  buttons, typing under code, a confirmation on a success, a riser into the logo.
- **Silence before the logo.** The beat drops out for the last eighth notes before the logo, and the
  logo impact slams back in on the downbeat. It's the single most "wow" moment in the mix.
- **The end rides out:** after the logo the bed runs through a low-pass sweep and fades.

## 2. Find tracks (`scripts/music.py search`)

Mixkit (Envato) publishes every listing as JSON-LD, so search is a parse, not guesswork:

```bash
python3 scripts/music.py search hip-hop trap edm cinematic corporate technology future-bass
```

Tag pages are `mixkit.co/free-stock-music/tag/<tag>/`, genre pages are `mixkit.co/free-stock-music/<genre>/`.
The listing is saved to `audio-src/catalog.json`. Skip titles named after real artists ("X type beat").

Genre by brief (what worked):

| Brief | Look at | Example that shipped |
|---|---|---|
| modern creator, tech founder, "more wow" | trap / hip-hop with an 808 drop, 90–100 BPM | "Thunder" (Arulo), 95 BPM |
| dark, premium, cinematic | ambient / synthwave with a late drop | "Cyberpunk City" (A. M.), 100 BPM |
| upbeat SaaS, corporate | EDM / house, 120–128 BPM, four-on-the-floor | "Golden Storm" (Diego Nava), 126 BPM |

## 3. Measure (`scripts/music.py fetch / analyze / grid`)

```bash
python3 scripts/music.py fetch 318 470 140 1167 369
python3 scripts/music.py analyze 318 470 140 1167 369   # tempo, the 3 biggest drops, audio-src/analysis.png
python3 scripts/music.py grid 318 --drop 20.2           # exact beat (hat-grid fit) + the downbeat at the drop
```

Read `analysis.png`. A **drop** is where the low band (20–120 Hz) turns solid after a thin stretch; a
**riser** is a rising diagonal right before it; a **break** is a gap in the low band. Pick the track whose
drop strength and structure fit the story: a build of 1.5–3 s you can put under the problem, a drop, then
at least 15 s of beat with one break you can use for a scene change.

`grid` fits every hi-hat onset onto one grid (least squares), which is far more precise than a median
interval, then snaps the kick at the drop onto it. Write the result into `tokens.ts`:

```ts
export const BEAT = 0.63154 * FPS;          // from music.py grid
export const DROP = 120;                    // the turn's frame
export const B = (n: number) => DROP + n * BEAT;
export const MUSIC = { file: "audio-src/m318.mp3", start: 20.208 - DROP / FPS } as const;
export const LOGO_AT = B(24);               // a bar downbeat
```

Snares in trap usually sit on odd beats after the drop (B(1), B(3)…). Bars are every 4 beats.

**Licence.** Mixkit Stock Music Free License: free for commercial and personal projects, no attribution,
don't redistribute the track on its own. Record the track, artist and licence in `docs/CREDITS.md`, and tell
the user to re-read mixkit.co/license before a paid campaign.

## 4. Effects (`scripts/sfx_pack.py`)

```bash
python3 scripts/sfx_pack.py          # the curated pack -> audio-src/sfx/ + meta.json (onset, peak, tail)
python3 scripts/sfx_pack.py 2900     # add ids from mixkit.co/free-sound-effects/<category>/
```

The pack's roles are in the script (whooshes, sweeps, UI clicks, typing, confirmations, trailer impacts,
risers). `meta.json` stores where each file **peaks**: a "whoosh impact" may peak 1 s in, a riser at its end.
`mix.py` lands the peak on the cue frame, so the listener hears the hit exactly when it's seen.
Look at the envelopes (`ffmpeg ... showwavespic`) before choosing a logo hit: a swell with no transient
won't feel like a lock.

## 5. The mix (`scripts/mix.py`)

One cue per visual event, copied from the scenes, with a comment:

```python
place("s2908", DROP_FILM, -9)               # the drop: the green dot is born
place("s2577", Bt(7), -10)                  # a row flips on the snare
place("s2537", Bt(20.5), -15, trim=(6.9, 7.6), fade=0.04)  # code types in
place("s788", LOGO, -2)                     # the logo impact (its rise starts ~1.4 s early)
duck_at(LOGO, -6)
```

Levels that worked: effects −10 to −20 dB, impacts −5 to −9, the logo impact −2. The intro sits at −5 dB,
and the pre-logo mute is −22 dB. When a scene's timing moves, move its cue.

## 6. Loudness

`master.sh` runs a two-pass `loudnorm` (measure, then apply linearly, no pumping) to −14 LUFS with a
−1.5 dBTP true peak, then a limiter. Verify with `ebur128=peak=true`: integrated about −14 LUFS and the
peak under −1.5 dBFS. Look at the waveform: it needs visible dynamics, a thinner intro, a wall on the drop,
and a dip before the logo.

## 7. Variants the user may ask for

| Ask | Do |
|---|---|
| **no sound** | `scripts/master.sh 9x16 <name> --silent` |
| **a different feel** | another genre from the shortlist, re-run `grid`, re-time `B(n)`; keep the beat map's structure |
| **their own track** | measure it with `music.py analyze/grid`, then the same rules |
| **voice-over** | a script of at most 2.3 words per second, music −8 dB under the voice, the logo on the last word's beat |
| **calmer** | 90–100 BPM, no camera punches, whooshes only |
| **punchier** | a harder drop, punches on every bar, a click on every swap |

## 8. Fallback: procedural sound

When there's no network or the user wants no licensed audio, `scripts/sound.py` + `scripts/sfx.py` build a
score in numpy on the film's grid (kick, hats, pad, sub, impacts, whooshes, risers, the logo sting). It sounds
like a demo next to a real track; say so. `master.sh` uses it automatically when there's no `audio-src/`.

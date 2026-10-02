# Product Film: guide

This skill makes a 10–30 second launch, promo or **personal brand** video for your app, SaaS, website
or services. The video is built from **your real UI**: your actual components with demo data, or real
captures of your app. It's cut to the beat of a **real music track** (royalty-free, picked and measured
for you), with real sound effects on every move, kinetic typography, 2.5D camera moves, real motion blur,
and 4K masters. The story checks itself: the problem comes before the solution, there's one logo reveal
(your real logo), it ends on a question, and every claim is real.

You get:
- `…-9x16-4k.mp4` (Reels, TikTok, Shorts) and `…-16x9-4k.mp4` (YouTube, LinkedIn, website), plus 1080p copies
- `…-silent.mp4` copies, to put your own music under
- `docs/CREDITS.md` (the track, the artist, the licence)
- posters (cover frames) and contact sheets (one frame every 0.5 s)
- `docs/PASS1.md` (the plan) and `docs/VERIFICATION.md` (the checks, with evidence)

---

## 1. Requirements

- **Claude Code** with this folder at `~/.claude/skills/product-film/` (it's picked up automatically)
- **Node 18+**, **ffmpeg** (`brew install ffmpeg`), **Python 3** with `numpy scipy pillow`
  (`pip3 install numpy scipy pillow`)
- macOS or Linux, and about 20 GB of free disk while a 4K master renders (it's freed at the end)
- `curl` (for the music and sound effects), and `poppler` (`brew install poppler`) if your logo lives in an `.ai` or `.pdf`
- **Remotion license:** free for individuals and companies with up to 3 employees. Larger companies
  need a company license (remotion.dev/license).

**Sharing the skill:** zip the `product-film` folder. The other person unzips it into their own
`~/.claude/skills/`, and that's it.

---

## 2. The one-shot prompt

Open Claude Code **in your product's repo** (best) or in an empty folder (for a website-only product).
Paste this, fill in what you know and delete what you don't. The skill picks sensible
defaults for everything you leave out.

```text
Make a product film for <PRODUCT> using the product-film skill. One shot: don't stop for approval.

Product: <what it is, in one line>
Source: <this repo | ../frontend | https://yoursite.com (no source)>
Honest promise (one sentence): <what it really does for the user>
Features to show (3–5, in order of importance): <…>
Audience + platform: <e.g. athletes · TikTok / Reels>
Length: <10 | 13 | 15 | 20 | 30> s    Pace: <kinetic | standard | calm>
Style: <our design system | dark editorial | light editorial | playful | luxury | technical>
Formats: <9:16 + 16:9 | also 1:1 | also 4:5>
Type: <product film | brand film about me and my services>
Music: <pick a track for me | modern trap / hip-hop | cinematic | upbeat EDM | my own track: <file> | silent only>
Language: <English | Română | …>
Never say / never show: <banned words, competitor names, prices…>
CTA: <our real sign-up component | "Try it free" | …>
Demo user name: <e.g. "ProAthlete" | pick a neutral one>
```

**Short version.** This works too, because the skill discovers the rest from your repo:
```text
Use product-film to make a 13 s wow launch video for this app, 9:16 and 16:9, with sound. One shot.
```

**A brand film (you and your services):**
```text
Use product-film to make a 20 s brand film about me and my services, from my site in this repo.
Focus on what I solve and what I offer, not my photo. My logo is in ~/Design. Modern, wow, cut to a real track.
9:16 and 16:9, 4K. One shot.
```

**In Romanian:**
```text
Folosește skill-ul product-film și fă-mi un video de 13 secunde pentru aplicația din acest repo,
ceva wow, kinetic, doar cu componente reale, 9:16 și 16:9, cu sunet. Textul din video în engleză.
Fără prețuri. One shot, nu te opri să mă întrebi.
```

---

## 3. The knobs (say any of these in plain words)

| You want | Say something like | What changes |
|---|---|---|
| **Slower / calmer** | "calmer pace", "more premium, slower" | a 90–100 BPM track, longer holds, glides instead of punches |
| **Faster / punchier** | "more kinetic", "faster cuts", "more wow" | a track with a hard drop, camera punches on the downbeats, flips on the snares |
| **A brand film** | "about me and my services" | pain → fix rows, your real services on a carousel, the strategy → deploy tower |
| **Another music feel** | "more modern", "cinematic", "EDM" | a new shortlist in that genre, re-measured; the cut moves to its beat |
| **Less of me** | "less of my photo" | your site's own avatar only; no portrait, no signature |
| **Your real logo** | "use my logo from <file>" | the exact vector and colours from the file |
| **Longer / shorter** | "make it 20 seconds", "a 10 s cut" | beat map template for that length (10 / 13 / 15 / 20 / 30 s) |
| **Another style** | "light version", "playful", "luxury", "techy with code vibes" | style preset (canvas, type, accent use, motion) |
| **Your brand colours / fonts** | "use our Figma colours #… and font …" | tokens.ts palette + fonts (defaults come from your code) |
| **No sound** | "no sound", "silent only" | only `-silent` masters |
| **Your own music** | "use this track: song.mp3" | it measures the track's beat and drop, and cuts the film to it |
| **Voice-over** | "add a voice-over script" | a script of at most 2.3 words/s, space in the mix, logo on the last word |
| **Other formats** | "also square", "also 4:5 for the feed" | extra compositions with their own safe zones |
| **Another language** | "text in Romanian" | the COPY strings, with reading time rechecked |
| **Different ending** | "end with: 'Ready for race day?'" | the final question (always a question) |
| **Show a price** | "show 'from €3.33/mo, billed yearly'" | a real config price only; "billed yearly" stays with it |
| **Feature video** | "now a video only about the analytics" | same system, new beats, same end card as a series signature |
| **A new cut** | "same film, but swap beat 4 for the shop" | edits scenes and cues, re-verifies, re-masters |

Knobs you rarely need: the demo user's name, the demo photos, the accent word per beat, the grain amount,
motion-blur strength (shutter), the logo animation style.

---

## 4. How the skill works (so you know what to expect)

1. **Intake.** It reads your design tokens, fonts, logo, copy and pricing, and asks only what it can't find.
2. **UI path.** A mounts your real React components (best). B captures your running app or site.
   C uses screenshots you give it. It never redraws your UI by hand.
3. **Music.** It searches a royalty-free catalog, analyzes 10–15 tracks (tempo, drop, structure), picks one
   plus 2 alternates, and measures its beat grid. The film's beats are built on that grid.
4. **Plan.** It writes the story, the beat map in beats, the on-screen copy and an anti-"AI slop" list.
5. **Build.** It scaffolds a Remotion project next to your app (`scripts/scaffold.sh`) and writes the scenes.
6. **Preview loop.** Full-res renders, frame grids and frame-by-frame checks of every cut.
7. **Sound.** Real sound effects, each landing its peak on a frame, mixed under the track.
8. **Verify.** The problem comes before the solution, times are chronological, there's one logo reveal
   with the CTA, figures are real, reading time is enough, the cut sits on the beat, and it ends on a question.
9. **Master.** Rendered at 4K, 4 sub-frames per frame averaged into real motion blur, a supersampled
   1080p copy, −14 LUFS audio, and silent copies.

Render time on a recent Mac: about 1 min for a full-res preview, and about 12–13 min per 4K master.

---

## 5. Changing a finished film yourself

Inside the film folder:

| Change | Where |
|---|---|
| Any on-screen text | `src/tokens.ts` → `COPY` |
| Colours, fonts | `src/tokens.ts` → `C`, `F`, `FONT_FACES` |
| Timing of beats | `src/tokens.ts` → `BEATS`, `B(n)` (and the matching cues in `scripts/mix.py`) |
| Music | `src/tokens.ts` → `MUSIC`, `BEAT`, `DROP`, and `scripts/mix.py` (see `scripts/music.py`) |
| Demo user / data | `src/filmData.ts` |
| Logo | `public/film/logo.svg` |

```bash
npm run studio                           # live preview in the browser (scrub the timeline)
scripts/frames.sh Film9x16 0 300 600     # full-res render + those frames in out/grid-Film9x16.png
python3 scripts/music.py analyze 318 470 # compare tracks (tempo, drops, spectrograms)
python3 scripts/mix.py                   # rebuild the sound only
scripts/master.sh 9x16 myfilm            # final 9:16: 4K + 1080p (+ silent copies)
scripts/master.sh 16x9 myfilm            # final 16:9
REUSE=1 scripts/master.sh 9x16 myfilm    # re-encode only (after a sound change)
scripts/master.sh 9x16 myfilm --silent   # no sound at all
```

**Keep the film out of git** (for example if it's local-only): add the folder to `.git/info/exclude`.
That file is local; `.gitignore` is committed.

---

## 6. When something looks off

| You see | Ask Claude | Usual cause |
|---|---|---|
| a "glitch" on numbers | "the counters glitch" | numbers changing between motion-blur sub-frames. It steps them on whole frames |
| a jump between two scenes | "there's a jump at 4.5 s" | a handoff not ending on the last frame. It re-checks boundaries |
| text cut at the edges | "the headline overflows" | the copy got longer. Every headline uses fitSize |
| rings in the glow | "banding in the background" | a glow drawn with a CSS gradient. It swaps in the dithered glow |
| wrong or old data in the UI | "use the new demo data" | `filmData.ts` |
| the sound feels off | "I don't like the music", "more modern", "calmer" | another genre from the shortlist, re-measured (it can't listen, so tell it what you hear) |
| it looks pixelated | "make it sharper" | 4K render + a supersampled 1080p copy; upload the 4K file |
| two headlines at once in a transition | "text overlaps at 12 s" | the outgoing text rolls out before the incoming one rolls in |

---

## 7. What the skill will refuse to fake

- **UI:** no invented dashboards, and no hand-drawn "screens" of your product.
- **Numbers:** no invented user counts, revenue or stats. Demo numbers get a "demo" label.
- **Third parties:** no real trademarks or third-party brands in the demo data.
- **The logo:** your real one, from your own file, once, at the end, joined to your CTA.
- **Music:** only tracks it can licence for you (royalty-free, recorded in `docs/CREDITS.md`).

If something can't be rendered deterministically (for example real-time 3D physics), it tells
you, and it offers a captured clip instead.

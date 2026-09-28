# Product Film: guide

This skill makes a 10–30 second launch or promo video for your app, SaaS or website. The
video is built from **your real product UI**: your actual components with demo data, or real
captures of your app. It uses fast kinetic typography, 2.5D camera moves, real motion blur and a sound
design synced to every cut. The story checks itself: the problem comes before the solution, there's one logo reveal,
it ends on a question, and every claim is real.

You get:
- `…-9x16.mp4` (Reels, TikTok, Shorts) and `…-16x9.mp4` (YouTube, LinkedIn, website)
- `…-silent.mp4` copies, to put your own licensed music under
- posters (cover frames) and contact sheets (one frame every 0.5 s)
- `docs/PASS1.md` (the plan) and `docs/VERIFICATION.md` (the checks, with evidence)

---

## 1. Requirements

- **Claude Code** with this folder at `~/.claude/skills/product-film/` (it's picked up automatically)
- **Node 18+**, **ffmpeg** (`brew install ffmpeg`), **Python 3** with `numpy scipy pillow`
  (`pip3 install numpy scipy pillow`)
- macOS or Linux, and about 3 GB of free disk while a master renders
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
Sound: <sound design | silent only | I'll add music at <BPM> BPM | voice-over script>
Language: <English | Română | …>
Never say / never show: <banned words, competitor names, prices…>
CTA: <our real sign-up component | "Try it free" | …>
Demo user name: <e.g. "ProAthlete" | pick a neutral one>
```

**Short version.** This works too, because the skill discovers the rest from your repo:
```text
Use product-film to make a 13 s wow launch video for this app, 9:16 and 16:9, with sound. One shot.
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
| **Slower / calmer** | "calmer pace", "more premium, slower" | 60-frame grid, longer holds, glides instead of punches, no shake |
| **Faster / punchier** | "more kinetic", "faster cuts" | 7–8 frame micro-moves, more word swaps, stronger springs |
| **Longer / shorter** | "make it 20 seconds", "a 10 s cut" | beat map template for that length (10 / 13 / 15 / 20 / 30 s) |
| **Another style** | "light version", "playful", "luxury", "techy with code vibes" | style preset (canvas, type, accent use, motion) |
| **Your brand colours / fonts** | "use our Figma colours #… and font …" | tokens.ts palette + fonts (defaults come from your code) |
| **No sound** | "no sound", "silent only" | only `-silent` masters |
| **Your own music** | "I'll use a track at 128 BPM" | the cut grid is retimed to 128 BPM, cuts land on downbeats, silent master delivered |
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
3. **Plan.** It writes the story, the beat map with exact frames, the on-screen copy and an anti-"AI slop" list.
4. **Build.** It scaffolds a Remotion project next to your app (`scripts/scaffold.sh`) and writes the scenes.
5. **Preview loop.** Half-scale renders, contact sheets and frame-by-frame checks of every cut.
6. **Verify.** The problem comes before the solution, times are chronological, there's one logo reveal
   with the CTA, figures are real, reading time is enough, and it ends on a question.
7. **Master.** 4 sub-frames per frame averaged into real motion blur, −14 LUFS audio, and silent copies.

Render time on a recent Mac: about 25 s for a preview, and about 3–4 min per final master.

---

## 5. Changing a finished film yourself

Inside the film folder:

| Change | Where |
|---|---|
| Any on-screen text | `src/tokens.ts` → `COPY` |
| Colours, fonts | `src/tokens.ts` → `C`, `F`, `FONT_FACES` |
| Timing of beats | `src/tokens.ts` → `BEATS` (and the matching lines in `scripts/sound.py`) |
| Demo user / data | `src/filmData.ts` |
| Logo | `public/film/logo.svg` |

```bash
npm run studio                       # live preview in the browser (scrub the timeline)
scripts/preview.sh Film9x16          # quick half-scale render + contact sheet
scripts/master.sh 9x16 myfilm        # final 9:16 (+ silent copy)
scripts/master.sh 16x9 myfilm        # final 16:9
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
| the sound feels off | "calmer sound", "no hats", "punchier" | `scripts/sound.py` presets (it can't listen, so tell it what you hear) |

---

## 7. What the skill will refuse to fake

- **UI:** no invented dashboards, and no hand-drawn "screens" of your product.
- **Numbers:** no invented user counts, revenue or stats. Demo numbers get a "demo" label.
- **Third parties:** no real trademarks or third-party brands in the demo data.
- **The logo:** it appears once, at the end, joined to your CTA.

If something can't be rendered deterministically (for example real-time 3D physics), it tells
you, and it offers a captured clip instead.

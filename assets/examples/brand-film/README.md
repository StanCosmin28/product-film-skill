# Worked example: a personal brand film (20 s)

The source of the stan-cosmin.com film made with this skill (v3, October 2026). It's a reference, not a
template: read it when you build a brand or services film, and copy the patterns you need.

It mounts the real site (`../stc.com`: Menu, Hero, ProofStrip, Services) through the `@app` alias, so it
won't run on its own. The assets (fonts, the logo, the music, the sfx) aren't included.

| Pattern | Where |
|---|---|
| A real track: drop on the turn, beat helper `B(n)`, logo on a downbeat | `src/tokens.ts` (BEAT, DROP, B, LOGO_AT, PUNCHES) |
| The green dot: born on the drop, lands as the period of the real h1 | `scenes.tsx` → `Site` (dot flight, `H1Copy` overlay) |
| Match cut onto the real headline, then a pull-back into the site | `siteCamera()` with `Rig` (`kit.tsx`) |
| Measuring the real DOM: offsets, line widths, a fixed menu | `surfaces.tsx` → `SitePage`, `rectIn` |
| Pain → fix rows that flip on the snares | `scenes.tsx` → `Solve` |
| The real service cards on a 3D carousel | `scenes.tsx` → `ServicesScene` + `surfaces.tsx` → `ServicesDeck` |
| An exploded tower: strategy / architecture / design / code / deploy | `scenes.tsx` → `How` + `StrategyPanel`, `ArchPanel`, `CodePanel`, `BuildPanel` |
| The real logo from the .ai file, halves slamming on the 808 | `surfaces.tsx` → `RealLogo`, `scenes.tsx` → `EndCard` |
| Music + real sfx, peak-aligned, pre-logo mute, low-pass ride-out | `scripts/mix.py` |
| Camera punch on the downbeats | `Film.tsx` |

`PortraitCard` in `surfaces.tsx` is from v2. It was cut after feedback: in a brand film the person's
avatar in their own site's menu is enough. Keep face time short unless they ask for more.

# Pipeline: the technical playbook

Contents: 1. Project layout · 2. Path A: mounting real components · 3. Determinism ·
4. Readiness · 5. Animating real UI from outside · 6. Special cases (dialogs, typing, clocks,
charts, counters, QR) · 7. Path B: capture · 8. Devices and windows · 9. Motion blur, glow, grain ·
10. Handoffs · 11. Rendering and performance · 12. Pitfalls hit so far (with fixes) ·
13. Measuring the real DOM · 14. The Rig camera and match cuts · 15. 4K masters · 16. The real logo

---

## 1. Project layout

```
<film>/
  package.json  remotion.config.ts  tsconfig.json  .gitignore
  public/film/       grain-0..3.png, glow.png (scaffold makes them), demo photos, logo, device art
  src/
    index.ts  Root.tsx      compositions: <Id>9x16, <Id>16x9, and the *Sub versions for masters
    tokens.ts               palette, fonts, easing, BEATS, COPY, layoutFor()
    kit.tsx                 motion primitives (frame-driven only)
    surfaces.tsx            real UI mounts + readiness hooks + device frames
    filmData.ts             film-only demo data in the product's REAL data shapes
    scenes.tsx              one component per beat (local frames)
    Film.tsx                <Sequence> per beat + TAIL overlaps + FilmSubframes
    film.css                app CSS imports + film overrides
    stubs/                  api.js, react-dom.js (inline portals), heavy-module stubs
  scripts/  preview.sh  master.sh  sheet.py  sfx.py  sound.py
  docs/     PASS1.md  VERIFICATION.md
```
Keep the film **next to** the app (`../app`), not inside it, so the app's build never sees Remotion.
If the user doesn't want it in git, add it to `.git/info/exclude`, not `.gitignore`, because
that file is committed.

## 2. Path A: mounting the app's real components

The webpack override (`assets/templates/remotion.config.ts`) does six things. Each one fixed a real failure:

1. **Aliases into the app:** `@app` → `../app/src`, plus any other roots (themes, config).
2. **One React:** Remotion already aliases `react`. Add `react-dom$` and `react-dom/client` →
   the film's copy. Without this, the app's files resolve their own react-dom and hooks crash.
3. **Shared libraries from the app's `node_modules`:**
   `resolve.modules: ["node_modules", "<app>/node_modules"]`. The film's own code then imports the
   router, icons and chart libraries as the **same module instances** the components use
   (one router context). Don't alias a package directory: that breaks `exports` subpaths such as
   `react-router/dom`.
4. **`fullySpecified: false`** for `.m?jsx?`. A `"type": "module"` app with Vite-style
   extensionless imports fails otherwise ("Did you mean 'Button.jsx'?").
5. **`?raw` imports → `asset/source`**, and exclude `resourceQuery: /raw/` from the default image
   rule. Vite apps inline SVGs this way.
6. **Stubs** via `NormalModuleReplacementPlugin`:
   - the **API client**. It usually reads `import.meta.env.*`, which is undefined under webpack and
     crashes at import. The stub exports every named API as an inert Proxy (grep the component
     tree for the names it imports).
   - **heavy or real-time modules** that never render in the film: 3D scenes, canvas exporters (html2canvas),
     analytics SDKs, service workers.
   - **react-dom** → `stubs/react-dom.js`, which re-exports everything but makes `createPortal`
     render in place when `window.__filmInlinePortals` is set (see §6).

**Tailwind v4 apps:** use `enableTailwind` from `@remotion/tailwind-v4`. Import the app's CSS in
the same order as its entry file, then add `@source "../../app/src/..."` so the class names
are generated. `@tailwindcss/webpack` resolves `@import "tailwindcss"` itself. Pin
`tailwindcss` to the version it depends on. **Tailwind v3:** use `@remotion/tailwind` with the app's config.
**CSS-in-JS / CSS modules:** usually no work is needed; `css-loader` modules are on.

**Media queries follow the video viewport** (1080 or 1920 wide), not the phone you draw. Inside a
393 px device, `sm:`/`lg:` variants still apply. Override the layout with scoped CSS where needed
(`.scope .grid{grid-template-columns:repeat(2,…)!important}`). That's film-level layout, not a redraw.

**Contexts:** wrap the mounts in the providers they need (router: `MemoryRouter`, toast, theme,
auth mocks). Most components render fine with static props and `noop` handlers.

**Fonts:** the app's self-hosted fonts load through css-loader. `FontGate` holds the first
frame until `document.fonts.load()` resolves for each family and weight you use. Public pages
often use the **system font** (SF on iPhone). Match what a real visitor sees.

## 3. Determinism (the rule behind most bugs)

Remotion renders frames in several tabs, out of order. Anything driven by wall-clock time or
`Math.random()` flickers.

- `film.css`: `*,*::before,*::after{transition:none!important;animation:none!important}`.
  CSS enter animations that only reach their final state through the animation must not start
  hidden. Check this for dialogs and toasts.
- **Chart libraries:** turn their animation off. For Recharts, mutate `defaultAreaProps.isAnimationActive = false`
  (a deep import of the same module instance). Don't set `Global.isSsr`: it also disables
  tick-collision logic and crowds the axis.
- **Seeded data:** replace `Math.random()` series with a seeded PRNG (mulberry32), and anchor
  dates to a fixed "today".
- **Component state that timers drive:** remount with a `key` that changes when the displayed value
  should change (for example once per film second), so state re-initialises deterministically.
- **All motion from `useCurrentFrame()`**, including springs (they accept fractional frames).

## 4. Readiness (never capture a half-loaded frame)

- `FontGate`: `delayRender` until the fonts load, and **mount the children only after that**, so every
  layout effect measures final text metrics (the template does this).
- `useImagesReady(ref)`: set `loading="eager"` on every `<img>`, then `img.decode()` them all.
  Lazy images inside transformed containers are otherwise missed.
- `useSelectorReady(ref, selector)`: for async layouts (a chart that measures its container). Poll
  with rAF until the selector exists, then wait two more frames.
- **Use local media only.** Download demo photos into `public/film/`, with no network calls during the render.
- **Root-relative images.** Apps write `src="/avatar.png"`; Remotion serves `public/` elsewhere. Copy the
  files into the film's `public/` and rewrite the src with `staticFile()` in `useImagesReady` (the template does).
- **Scroll-reveal classes** (`.reveal`, `[data-aos]`, `.af-reveal`…) start at opacity 0 and wait for an
  IntersectionObserver that never fires in a render. Override them in `film.css`, scoped to the mount.

## 5. Animating real UI from outside

- **Per-frame scoped CSS:** `<ScopedStyle css={cascadeCSS(f, fps, items)} />`, where each item is
  `{ sel: ".scope .list > :nth-child(3)", at, y, pop }`, gives an opacity + rise + pop stagger over
  the real DOM. Read the component source to pick stable selectors.
- **Clip-draws:** `clip-path: inset(... X% 0 0)` on a chart's series group gives a left-to-right draw.
- **Insert a new row:** switch the data to include it (remount via `key`), then animate its
  `max-height` from 0 → the row height, plus opacity. The siblings move naturally.
- **Glint:** a `::after` gradient sweep on the badge element, plus a scale punch.
- **Count-ups:** pass the interpolated number as the component's prop (value = final × t). See §6
  for sub-frames.
- **Lift-out:** render the same section again as a separate surface, start it at the device's screen
  rect and scale, spring it to its target, and dim the device (`filter: brightness(.42)`).

## 6. Special cases

**Dialogs and portals.** App dialogs portal to `<body>` and escape your camera. With the
`react-dom` shim and `window.__filmInlinePortals = true`, `createPortal` returns its children
in place. Put the dialog inside a container with `transform: translateZ(0)`: that container becomes
the containing block for the dialog's `position: fixed`. Drive the open and close pop yourself
(scoped CSS on `[role=dialog]` and the scrim).

**Typing into a real form.** Open the real "Add" dialog (no prefill, so its title stays "Add…"),
remount it every frame (`key={frame}`), and after commit type the draft into its inputs:
```ts
setTimeout(() => {                   // after commit, not inside it
  for (const [id, value] of fields) {
    const el = root.querySelector(`#${id}`);
    flushSync(() => {                // one field per flush: onChange spreads the LAST render's state
      Object.getOwnPropertyDescriptor(proto(el), "value").set.call(el, value);
      el.dispatchEvent(new Event(el.tagName === "SELECT" ? "change" : "input", { bubbles: true }));
    });
  }
  requestAnimationFrame(() => continueRender(handle));
}, 0);
```
Dispatching all fields in one batch keeps only the last one (a stale closure). Highlight the
active field with scoped CSS (accent border + ring). A drawn cursor (an SVG arrow) is acceptable film chrome.

**Clocks and countdowns.** Patch `Date` so that `new Date()` with **no arguments** returns
`window.__filmNow`. The film root sets it every frame:
`FILM_NOW + frame / fps * 1000`. Start "now" at the phone status bar's time (for example 09:41:00),
so everything agrees. Keep `Date.now()` real, because Remotion needs it. Remount countdown
components once per film second. The result: the card, the kinetic mirror and the phone all tick
together and only count down.

**Counters under motion blur.** Compute `t` from `Math.floor(frame)`. All 4 sub-frames then
show the same integer, and the number steps crisply at 60 fps. Keep **adjacent text at its final
value** (breakdown lines, per-row counts): a changing length re-wraps or re-truncates the line
every frame, which reads as a glitch. Continuous rollers (`Odometer`, `SlotNumber`) are
fine, because their motion blurs like real motion. Add `font-variant-numeric: tabular-nums` where
you can.

**QR codes.** Use the product's own generator library and settings. Prefer an SVG renderer over
canvas, which draws in an effect after paint. Encode the real public URL (for example the homepage),
so viewers who scan the video land somewhere real. Don't encode a demo profile that doesn't exist.

**3D, WebGL and physics.** Real-time physics isn't frame-deterministic. Either capture it from the real
app as a clip (path B) or leave it out and say why. `@remotion/three` works only for scenes
you drive from `useCurrentFrame()`.

## 7. Path B: capturing the real app or site

- Run the app (or use the live URL). Use Playwright, Chromium, and
  `deviceScaleFactor: 3`, with a viewport matching the target device (393×852 phone,
  1440×900 desktop).
- Capture **elements, not full pages**: `locator.screenshot({ omitBackground: true })` for each
  card, row or section. This lets you stagger and lift them like live components.
- For in-app animations you need (a 3D badge, a live chart), record a short clip. Use the CDP
  screencast or `recordVideo`, then convert it to an image sequence. In Remotion, play it with
  `<OffthreadVideo>` or `<Img>` per frame. Keep these to 1–2 s.
- Log in with a demo account or seed demo data. Never capture real users' data.
- Store the captures in `public/film/capture/` and list each one in the PASS1 inventory with its URL.

## 8. Devices and windows

- **Phone:** use the product's own device art if its marketing site has one (mirror its screen
  insets). Otherwise use the template's CSS phone. Render the content at the true logical width
  (393 px), scale it into the screen rect, and give it an explicit viewport height. A status bar
  shows a fixed time that matches the film clock.
- **Desktop window:** use the product's own "app window" chrome if it has one (an address pill with
  its URL and a "Live" beacon). Otherwise use the template's `BrowserWindow`. Give the body an explicit
  height with `overflow: hidden`.
- **The 2.5D `Camera`:** a perspective wrapper with rotateX/Y/Z + scale. Settle tilts with a spring
  (`damping 20, mass .9, stiffness 120`).

## 9. Motion blur, glow, grain

- **Motion blur = sub-frames + ffmpeg.** `FilmSubframes` renders `SUB = 4` samples per frame at
  `floor(k/4) + (k%4) × 0.5/4` (a 180° shutter) into ProRes 4444. `master.sh` averages them at
  `yuv444p16le` (`tmix=frames=4, select=not(mod(n+1\,4))`), which rounds once. **Don't use
  `CameraMotionBlur`:** it stacks 8-bit layers at opacity 1/N, which halves the gradient levels
  (visible rings) and leaves artefacts under `filter:`.
- **Glow:** a pre-rendered, dithered radial PNG in the accent colour (`gen_assets.py`), drawn with
  `<Img>`. CSS radial gradients on near-black band in 8-bit video.
- **Grain:** 4 static noise tiles, one per whole frame (`Math.floor(frame)`), with an overlay blend
  at about 5 %. Keep grain **outside** the averaged content, or share one pattern across the sub-frames.

## 10. Handoffs (a beat's last frame = the next beat's first frame)

- Share the geometry between adjacent beats through functions (`heroPhone(L)`, `pillRect(L)`) or
  named constants (`ZOOM.handoff`, `SCROLL.reel`), not magic numbers in both places.
- **Exit ranges end on the last frame:** `prog(f, start, duration - 1, EASE.exit)`. At the last
  frame an exit ease sitting at t = 0.93 is still about 0.75, which produces a visible jump.
- Match everything that was on screen: scale, scroll, glow position and opacity, and floor shadow.
- Use `TAIL` overlaps (for example 10–12 frames) when both beats must render during a transition (a swipe or
  a lane wipe). Put the whole shared transition on the **same easing** in both beats.
- **Check it:** extract frames `from-1` and `from` for every beat and compare them side by side.

## 11. Rendering and performance

- Preview with `scripts/frames.sh` at 1×: about 40–60 s for 780–1200 frames. Avoid `--scale=0.5` for
  layout checks: at another device-pixel-ratio text breaks onto different lines.
- Preview: `--scale=0.5` renders 780 frames in about 25 s (motion only, not layout). A full-res master with 4 sub-frames (3,120 frames)
  takes about 3–4 min on a 10-core Mac, and the ProRes intermediate is about 2 GB. Delete it afterwards.
- `Config.setConcurrency(6)`, `setChromiumOpenGlRenderer("angle")`, PNG frames.
- Virtualise off-screen UI (only render reel items within about 2.6 of centre).
- Run long renders in the background and watch for their exit. Don't pipe a render to `grep`
  under `set -e`: the pipe hides the failure, and the next `&&` step runs anyway (it once deleted a
  finished intermediate).

## 12. Pitfalls hit so far

| Symptom | Cause | Fix |
|---|---|---|
| "Can't resolve './Button'" | app is ESM with extensionless imports | `resolve.fullySpecified: false` |
| hooks crash / invalid hook call | two react-dom copies | alias `react-dom$` + `react-dom/client` |
| `react-router/dom` not found | aliased a package directory | use `resolve.modules` fallback instead |
| crash at import: `import.meta.env` | API client under webpack | stub the API module |
| blank chart on first frame | responsive container measures async | `useSelectorReady` |
| chart drawn half-way / flicker | library animation on wall-clock | disable its animation |
| crowded axis ticks | forcing SSR mode in the chart lib | don't; disable the animation only |
| digits garbled mid-count | number changes between sub-frames | step `t` on `Math.floor(frame)` |
| text re-wraps while counting | variable-length line next to counter | show final values in secondary lines |
| headline flickers on swap | two headlines share a word, both roll | keep the shared word static |
| rings in glows | 8-bit CSS gradient and/or in-browser motion blur | dithered PNG glow + ffmpeg sub-frame blur |
| centre item flies out with the neighbours | `Math.sign(off)` is ±1 for a tiny off | `side = |off| > 0.5 ? sign : 0` |
| jump at a beat boundary | exit ease ends at `duration`, not `duration-1` | end ranges on the last frame |
| only the last form field is filled | batched input events, stale closure | one `flushSync` per field after commit |
| dialog escapes the camera | portal to body | inline-portal shim + transformed container |
| countdown differs across frames | component timer + real time | film clock `Date` patch + per-second remount |
| `inputRange must contain only finite numbers` | an interpolation to `Infinity` (open-ended last item) | guard with `Number.isFinite` |
| `No such filter: ''` in ffmpeg | zsh `$VAR[v]` is an array subscript | write `${VAR}[v]` |
| a trademark visible in the product photo | demo data used a brand shot | swap for neutral images |
| words vanish from generated files | backticks inside an unquoted shell heredoc (`<<EOF`) run as commands | quote the heredoc delimiter (`<<'EOF'`) |
| headline overflows the frame | fixed font size + a longer word in the product copy | `fitSize()` for every headline |

## 13. Measuring the real DOM

Overlays, camera targets and match cuts need the real elements' boxes. Measure **layout offsets**
(`rectIn(el, root)` in `surfaces.tsx`: sums `offsetLeft/Top` up the `offsetParent` chain). They ignore CSS
transforms, so they're right under any camera move, at any frame a render tab starts on.
- The root, and any container you measure inside, needs `position: relative`. Otherwise the chain skips it,
  sums all the way to `<body>`, and every target lands hundreds of pixels off.
- `position: fixed` elements (a site's nav) and elements centred with the `translate` property have no
  usable offsets. Measure them with `getBoundingClientRect()` against their container's rect and divide by
  `rect.width / offsetWidth` (one ratio undoes the camera's scale). Only valid while the camera has no rotation.
- Text widths: put each word in its own span and read the spans' offsets; for a single word inside a
  full-width heading, measure with a canvas (`ctx.font` from `getComputedStyle`, plus `letterSpacing × length`).
- Measure once in a layout effect, hold the frame with `delayRender` until the numbers are in state.
- Viewport units follow the video (`82vh` of 1920 px is 1574 px). Override min-heights in scoped CSS.

## 14. The Rig camera and match cuts

`Rig` pins an actor point `A` (actor coordinates, centre at 0,0) to a screen point `cam`, then scales by `s`
and rotates. With no rotation, `screen = cam + s × (p − A)`, so you can:
- **dive** into any measured element (interpolate `A` towards it and `s` up, in log space with `logerp`);
- **pull back** from a zoomed headline into the whole window, then tilt into an iso plane (rx 60, rz −45);
- put a **screen-space overlay exactly on a real element** (a dot on a period, a card on an avatar).

**Match cut onto real text.** Render a film copy of the element with the *same classes* (so the same
font, size, tracking, wrapping) at the measured box, split into word spans you can animate. Hide the real
element while the copy plays, then swap on a frame where both are at rest. Give the copy `width + 1px`:
`offsetWidth` rounds down, and a copy 0.4 px narrower can wrap where the real one doesn't.

**Shared-curve swipes.** Two scenes in overlapping `<Sequence>`s, both translating on one global-frame curve.
Roll the outgoing scene's headline out a few frames before the incoming one rolls in, and fade the outgoing
scene's big elements as they cross the incoming headline.

## 15. 4K masters

- Render the sub-frames with `--scale=2` (2160×3840 / 3840×2160) to **ProRes 422 HQ**: about 3.7 MB per frame,
  ~18 GB for a 20 s film with 4 sub-frames. ProRes 4444 at 4K would be ~40 GB. Check `df -h` first.
- Average at 16-bit, then split: the 4K master, and a 1080p copy downscaled from the 4K average with
  `lanczos+accurate_rnd+full_chroma_int` (supersampled: sharper than a native 1080p render).
- H.264 `-crf 14 -profile:v high -x264-params aq-mode=3:aq-strength=0.9`. `aq-mode=3` keeps dark gradients
  from blocking. Grain at ≤ 3 %: more grain costs bitrate and reads as compression.
- `REUSE=1 scripts/master.sh …` re-encodes from an existing sub-frame render (an audio or encode fix in 2 min
  instead of 13).
- zsh: write `${VAR}` in scripts. `$OFF:linear` is parsed as the `:l` (lowercase) modifier and silently eats
  `inear`; it broke a loudnorm call after a 13-minute render.

## 16. The real logo

- Search before you trace: `mdfind -onlyin ~ "kMDItemFSName == '*logo*'"`, plus the brand's handle, for
  `.ai`, `.svg`, `.pdf`, `.png`. Illustrator `.ai` files are PDFs: `pdfinfo` lists the artboards,
  `pdftoppm -r 40 -png` renders a contact sheet, `pdftocairo -svg -f N -l N` extracts one artboard as exact paths.
- Keep the mark's own structure (two halves → two paths you can slide), its exact fill colours, and its disc.
- Show the user the variants you found when it isn't obvious which is primary.

| Symptom | Cause | Fix |
|---|---|---|
| every overlay lands far off | measured root not `position: relative` | position the root and the containers in the chain |
| the nav avatar's box is wrong | fixed / `translate`-centred element measured by offsets | bounding-rect ratio against its container |
| the overlay copy wraps differently | `offsetWidth` rounded down | copy width + 1 px |
| a preview shows a different layout than the master | half-scale preview (DPR 0.5) | preview at 1× (`frames.sh`) |
| words overlap mid-swap | incoming/outgoing on different easings, or moving by % of their own box | one easing, move by the line height in px |
| a swipe shows two headlines | both scenes' text visible during the overlap | roll the outgoing text out first; fade the outgoing scene |
| images 404 in the render | root-relative `src` | copy into `public/`, rewrite with `staticFile()` |
| empty sfx file after a failed download | file opened before the request | fetch, then write |
| `CERTIFICATE_VERIFY_FAILED` in a Python fetch | python.org build without root certificates | fetch with `curl` |
| loudnorm "Invalid chars 'inear=true'" | zsh `:l` modifier on `$VAR:linear` | `${VAR}` everywhere |

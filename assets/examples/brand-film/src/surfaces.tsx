// Surfaces: where the site's REAL UI is mounted (path A), readiness + measuring
// hooks, and film chrome (browser window, code / build panels, the S mark).
// Rule: nothing here redraws the site's UI. The panels show real text (the hero's
// source and a real build log); the window frame is film chrome.
import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import { MemoryRouter } from "react-router-dom";
import { continueRender, delayRender, Img, staticFile } from "remotion";
import { lerp, Sheen, type Pt } from "./kit";
import Menu from "@app/components/menu";
import Hero from "@app/components/hero";
import ProofStrip from "@app/components/proof-strip";
import Services from "@app/components/services";
import { BUILD, C, CODE, COPY, F, FONT_FACES } from "./tokens";

// ============================================================================
// Readiness
// ============================================================================
/** Children mount only after the fonts load, so every measurement sees final metrics. */
export const FontGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [handle] = useState(() => delayRender("film: fonts"));
  const [ready, setReady] = useState(false);
  useLayoutEffect(() => {
    Promise.all(FONT_FACES.map((f) => document.fonts.load(f)))
      .then(() => document.fonts.ready)
      .then(() => {
        setReady(true);
        requestAnimationFrame(() => continueRender(handle));
      });
  }, [handle]);
  return ready ? <>{children}</> : null;
};

const decodeAll = (el: HTMLElement) => {
  const imgs = Array.from(el.querySelectorAll("img"));
  imgs.forEach((img) => {
    // the site references its public/ files from the root ("/me_profile.png")
    const raw = img.getAttribute("src") ?? "";
    if (raw.startsWith("/") && !raw.startsWith("/static")) img.src = staticFile(raw.slice(1));
    img.loading = "eager";
    img.decoding = "sync";
  });
  return Promise.all(imgs.map((img) => (img.complete && img.naturalWidth > 0 ? Promise.resolve() : img.decode().catch(() => undefined))));
};

/** Per-frame CSS aimed at the real DOM inside a scope class. */
export const ScopedStyle: React.FC<{ css: string }> = ({ css }) => <style>{css}</style>;

// ============================================================================
// Measuring: layout offsets (transform-independent) relative to a root
// ============================================================================
export type Rect = { x: number; y: number; w: number; h: number };
const rectIn = (el: HTMLElement | null, root: HTMLElement): Rect => {
  let x = 0;
  let y = 0;
  const w = el?.offsetWidth ?? 0;
  const h = el?.offsetHeight ?? 0;
  while (el && el !== root) {
    x += el.offsetLeft;
    y += el.offsetTop;
    el = el.offsetParent as HTMLElement | null;
  }
  return { x, y, w, h };
};
export const center = (r: Rect) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
const byText = (root: HTMLElement, sel: string, text: string) =>
  Array.from(root.querySelectorAll<HTMLElement>(sel)).find((e) => e.textContent?.trim().startsWith(text)) ?? null;

export type SiteMetrics = {
  h1: Rect;
  period: Rect; // the period of "ships." (in page coords)
  avatar: Rect; // the nav avatar, in window-viewport coords (the menu is fixed)
  pageH: number;
  lineW: number; // widest line of the headline (page px)
};

// ============================================================================
// The real site: Menu (fixed, stays on top) + Hero + ProofStrip + Projects
// ============================================================================
const RealMenu = React.memo(() => <Menu />);
const RealSections = React.memo(() => (
  <>
    <Hero />
    <ProofStrip />
  </>
));

/**
 * The page at a logical width. `scroll` moves the sections (the menu stays put,
 * like the live site). `overlay` renders inside the page's coordinate space (the
 * film's copy of the h1 sits exactly on the real one). Reports its measurements once.
 */
export const SitePage: React.FC<{
  width: number;
  scroll: number;
  onMetrics: (m: SiteMetrics) => void;
  overlay?: React.ReactNode;
  menu?: boolean;
}> = ({ width, scroll, onMetrics, overlay, menu = true }) => {
  const ref = useRef<HTMLDivElement>(null);
  const outer = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const root = ref.current!;
    decodeAll(outer.current!).then(() => {
      const h1 = root.querySelector<HTMLElement>("h1")!;
      const copy = root.querySelector<HTMLElement>("[data-film=h1copy]");
      const period = copy?.querySelector<HTMLElement>("[data-film=period]") ?? null;
      const h1r = rectIn(h1, root);
      const pr = period && copy ? rectIn(period, copy) : { x: 0, y: 0, w: 0, h: 0 };
      // headline lines, from the copy's word boxes (offsets ignore the camera's transforms)
      const lines = new Map<number, [number, number]>();
      copy?.querySelectorAll<HTMLElement>("[data-film=w], [data-film=ships], [data-film=period]").forEach((el) => {
        const r = rectIn(el, copy);
        const k = Math.round(r.y / 10);
        const cur = lines.get(k) ?? [Infinity, -Infinity];
        lines.set(k, [Math.min(cur[0], r.x), Math.max(cur[1], r.x + r.w)]);
      });
      const lineW = Math.max(0, ...Array.from(lines.values()).map(([a, b]) => b - a));
      // the menu is position:fixed (and centred with `translate`), so offsets can't place it:
      // measure it against the viewport box. The camera is 2D while this runs, so one ratio undoes its scale.
      const view = outer.current!.parentElement!;
      const img = outer.current!.querySelector<HTMLElement>("header img");
      const vb = view.getBoundingClientRect();
      const k = vb.width / view.offsetWidth;
      const ib = img?.getBoundingClientRect();
      const avatar = ib ? { x: (ib.left - vb.left) / k, y: (ib.top - vb.top) / k, w: ib.width / k, h: ib.height / k } : { x: 0, y: 0, w: 32, h: 32 };
      onMetrics({
        h1: h1r,
        period: { ...pr, x: pr.x + h1r.x, y: pr.y + h1r.y },
        avatar,
        pageH: root.offsetHeight,
        lineW,
      });
    });
    // measure once: layout is static
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div ref={outer}>
      <MemoryRouter initialEntries={["/"]}>
        {menu ? <RealMenu /> : null}
        <div ref={ref} className="site-page" style={{ position: "relative", width, transform: `translateY(${-scroll}px)` }}>
          <RealSections />
          {overlay}
        </div>
      </MemoryRouter>
    </div>
  );
};

/** Scene-side state for the page measurements: holds the frame until they arrive. */
export const useSiteMetrics = () => {
  const [handle] = useState(() => delayRender("film: site metrics"));
  const [m, setM] = useState<SiteMetrics | null>(null);
  const onMetrics = useCallback((v: SiteMetrics) => {
    setM(v);
  }, []);
  useLayoutEffect(() => {
    if (m) requestAnimationFrame(() => requestAnimationFrame(() => continueRender(handle)));
  }, [m, handle]);
  return [m, onMetrics] as const;
};

/**
 * The film's copy of the hero h1: the SAME classes as hero.jsx, so it lays out
 * glyph for glyph like the real one, but split into words the film can animate.
 * `rise(i)` 0→1 per word. The period stays hidden: the green dot lands there.
 */
export const H1Copy: React.FC<{ at: { x: number; y: number; w: number }; rise: (i: number) => number; opacity?: number }> = ({
  at,
  rise,
  opacity = 1,
}) => {
  const words = [...COPY.turn.words];
  const mask: React.CSSProperties = { display: "inline-block", overflow: "hidden", verticalAlign: "top", padding: "0.04em 0 0.14em", margin: "-0.04em 0 -0.14em" };
  const inner = (i: number): React.CSSProperties => ({ display: "inline-block", transform: `translateY(${(1 - rise(i)) * 112}%)` });
  return (
    <h1
      data-film="h1copy"
      className="text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-[-0.045em] leading-[1.08] text-[#f2f4f7] text-balance font-display"
      style={{ position: "absolute", left: at.x, top: at.y, width: at.w, margin: 0, textAlign: "center", opacity }}
    >
      {words.map((w, i) => (
        <React.Fragment key={i}>
          <span style={mask} data-film="w">
            <span style={inner(i)}>{w}</span>
          </span>{" "}
        </React.Fragment>
      ))}
      <span style={{ whiteSpace: "nowrap" }}>
        <span style={mask} data-film="ships">
          <span
            className="text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-100 to-[#34c07a]"
            style={inner(words.length)}
          >
            {COPY.turn.accent}
          </span>
        </span>
        <span data-film="period" style={{ opacity: 0 }}>
          {COPY.turn.period}
        </span>
      </span>
    </h1>
  );
};

// ============================================================================
// The real CTA: the hero's own "Let's Build" button, isolated
// ============================================================================
export const RealCta: React.FC<{ x: number; y: number; scale: number; opacity: number; lift: number }> = ({ x, y, scale, opacity, lift }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [handle] = useState(() => delayRender("film: cta"));
  const [btn, setBtn] = useState<Rect | null>(null);
  useLayoutEffect(() => {
    const root = ref.current!;
    const a = root.querySelector<HTMLElement>(".af-hero-cta > a");
    setBtn(rectIn(a, root));
  }, []);
  useLayoutEffect(() => {
    if (btn) requestAnimationFrame(() => continueRender(handle));
  }, [btn, handle]);
  const cx = btn ? btn.x + btn.w / 2 : 0;
  const cy = btn ? btn.y + btn.h / 2 : 0;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0, opacity }}>
      <style>{`.cta-only section{min-height:0!important;visibility:hidden}.cta-only .af-hero-cta>a:first-child{visibility:visible}`}</style>
      <div
        ref={ref}
        className="cta-only"
        style={{ position: "absolute", left: 0, top: 0, width: 1100, transformOrigin: `${cx}px ${cy}px`, transform: `translate(${-cx}px, ${-cy + lift}px) scale(${scale})` }}
      >
        <MemoryRouter>
          <RealHero />
        </MemoryRouter>
      </div>
    </div>
  );
};
const RealHero = React.memo(() => <Hero />);

// ============================================================================
// Film chrome
// ============================================================================
export const CHROME = { pad: 6, bar: 46, radius: 30 } as const;
export const windowSize = (pageW: number, viewH: number) => ({ w: pageW + CHROME.pad * 2, h: viewH + CHROME.bar + CHROME.pad * 2 });

/** Browser window frame. `chrome` 0→1 fades the frame in around the content. */
export const BrowserWindow: React.FC<{ pageW: number; viewH: number; chrome: number; children: React.ReactNode }> = ({ pageW, viewH, chrome, children }) => {
  const { w, h } = windowSize(pageW, viewH);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: CHROME.radius,
          background: "linear-gradient(180deg, rgba(22,25,32,0.96), rgba(10,12,17,0.98))",
          border: `1.5px solid ${C.line3}`,
          boxShadow: "0 60px 120px -40px rgba(0,0,0,0.95), inset 0 1px 0 rgba(255,255,255,0.08)",
          opacity: chrome,
        }}
      />
      <div style={{ position: "absolute", left: 0, right: 0, top: CHROME.pad, height: CHROME.bar - CHROME.pad, display: "flex", alignItems: "center", justifyContent: "center", opacity: chrome }}>
        <div style={{ position: "absolute", left: 22, display: "flex", gap: 9 }}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ width: 12, height: 12, borderRadius: 6, background: "rgba(255,255,255,0.16)" }} />
          ))}
        </div>
        <span
          style={{
            fontFamily: F.mono,
            fontSize: 14,
            color: C.ink2,
            padding: "6px 22px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.05)",
            border: `1px solid ${C.line2}`,
            letterSpacing: "0.02em",
          }}
        >
          {COPY.end.url}
        </span>
      </div>
      <div
        style={{
          position: "absolute",
          left: CHROME.pad,
          top: CHROME.bar + CHROME.pad,
          width: pageW,
          height: viewH,
          overflow: "hidden",
          borderRadius: CHROME.radius - CHROME.pad,
          transform: "translateZ(0)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(120% 75% at 50% -18%, #0a0b0e 0%, #020203 48%, #000000 100%)",
            opacity: chrome,
          }}
        />
        {children}
      </div>
    </div>
  );
};

/** A glass panel the size of the window, for the exploded layers. */
const Panel: React.FC<{ w: number; h: number; label: string; children: React.ReactNode; lit: number }> = ({ w, h, label, children, lit }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      width: w,
      height: h,
      borderRadius: CHROME.radius,
      background: "linear-gradient(160deg, rgba(30,35,45,0.97), rgba(13,16,22,0.98))",
      border: `2px solid ${lit > 0.5 ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.14)"}`,
      boxShadow: "0 50px 100px -40px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.06)",
      overflow: "hidden",
    }}
  >
    <div style={{ position: "absolute", left: 40, top: 30, fontFamily: F.mono, fontSize: 18, letterSpacing: "0.22em", textTransform: "uppercase", color: C.ink4 }}>{label}</div>
    <div style={{ position: "absolute", left: 40, right: 40, top: 92 }}>{children}</div>
  </div>
);

/** The code layer: real lines of hero.jsx. `typed` 0→1 wipes lines in. `lit` brightens. */
export const CodePanel: React.FC<{ w: number; h: number; typed: number; lit: number }> = ({ w, h, typed, lit }) => {
  const n = CODE.length;
  return (
    <Panel w={w} h={h} label="src/components/hero.jsx" lit={lit}>
      {CODE.map(([ln, text], i) => {
        const t = Math.min(1, Math.max(0, typed * (n + 2) - i));
        const gap = i > 0 && ln - CODE[i - 1][0] > 1;
        const isShips = text.trim() === "ships.";
        return (
          <div key={i} style={{ display: "flex", gap: 30, marginTop: gap ? 30 : 0, fontFamily: F.mono, fontSize: 31, lineHeight: 1.62, whiteSpace: "pre" }}>
            <span style={{ width: 44, textAlign: "right", color: lit > 0.5 ? C.ink4 : C.ink5, flexShrink: 0 }}>{ln}</span>
            <span style={{ clipPath: `inset(0 ${(1 - t) * 100}% 0 0)`, color: isShips ? C.accent : lerpColor(lit, i) }}>{text}</span>
          </div>
        );
      })}
    </Panel>
  );
};
const lerpColor = (lit: number, i: number) => (lit > 0.5 ? (i === 4 ? C.ink : C.ink2) : C.ink3);

/** The build layer: the real `vite build` log. */
export const BuildPanel: React.FC<{ w: number; h: number; typed: number; lit: number }> = ({ w, h, typed, lit }) => {
  const n = BUILD.length;
  return (
    <Panel w={w} h={h} label="terminal · npm run build" lit={lit}>
      {BUILD.map((line, i) => {
        const t = Math.min(1, Math.max(0, typed * (n + 1) - i));
        const ok = line.startsWith("✓");
        const last = i === n - 1;
        return (
          <div
            key={i}
            style={{
              fontFamily: F.mono,
              fontSize: 31,
              lineHeight: 1.75,
              whiteSpace: "pre",
              clipPath: `inset(0 ${(1 - t) * 100}% 0 0)`,
              color: last ? C.accent : ok ? C.ink2 : i === 0 ? C.ink : lit > 0.5 ? C.ink2 : C.ink3,
              fontWeight: last ? 600 : 400,
            }}
          >
            {line}
          </div>
        );
      })}
    </Panel>
  );
};

// ============================================================================
// The S mark (traced from public/apple-icon.png, viewBox 709×710)
// Two congruent halves, 180° apart around (354, 355). They slide in along the
// mark's own 2:1 axes and lock.
// ============================================================================
export const S_TOP = "M258 390.5 L159.5 327 L162 222 L358 122.5 L522 232 L519 251.5 L457 287.5 L361 230.5 L275 280 L330 336 Z";
export const S_BOT = "M450 319.5 L548.5 383 L546 488 L350 587.5 L186 478 L189 458.5 L251 422.5 L347 479.5 L433 430 L378 374 Z";
export const SMark: React.FC<{ size: number; split: number; color?: string }> = ({ size, split, color = C.logo }) => {
  // split 1 = halves apart along the 2:1 diagonal, 0 = locked
  const dx = split * 300;
  const dy = split * 150;
  return (
    <svg viewBox="0 0 709 710" width={size} height={size} style={{ overflow: "visible", display: "block" }}>
      <path d={S_TOP} fill={color} stroke={color} strokeWidth={16} strokeLinejoin="round" transform={`translate(${-dx} ${-dy})`} />
      <path d={S_BOT} fill={color} stroke={color} strokeWidth={16} strokeLinejoin="round" transform={`translate(${dx} ${dy})`} />
    </svg>
  );
};

// ============================================================================
// The real Services section, its 3 cards posed in 3D by the scene
// ============================================================================
export type DeckMetrics = { grid: Rect; cards: Rect[] };
const RealServices = React.memo(() => <Services />);
export const ServicesDeck: React.FC<{ width: number; at: Pt; onMetrics: (m: DeckMetrics) => void; css: string }> = ({ width, at, onMetrics, css }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [m, setM] = useState<DeckMetrics | null>(null);
  const [handle] = useState(() => delayRender("film: services"));
  useLayoutEffect(() => {
    const root = ref.current!;
    const grid = root.querySelector<HTMLElement>(".grid")!;
    const v = { grid: rectIn(grid, root), cards: Array.from(grid.children).map((c) => rectIn(c as HTMLElement, grid)) };
    setM(v);
    onMetrics(v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useLayoutEffect(() => {
    if (m) requestAnimationFrame(() => requestAnimationFrame(() => continueRender(handle)));
  }, [m, handle]);
  const gx = m ? m.grid.x + m.grid.w / 2 : width / 2;
  const gy = m ? m.grid.y + m.grid.h / 2 : 0;
  return (
    <div style={{ position: "absolute", left: at.x - gx, top: at.y - gy, width }}>
      <style>{`.svc .af-reveal{opacity:0!important}.svc section,.svc .max-w-6xl{transform-style:preserve-3d}.svc .max-w-6xl{perspective:2600px}.svc .grid{transform-style:preserve-3d;position:relative}${css}`}</style>
      <div ref={ref} className="svc" style={{ position: "relative" }}>
        <RealServices />
      </div>
    </div>
  );
};

/** The strategy layer: real copy from why-stan.jsx + the real 4-step process (process.jsx). */
export const StrategyPanel: React.FC<{ w: number; h: number; lit: number; t: number }> = ({ w, h, lit, t }) => (
  <Panel w={w} h={h} label="business · scope & plan" lit={lit}>
    <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 64, lineHeight: 1.06, letterSpacing: "-0.04em", color: lit > 0.5 ? C.ink : C.ink3, maxWidth: w * 0.78 }}>
      {COPY.strategy.title}
    </div>
    <div style={{ display: "flex", gap: 18, marginTop: 70 }}>
      {COPY.strategy.steps.map(([n, title, dur], i) => {
        const k = Math.min(1, Math.max(0, t * 5 - i));
        return (
          <div
            key={n}
            style={{
              flex: 1,
              borderRadius: 22,
              padding: "24px 22px",
              background: "rgba(255,255,255,0.045)",
              border: `1.5px solid ${k > 0.5 && lit > 0.5 ? "rgba(52,192,122,0.45)" : C.line2}`,
              opacity: lerp(0.45, 1, k),
            }}
          >
            <div style={{ fontFamily: F.mono, fontSize: 22, color: k > 0.5 && lit > 0.5 ? C.accent : C.ink4 }}>{n}</div>
            <div style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 28, color: C.ink, marginTop: 14, whiteSpace: "nowrap" }}>{title}</div>
            <div style={{ fontFamily: F.mono, fontSize: 20, color: C.ink3, marginTop: 8 }}>{dur}</div>
          </div>
        );
      })}
    </div>
  </Panel>
);

/** The architecture layer: the real stack as a system diagram. `t` draws the links. */
export const ArchPanel: React.FC<{ w: number; h: number; lit: number; t: number }> = ({ w, h, lit, t }) => {
  const bw = 300;
  const bh = 128;
  const iw = w - 80;
  // client → API → data, cloud under all, auth beside the API
  const pos: [number, number][] = [
    [0, 40],
    [(iw - bw) / 2, 40],
    [iw - bw, 40],
    [(iw - bw) / 2, 380],
    [(iw - bw) / 2, 210],
  ];
  const links: [number, number][] = [
    [0, 1],
    [1, 2],
    [1, 4],
    [4, 3],
    [0, 3],
    [2, 3],
  ];
  const c = (i: number) => ({ x: pos[i][0] + bw / 2, y: pos[i][1] + bh / 2 });
  return (
    <Panel w={w} h={h} label="system architecture" lit={lit}>
      <div style={{ position: "relative", width: iw, height: h - 150 }}>
        <svg width={iw} height={h - 150} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {links.map(([a, b], i) => {
            const k = Math.min(1, Math.max(0, t * (links.length + 1) - i));
            const A = c(a);
            const B = c(b);
            const mid = a === 0 && b === 3 ? { x: A.x, y: B.y } : a === 2 && b === 3 ? { x: A.x, y: B.y } : null;
            const d = mid ? `M${A.x} ${A.y} L${mid.x} ${mid.y} L${B.x} ${B.y}` : `M${A.x} ${A.y} L${B.x} ${B.y}`;
            return (
              <path key={i} d={d} fill="none" stroke={lit > 0.5 ? "rgba(52,192,122,0.75)" : "rgba(255,255,255,0.18)"} strokeWidth={3} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - k} />
            );
          })}
        </svg>
        {COPY.arch.nodes.map(([title, sub], i) => (
          <div
            key={title}
            style={{
              position: "absolute",
              left: pos[i][0],
              top: pos[i][1],
              width: bw,
              height: bh,
              borderRadius: 24,
              background: "linear-gradient(160deg, rgba(40,46,58,0.98), rgba(18,21,28,0.98))",
              border: `1.5px solid ${lit > 0.5 ? "rgba(255,255,255,0.26)" : C.line2}`,
              padding: "22px 24px",
              boxSizing: "border-box",
            }}
          >
            <div style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 30, color: lit > 0.5 ? C.ink : C.ink3 }}>{title}</div>
            <div style={{ fontFamily: F.mono, fontSize: 20, color: C.ink3, marginTop: 10, whiteSpace: "nowrap" }}>{sub}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
};

/** The portrait: the nav avatar (me_profile.png) that grows into the hi-res photo. */
export const PortraitCard: React.FC<{ rect: Rect; radius: number; mix: number; sheen?: number; tilt?: { rx: number; ry: number } }> = ({ rect, radius, mix, sheen = 0, tilt }) => (
  <div style={{ position: "absolute", left: rect.x, top: rect.y, width: rect.w, height: rect.h, perspective: 1800 }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: radius,
        overflow: "hidden",
        border: "1.5px solid rgba(255,255,255,0.22)",
        boxShadow: "0 60px 120px -40px rgba(0,0,0,0.95)",
        transform: tilt ? `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)` : undefined,
        background: "#0b0d12",
      }}
    >
      <Img src={staticFile("film/me_profile.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      <Img
        src={staticFile("film/portrait.jpg")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 38%", opacity: mix }}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)", opacity: mix }} />
      <Sheen t={sheen} strength={0.35} />
    </div>
  </div>
);

// ============================================================================
// The real stanc.dev mark: exact vector from stanc-dev-logo.ai (artboard 2),
// a lime S in two halves on a black disc. viewBox 0 0 169.164 169.164.
// ============================================================================
export const LOGO_TOP = "M 106.195312 67.980469 L 87.335938 55.429688 C 86.332031 54.761719 85.050781 54.648438 83.957031 55.148438 C 78.128906 57.8125 72.421875 60.839844 66.5 64.074219 C 64.238281 65.3125 64.054688 68.496094 66.152344 69.992188 C 70.164062 72.851562 74.175781 75.710938 78.183594 78.566406 C 80.296875 80.074219 80.089844 83.273438 77.804688 84.5 C 72.675781 87.25 67.8125 89.855469 62.671875 92.609375 C 61.539062 93.214844 60.160156 93.152344 59.085938 92.445312 C 52.539062 88.125 46.097656 83.875 39.628906 79.605469 C 38.59375 78.921875 37.996094 77.738281 38.0625 76.496094 C 38.449219 69.402344 38.832031 62.304688 39.21875 55.210938 C 39.246094 54.714844 39.367188 54.222656 39.601562 53.789062 C 40.433594 52.257812 41.976562 51.105469 43.902344 50.132812 C 54.566406 44.734375 65.144531 39.167969 75.757812 33.683594 C 78.339844 32.351562 80.941406 31.0625 83.691406 29.6875 C 84.800781 29.128906 86.128906 29.207031 87.167969 29.886719 C 99.371094 37.847656 111.4375 45.867188 123.871094 54.046875 C 126.039062 55.472656 125.957031 58.679688 123.722656 59.988281 L 109.902344 68.085938 C 108.746094 68.761719 107.308594 68.722656 106.195312 67.980469";
export const LOGO_BOT = "M 62.96875 101.183594 C 69.253906 105.367188 75.539062 109.550781 81.828125 113.734375 C 82.832031 114.402344 84.109375 114.515625 85.207031 114.011719 C 91.035156 111.351562 96.738281 108.324219 102.660156 105.085938 C 104.925781 103.847656 105.109375 100.667969 103.011719 99.171875 L 90.980469 90.59375 C 88.871094 89.085938 89.078125 85.886719 91.363281 84.660156 C 96.492188 81.914062 101.351562 79.308594 106.492188 76.554688 C 107.621094 75.949219 109.003906 76.011719 110.074219 76.71875 C 116.621094 81.039062 123.0625 85.289062 129.535156 89.558594 C 130.570312 90.242188 131.167969 91.425781 131.101562 92.667969 C 130.714844 99.761719 130.328125 106.855469 129.941406 113.953125 C 129.917969 114.449219 129.796875 114.9375 129.558594 115.375 C 128.730469 116.90625 127.183594 118.054688 125.257812 119.03125 C 114.597656 124.429688 104.019531 129.992188 93.402344 135.476562 C 90.824219 136.8125 88.222656 138.101562 85.472656 139.476562 C 84.359375 140.035156 83.035156 139.957031 81.992188 139.277344 C 69.792969 131.316406 57.726562 123.296875 45.292969 115.117188 C 43.125 113.6875 43.203125 110.484375 45.441406 109.171875 C 50.046875 106.472656 54.65625 103.773438 59.261719 101.078125 C 60.417969 100.398438 61.855469 100.441406 62.96875 101.183594";
export const RealLogo: React.FC<{ size: number; split: number; disc: number; ring?: number }> = ({ size, split, disc, ring = 0 }) => {
  // split 1 = halves apart along the mark's own diagonal, 0 = locked
  const dx = split * 46;
  const dy = split * 26;
  return (
    <svg viewBox="0 0 169.164 169.164" width={size} height={size} style={{ display: "block", overflow: "visible" }}>
      <circle cx={84.582} cy={84.582} r={84.582 * disc} fill="#000" />
      {ring > 0 ? <circle cx={84.582} cy={84.582} r={84.0} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth={0.8} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - ring} /> : null}
      <path d={LOGO_TOP} fill={C.lime} transform={`translate(${-dx} ${-dy})`} />
      <path d={LOGO_BOT} fill={C.lime} transform={`translate(${dx} ${dy})`} />
    </svg>
  );
};

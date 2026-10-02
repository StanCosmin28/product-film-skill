// Scenes: one component per beat, each in its own <Sequence> (Film.tsx), so frames
// here are LOCAL. Every string comes from COPY, every timing from BEATS / SITE / HOW
// or the named constants next to it. The grid is the music's: 36 f per beat, 144 per bar.
import React, { useCallback, useState } from "react";
import { AbsoluteFill, Easing, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BEATS, C, COPY, EASE, F, HOW, LIFT, LOGO_AT, SERVICES, SITE, SOLVE, SWIPE, layoutFor, type Layout } from "./tokens";
import { clamp, display, fitSize, Glow, IsoGrid, lerp, lerpPt, logerp, Mono, prog, type Pt, Rig, RiseWord, Sheen, Shock } from "./kit";
import {
  ArchPanel,
  BrowserWindow,
  BuildPanel,
  center,
  CHROME,
  CodePanel,
  H1Copy,
  RealCta,
  RealLogo,
  ScopedStyle,
  ServicesDeck,
  SitePage,
  StrategyPanel,
  useSiteMetrics,
  windowSize,
  type DeckMetrics,
  type SiteMetrics,
} from "./surfaces";

const useLayout = (): Layout => {
  const { width, height } = useVideoConfig();
  return layoutFor(width, height);
};
const P = <T,>(L: Layout, portrait: T, landscape: T) => (L.portrait ? portrait : landscape);

// ---------------------------------------------------------------------------
// Shared geometry: adjacent beats hand off on the SAME numbers
// ---------------------------------------------------------------------------
/** Where the problem implodes and the green dot is born. */
export const birthPoint = (L: Layout): Pt => P(L, { x: L.cx, y: 1180 }, { x: L.W * 0.68, y: L.cy + 30 });
/** Where the hero headline sits on screen during the turn. */
export const headlinePoint = (L: Layout): Pt => P(L, { x: L.cx, y: 900 }, { x: L.cx, y: L.cy - 10 });
/** Where the how-tower collapses: the dot that becomes the logo's disc. */
export const endDot = (L: Layout): Pt => P(L, { x: L.cx, y: 640 }, { x: L.cx, y: 330 });
export const END_DOT_D = 34;
const BIRTH_D = 28;

// ---------------------------------------------------------------------------
// The green dot (the site's "available" dot), drawn in screen space
// ---------------------------------------------------------------------------
const Dot: React.FC<{ p: Pt; d: number; sx?: number; sy?: number; glow?: number; opacity?: number }> = ({ p, d, sx = 1, sy = 1, glow = 1, opacity = 1 }) => (
  <>
    {glow > 0 ? <Glow x={p.x} y={p.y} r={d * 7} opacity={glow * opacity} /> : null}
    <div
      style={{
        position: "absolute",
        left: p.x - d / 2,
        top: p.y - d / 2,
        width: d,
        height: d,
        borderRadius: "50%",
        background: C.accent,
        boxShadow: `0 0 ${d * 0.5}px ${C.accent}`,
        transform: `scale(${sx}, ${sy})`,
        opacity,
      }}
    />
  </>
);

/** Kinetic word swap: outgoing and incoming ride ONE curve, always exactly a line apart. */
const RollWords: React.FC<{ f: number; words: readonly string[]; ats: readonly number[]; exitAt: number; size: number; align: "center" | "left"; accentLast?: boolean }> = ({
  f,
  words,
  ats,
  exitAt,
  size,
  align,
  accentLast,
}) => {
  const lineH = size * 1.3;
  return (
    <div style={{ position: "relative", height: lineH, overflow: "hidden", textAlign: align }}>
      {words.map((w, i) => {
        const next = ats[i + 1] ?? exitAt;
        if (f < ats[i] - 18 || f > next + 2) return null;
        const inY = 1 - prog(f, ats[i] - 18, ats[i], EASE.glide);
        const outY = prog(f, next - 18, next, EASE.glide);
        const accent = accentLast && i === words.length - 1;
        return (
          <div key={w} style={{ position: "absolute", left: 0, right: 0, top: size * 0.08, transform: `translateY(${(inY - outY) * lineH}px)` }}>
            <span style={display(size, accent ? C.accent : C.ink)}>{w}</span>
          </div>
        );
      })}
    </div>
  );
};

/** A line of words, each rising out of its own mask. */
const RiseLine: React.FC<{ f: number; words: readonly string[]; at: number; per?: number; out?: number; style?: React.CSSProperties }> = ({ f, words, at, per = 5, out = 0, style }) => (
  <>
    {words.map((w, i) => (
      <React.Fragment key={i}>
        <RiseWord t={prog(f, at + i * per, at + i * per + 26, EASE.enter)} out={out} style={style}>
          {w}
        </RiseWord>
        {i < words.length - 1 ? " " : ""}
      </React.Fragment>
    ))}
  </>
);

// ===========================================================================
// B1 · Problem (0–144): wireframes of a site that never got built
// ===========================================================================
const SkeletonTile: React.FC<{ w: number; h: number; label: string; kind: number }> = ({ w, h, label, kind }) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: 26,
      background: C.skel,
      border: `2px solid ${C.skelEdge}`,
      boxShadow: "0 40px 60px -30px rgba(0,0,0,0.95)",
      padding: 26,
      display: "flex",
      flexDirection: "column",
      gap: 14,
      overflow: "hidden",
    }}
  >
    {kind === 0 ? (
      <>
        <div style={{ width: "62%", height: 26, borderRadius: 8, background: C.skelBar }} />
        <div style={{ width: "88%", height: 14, borderRadius: 6, background: C.skelBar2 }} />
        <div style={{ width: "74%", height: 14, borderRadius: 6, background: C.skelBar2 }} />
      </>
    ) : kind === 1 ? (
      <>
        <div style={{ display: "flex", gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ flex: 1, height: h * 0.34, borderRadius: 12, background: C.skelBar2, border: `1.5px dashed ${C.skelEdge}` }} />
          ))}
        </div>
        <div style={{ width: "50%", height: 14, borderRadius: 6, background: C.skelBar2 }} />
      </>
    ) : (
      <div style={{ flex: 1, borderRadius: 14, border: `2px dashed ${C.skelEdge}`, display: "grid", placeItems: "center" }}>
        <div style={{ width: 54, height: 54, borderRadius: 27, border: `2px solid ${C.skelEdge}` }} />
      </div>
    )}
    <div style={{ marginTop: "auto", fontFamily: F.mono, fontSize: 24, color: C.ink4, whiteSpace: "nowrap" }}>{label}</div>
  </div>
);

const TILES = Array.from({ length: 12 }, (_, i) => {
  const col = i % 4;
  const row = Math.floor(i / 4);
  return {
    x: (col - 1.5) * 520 + (random(`tx${i}`) - 0.5) * 140,
    y: (row - 1) * 520 + (random(`ty${i}`) - 0.5) * 140,
    w: 330 + random(`tw${i}`) * 120,
    h: 220 + random(`th${i}`) * 120,
    z: 20 + random(`tz${i}`) * 90,
    phase: random(`tp${i}`) * Math.PI * 2,
    at: -34 + random(`ta${i}`) * 50,
    kind: i % 3,
    label: COPY.skeleton[i % COPY.skeleton.length],
  };
});
const IMPLODE: [number, number] = [86, 112];

export const Problem: React.FC = () => {
  const f = useCurrentFrame();
  const L = useLayout();
  const bp = birthPoint(L);
  const k = prog(f, IMPLODE[0], IMPLODE[1], EASE.exit);
  const drift = prog(f, -20, 110, EASE.soft);
  const s = logerp(P(L, 0.6, 0.74) * 1.1, P(L, 0.6, 0.74), drift) * (1 - 0.94 * k);
  const rz = -48 + drift * 6 + k * 50;
  const size = P(L, 150, 150);
  const lines = COPY.problem.lines;
  const textY = P(L, 430, L.cy - size * 1.05);
  const out = prog(f, 80, 96, EASE.exit);
  return (
    <AbsoluteFill>
      <Rig cam={bp} A={{ x: 0, y: 0 }} s={s} rx={60} rz={rz} style={{ opacity: 1 - prog(f, 104, 116) }}>
        <IsoGrid size={3600} opacity={1 - k} />
        {TILES.map((t, i) => {
          const appear = prog(f, t.at, t.at + 26, EASE.enter);
          const z = lerp(-120, t.z + Math.sin(f * 0.03 + t.phase) * 26, appear);
          const pull = clamp(k * 1.25 - (Math.hypot(t.x, t.y) / 1600) * 0.25);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: lerp(t.x, 0, pull) - t.w / 2,
                top: lerp(t.y, 0, pull) - t.h / 2,
                transform: `translateZ(${z * (1 - pull)}px) scale(${1 - pull * 0.7})`,
                opacity: appear * (1 - clamp(pull * 1.4 - 0.4)),
              }}
            >
              <SkeletonTile w={t.w} h={t.h} label={t.label} kind={t.kind} />
            </div>
          );
        })}
      </Rig>
      <AbsoluteFill
        style={{
          background: P(
            L,
            "linear-gradient(180deg, rgba(2,3,5,0.92) 0%, rgba(2,3,5,0.75) 30%, rgba(2,3,5,0) 48%)",
            "linear-gradient(90deg, rgba(2,3,5,0.92) 0%, rgba(2,3,5,0.7) 32%, rgba(2,3,5,0) 52%)",
          ),
        }}
      />
      {/* the point everything collapses into: white, it turns green on the drop (f 144) */}
      {f >= IMPLODE[1] - 14 ? (
        <>
          <Glow x={bp.x} y={bp.y} r={BIRTH_D * 6} opacity={0.5 * prog(f, IMPLODE[1] - 6, 120)} />
          <div
            style={{
              position: "absolute",
              left: bp.x - BIRTH_D / 2,
              top: bp.y - BIRTH_D / 2,
              width: BIRTH_D,
              height: BIRTH_D,
              borderRadius: "50%",
              background: C.ink,
              boxShadow: "0 0 18px rgba(255,255,255,0.6)",
              transform: `scale(${prog(f, IMPLODE[1] - 14, IMPLODE[1], EASE.enter) * (0.8 + 0.2 * Math.sin(f * 0.6))})`,
            }}
          />
        </>
      ) : null}
      <div style={{ position: "absolute", left: P(L, 0, L.side), top: textY, width: P(L, L.W, undefined), textAlign: P(L, "center", "left") }}>
        {lines.map((line, li) => (
          <div key={li} style={{ ...display(size, li === 0 ? C.ink : C.ink3), height: size * 1.08 }}>
            <RiseLine f={f} words={line} at={li === 0 ? -10 : 20} per={5} out={out} />
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ===========================================================================
// B2–B3 · Site (120–575): the drop, the real headline, the real site.
// It recedes and stays behind "what I solve", then swipes out with it.
// ===========================================================================
type Cam = { cam: Pt; A: Pt; s: number; rx: number; dim: number };

const siteGeometry = (L: Layout, m: SiteMetrics) => {
  const win = windowSize(L.pageW, L.viewH);
  const origin = { x: -win.w / 2 + CHROME.pad, y: -win.h / 2 + CHROME.bar + CHROME.pad };
  const actor = (p: Pt): Pt => ({ x: origin.x + p.x, y: origin.y + p.y });
  const usable = L.W - L.side * 2 - P(L, 0, 200);
  return {
    win,
    actor,
    S0: Math.min(P(L, 2.2, 2.3), usable / Math.max(1, m.lineW)),
    Sfit: P(L, (L.W - 110) / win.w, (L.H - 230) / win.h),
    h1c: center(m.h1),
  };
};

/** where the window waits while "what I solve" plays */
const recedePose = (L: Layout) => P(L, { cam: { x: L.cx, y: 400 }, k: 0.5 }, { cam: { x: 450, y: L.cy + 10 }, k: 0.42 });

const siteCamera = (f: number, L: Layout, g: ReturnType<typeof siteGeometry>): Cam => {
  const C0 = headlinePoint(L);
  const Cwin = P(L, { x: L.cx, y: L.cy + 30 }, { x: L.cx, y: L.cy + 20 });
  const A_h1 = g.actor(g.h1c);
  let s = g.S0 * lerp(0.93, 1, prog(f, 0, SITE.pullBack[0], EASE.soft));
  let A = A_h1;
  let cam = C0;
  const pb = prog(f, SITE.pullBack[0], SITE.pullBack[1], EASE.glide);
  if (pb > 0) {
    s = logerp(g.S0, g.Sfit, pb);
    A = lerpPt(A_h1, { x: 0, y: 0 }, pb);
    cam = lerpPt(C0, Cwin, pb);
  }
  const rc = prog(f, SITE.recede[0], SITE.recede[1], EASE.glide);
  const rp = recedePose(L);
  if (rc > 0) {
    s = logerp(g.Sfit, g.Sfit * rp.k, rc);
    cam = lerpPt(Cwin, rp.cam, rc);
  }
  return { cam, A, s, rx: 22 * rc, dim: 1 - 0.6 * rc };
};
const toScreen = (c: Cam, p: Pt): Pt => ({ x: c.cam.x + c.s * (p.x - c.A.x), y: c.cam.y + c.s * (p.y - c.A.y) });

// per-frame CSS over the real DOM
const siteCSS = (f: number, L: Layout) => {
  const o = (a: number, b: number) => prog(f, a, b);
  const rise = (sel: string, a: number, dur = 16, y = 22) => {
    const t = prog(f, a, a + dur, EASE.enter);
    return `${sel}{opacity:${prog(f, a, a + dur * 0.6).toFixed(3)}!important;transform:translateY(${((1 - t) * y).toFixed(2)}px)!important;}`;
  };
  const pb = SITE.pullBack[0];
  return [
    `.site-page > section:first-of-type{min-height:560px!important}`,
    // the film is about what Stan builds, not one product: the hero's second button stays out
    `.site-page .af-hero-cta > a:nth-child(2){display:none}`,
    // 9:16: the headline breaks onto two lines so it can fill the frame
    L.portrait ? `.site-page h1{max-width:620px;margin-left:auto;margin-right:auto}` : "",
    `.site-page h1:not([data-film]){opacity:${f >= pb ? 1 : 0}}`,
    `.site-page > section:first-of-type > div:first-child{opacity:${o(pb, pb + 40).toFixed(3)}}`,
    rise(".site-page .af-hero-title > p:first-child", 60, 20, 16),
    rise(".site-page .af-hero-badge", pb + 2),
    rise(".site-page .af-hero-desc", pb + 6),
    rise(".site-page .af-hero-cta", pb + 10),
    rise(".film-window header", pb + 8, 18, -26),
    `.site-page > section:nth-of-type(2) > div > div:first-child{opacity:${o(pb + 14, pb + 28).toFixed(3)}}`,
    ...[0, 1, 2, 3].map((i) => rise(`.site-page .af-stagger > *:nth-child(${i + 1})`, pb + 14 + i * 5, 18, 30)),
  ].join("\n");
};

export const Site: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + BEATS.site.from;
  const L = useLayout();
  const { fps } = useVideoConfig();
  const [m, onMetrics] = useSiteMetrics();
  const geo = m ? siteGeometry(L, m) : null;
  const c = geo ? siteCamera(f, L, geo) : { cam: { x: L.cx, y: L.cy }, A: { x: 0, y: 0 }, s: 1, rx: 0, dim: 1 };
  const win = windowSize(L.pageW, L.viewH);
  const chrome = prog(f, SITE.pullBack[0] + 4, SITE.pullBack[0] + 30);
  const rise = (i: number) => prog(f, 8 + i * 5, 8 + i * 5 + 22, EASE.enter);
  const sw = prog(g, SWIPE[0], SWIPE[1], EASE.glide);

  // the dot: born on the drop at the implode point, lands as the period of "ships." on the snare
  const bp = birthPoint(L);
  const dotPage = m ? { x: m.period.x + m.period.w * 0.5, y: m.period.y + m.period.h * 0.735 } : { x: 0, y: 0 };
  const dotTarget = geo ? toScreen(c, geo.actor(dotPage)) : { x: 0, y: 0 };
  const fl = prog(f, 22, SITE.dotLand, EASE.glide);
  const arc = Math.sin(Math.PI * fl) * P(L, 110, 90);
  const dotFly = { x: lerp(bp.x, dotTarget.x, fl), y: lerp(bp.y, dotTarget.y, fl) + arc };
  const dPeriod = (m ? m.period.w : 16) * 1.02 * c.s;
  const dTurn = lerp(BIRTH_D, dPeriod, prog(f, 40, SITE.dotLand, EASE.glide));
  const land = spring({ frame: f - SITE.dotLand, fps, config: { damping: 9, mass: 0.4, stiffness: 220 } });
  const squash = f >= SITE.dotLand ? 1 + 0.35 * Math.sin(Math.PI * clamp(land)) * (1 - prog(f, SITE.dotLand, SITE.dotLand + 14)) : 1;
  const birth = 1 + 0.7 * Math.sin(Math.PI * prog(f, 0, 12));

  return (
    <AbsoluteFill style={{ transform: `translateX(${-sw * L.W}px)` }}>
      <ScopedStyle css={siteCSS(f, L)} />
      <Rig cam={c.cam} A={c.A} s={c.s} rx={c.rx} style={{ opacity: c.dim }}>
        <div className="film-window" style={{ position: "absolute", left: -win.w / 2, top: -win.h / 2, width: win.w, height: win.h }}>
          <BrowserWindow pageW={L.pageW} viewH={L.viewH} chrome={chrome}>
            <SitePage
              width={L.pageW}
              scroll={0}
              onMetrics={onMetrics}
              overlay={m && f < SITE.pullBack[0] ? <H1Copy at={{ x: m.h1.x - 0.5, y: m.h1.y, w: m.h1.w + 1 }} rise={rise} /> : !m ? <H1Copy at={{ x: 0, y: 0, w: 768 }} rise={() => 1} opacity={0} /> : null}
            />
          </BrowserWindow>
        </div>
      </Rig>
      {f < SITE.pullBack[0] + 30 && m ? (
        <>
          <Shock x={bp.x} y={bp.y} at={0} dur={30} r={P(L, 560, 500)} />
          <Shock x={dotTarget.x} y={dotTarget.y} at={SITE.dotLand} dur={24} r={P(L, 240, 220)} />
          <Dot
            p={f < SITE.dotLand ? dotFly : dotTarget}
            d={f < 40 ? BIRTH_D * birth : dTurn}
            sx={squash}
            sy={2 - squash}
            glow={lerp(1, 0.45, prog(f, SITE.dotLand, SITE.dotLand + 30))}
            opacity={1 - prog(f, SITE.pullBack[0] + 6, SITE.pullBack[0] + 30)}
          />
        </>
      ) : null}
    </AbsoluteFill>
  );
};

// ===========================================================================
// B4 · What I solve (300–575): three problems flip into fixes on the beat
// ===========================================================================
const Check: React.FC<{ ok: number; size: number }> = ({ ok, size }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      flexShrink: 0,
      display: "grid",
      placeItems: "center",
      background: ok ? "rgba(52,192,122,0.16)" : "rgba(255,255,255,0.05)",
      border: `2px solid ${ok ? "rgba(52,192,122,0.6)" : C.line2}`,
    }}
  >
    <svg width={size * 0.46} height={size * 0.46} viewBox="0 0 24 24" fill="none" stroke={ok ? C.accent : C.ink4} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      {ok ? <path d="M5 12.5l4.5 4.5L19 7.5" /> : <path d="M7 7l10 10M17 7L7 17" />}
    </svg>
  </div>
);

export const Solve: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + BEATS.solve.from;
  const L = useLayout();
  const sw = prog(g, SWIPE[0], SWIPE[1], EASE.glide);
  const rows = COPY.solve.rows;
  const W = P(L, 940, 860);
  const H = P(L, 150, 136);
  const gap = P(L, 34, 30);
  const left = P(L, (L.W - 940) / 2, 920);
  const top = P(L, 820, L.cy - 230);
  const fs = P(L, 58, 52);
  const icon = P(L, 76, 70);
  return (
    <AbsoluteFill style={{ transform: `translateX(${-sw * L.W}px)` }}>
      <div style={{ position: "absolute", left, top: top - P(L, 86, 80), width: W, overflow: "hidden", textAlign: "left" }}>
        <RiseWord t={prog(f, 4, 24, EASE.enter)}>
          <Mono size={P(L, 26, 24)} color={C.ink3}>
            {COPY.solve.eyebrow}
          </Mono>
        </RiseWord>
      </div>
      {rows.map(([pain, fix], i) => {
        const appear = prog(f, 10 + i * 7, 10 + i * 7 + 22, EASE.enter);
        const at = SOLVE.flips[i];
        const strike = prog(g, at - 24, at - 8, EASE.glide);
        const flip = prog(g, at - 8, at + 8, Easing.bezier(0.5, 0, 0.2, 1));
        const ok = flip >= 0.5 ? 1 : 0;
        const face = (back: boolean): React.CSSProperties => ({
          position: "absolute",
          inset: 0,
          borderRadius: H / 2,
          display: "flex",
          alignItems: "center",
          gap: P(L, 28, 24),
          padding: `0 ${P(L, 40, 34)}px 0 ${P(L, 36, 30)}px`,
          background: back ? "linear-gradient(160deg, rgba(30,40,36,0.96), rgba(12,16,15,0.98))" : "linear-gradient(160deg, rgba(24,27,34,0.96), rgba(12,14,19,0.98))",
          border: `2px solid ${back ? "rgba(52,192,122,0.45)" : C.line2}`,
          boxShadow: back ? "0 30px 70px -30px rgba(52,192,122,0.35)" : "0 30px 70px -30px rgba(0,0,0,0.9)",
          backfaceVisibility: "hidden",
          transform: back ? "rotateX(180deg)" : undefined,
        });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left,
              top: top + i * (H + gap),
              width: W,
              height: H,
              perspective: 1400,
              opacity: appear,
              transform: `translateY(${(1 - appear) * 60}px)`,
            }}
          >
            <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `rotateX(${flip * 180}deg)` }}>
              <div style={face(false)}>
                <Check ok={0} size={icon} />
                <span style={{ position: "relative", ...display(fs, C.ink3), fontWeight: 500 }}>
                  {pain}
                  <span style={{ position: "absolute", left: -6, top: "54%", height: 4, borderRadius: 2, width: `calc(${strike * 100}% + 12px)`, background: C.ink3, opacity: strike > 0 ? 1 : 0 }} />
                </span>
              </div>
              <div style={face(true)}>
                <Check ok={1} size={icon} />
                <span style={display(fs, C.ink)}>{fix}</span>
              </div>
            </div>
            <Sheen t={prog(g, at + 6, at + 30, EASE.glide)} strength={0.18} radius={H / 2} />
            {ok ? <Shock x={W - P(L, 60, 50)} y={H / 2} at={at - BEATS.solve.from} dur={20} r={160} /> : null}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ===========================================================================
// B5 · What I offer (537–753): the three real service cards on a 3D carousel
// ===========================================================================
export const ServicesScene: React.FC = () => {
  const f = useCurrentFrame();
  const L = useLayout();
  const g = f + BEATS.services.from;
  const [dm, setDm] = useState<DeckMetrics | null>(null);
  const onMetrics = useCallback((v: DeckMetrics) => setDm(v), []);
  const sw = prog(g, SWIPE[0], SWIPE[1], EASE.glide);
  const up = prog(g, LIFT[0], LIFT[1], EASE.glide);
  const F0 = SERVICES.fronts;
  // which card is in front (continuous): the carousel turns on the beat
  const c = prog(g, F0[1] - 20, F0[1], EASE.glide) + prog(g, F0[2] - 20, F0[2], EASE.glide);
  const deckAt = P(L, { x: L.cx, y: 1150 }, { x: 1290, y: L.cy + 40 });
  const R = P(L, 620, 640);
  const STEP = 36;
  const sc = P(L, 1.34, 1.0);
  const cardCSS = dm
    ? dm.cards
        .map((r, i) => {
          const ox = r.x + r.w / 2 - dm.grid.w / 2;
          const a = (i - c) * STEP + (1 - sw) * -24;
          const k = clamp(1 - Math.abs(i - c) * 0.42, 0.45, 1);
          return `.svc .grid > :nth-child(${i + 1}){transform:translate3d(${(-ox).toFixed(2)}px,0,${-R}px) rotateY(${a.toFixed(2)}deg) translateZ(${R}px)!important;opacity:1!important;filter:brightness(${k.toFixed(3)})}`;
        })
        .join("")
    : "";
  const tiers = COPY.services.tiers;
  const hSize = Math.min(P(L, 104, 100), ...tiers.map((t) => fitSize(t, 200, P(L, L.W - 130, 720), { upper: false, tracking: -0.045 })));
  return (
    <AbsoluteFill style={{ transform: `translate(${(1 - sw) * L.W}px, ${-up * L.H}px)`, opacity: 1 - prog(g, LIFT[0] + 2, LIFT[0] + 22) }}>
      <Glow x={deckAt.x} y={deckAt.y} r={P(L, 720, 640)} opacity={0.3} />
      <div style={{ position: "absolute", left: 0, top: 0, width: L.W, height: L.H, transformOrigin: `${deckAt.x}px ${deckAt.y}px`, transform: `scale(${sc})` }}>
        <ServicesDeck width={1100} at={deckAt} onMetrics={onMetrics} css={cardCSS} />
      </div>
      <div style={{ position: "absolute", left: P(L, 0, 110), top: P(L, 250, L.cy - 160), width: P(L, L.W, 740), textAlign: P(L, "center", "left") }}>
        <div style={{ overflow: "hidden", marginBottom: 18 }}>
          <RiseWord t={prog(f, 6, 26, EASE.enter)} out={prog(g, LIFT[0] - 26, LIFT[0] - 8, EASE.exit)}>
            <Mono size={P(L, 26, 24)} color={C.ink3}>
              {COPY.services.eyebrow}
            </Mono>
          </RiseWord>
        </div>
        <RollWords f={g} words={tiers} ats={F0} exitAt={LIFT[0] - 4} size={hSize} align={P(L, "center", "left")} />
      </div>
    </AbsoluteFill>
  );
};

// ===========================================================================
// B6 · How (715–1010): strategy → architecture → design → code → deploy
// ===========================================================================
export const How: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLayout();
  const g = f + BEATS.how.from;
  const [, onMetrics] = useSiteMetrics();
  const win = windowSize(L.pageW, L.viewH);
  const GAP = P(L, 400, 320);
  const enter = prog(g, LIFT[0], LIFT[1], EASE.glide);
  const L0 = HOW.lights;
  const a = L0.slice(1).reduce((acc, at) => acc + prog(g, at - 20, at, EASE.glide), 0);
  const lit = (i: number) => (g >= L0[i] - 4 && (i === 4 || g < L0[i + 1] - 4) ? 1 : 0);
  const col = prog(g, HOW.collapse[0], HOW.collapse[1], EASE.exit);
  const Cst = P(L, { x: L.cx, y: 1170 }, { x: 1250, y: L.cy + 50 });
  const cam = lerpPt({ x: Cst.x, y: Cst.y + (1 - enter) * L.H * 0.55 }, endDot(L), col);
  const s = P(L, 0.7, 0.52) * lerp(0.9, 1, enter) * (1 - 0.97 * col);
  const rz = -46 + 9 * prog(f, 0, 295, EASE.soft) + 40 * col;
  const shift = -(2 - a) * GAP;
  const zOf = (i: number) => ((2 - i) * GAP + shift) * (1 - col);
  const bump = (i: number) => 26 * spring({ frame: g - L0[i], fps, config: { damping: 14, mass: 0.6, stiffness: 140 } }) * lit(i);
  const fade = (i: number) => (i < a ? clamp(1 - (a - i - 0.35) * 1.4) : clamp(1.25 - Math.max(0, i - a - 0.5) * 0.45)) * (1 - prog(g, HOW.collapse[0] + 6, HOW.collapse[1]));
  const words = COPY.how.words;
  const wordSize = Math.min(P(L, 132, 112), fitSize("Architecture.", 200, P(L, L.W - 120, 760), { upper: false, tracking: -0.045 }));
  const layer = (i: number, node: React.ReactNode) => (
    <div key={i} style={{ position: "absolute", left: 0, top: 0, width: win.w, height: win.h, transform: `translateZ(${zOf(i) + bump(i)}px)`, opacity: fade(i) }}>
      {node}
    </div>
  );
  return (
    <AbsoluteFill>
      <Glow x={cam.x} y={cam.y} r={P(L, 760, 640)} opacity={0.4 * enter * (1 - col)} />
      <Rig cam={cam} A={{ x: 0, y: 0 }} s={s} rx={58} rz={rz}>
        <div style={{ position: "absolute", left: -win.w / 2, top: -win.h / 2, width: win.w, height: win.h, transformStyle: "preserve-3d" }}>
          {layer(4, <BuildPanel w={win.w} h={win.h} typed={prog(g, L0[4], L0[4] + 28, EASE.soft)} lit={lit(4)} />)}
          {layer(3, <CodePanel w={win.w} h={win.h} typed={prog(g, L0[3], L0[3] + 28, EASE.soft)} lit={lit(3)} />)}
          {layer(
            2,
            <div className="film-window" style={{ position: "absolute", inset: 0 }}>
              <BrowserWindow pageW={L.pageW} viewH={L.viewH} chrome={1}>
                <SitePage width={L.pageW} scroll={0} onMetrics={onMetrics} />
              </BrowserWindow>
              <Sheen t={prog(g, L0[2], L0[2] + 30, EASE.glide)} strength={0.18} radius={CHROME.radius} />
              <div style={{ position: "absolute", inset: 0, borderRadius: CHROME.radius, background: "#000", opacity: lit(2) ? 0 : 0.45 }} />
            </div>,
          )}
          {layer(1, <ArchPanel w={win.w} h={win.h} lit={lit(1)} t={prog(g, L0[1] - 6, L0[1] + 36, EASE.soft)} />)}
          {layer(0, <StrategyPanel w={win.w} h={win.h} lit={lit(0)} t={prog(g, L0[0], L0[0] + 36, EASE.soft)} />)}
        </div>
      </Rig>
      <AbsoluteFill
        style={{
          background: P(
            L,
            "linear-gradient(180deg, rgba(2,3,5,0.9) 0%, rgba(2,3,5,0.6) 24%, rgba(2,3,5,0) 38%)",
            "linear-gradient(90deg, rgba(2,3,5,0.9) 0%, rgba(2,3,5,0.6) 30%, rgba(2,3,5,0) 46%)",
          ),
          opacity: enter * (1 - col),
        }}
      />
      <ScopedStyle css={`.site-page > section:first-of-type{min-height:560px!important}.site-page .af-hero-cta > a:nth-child(2){display:none}${L.portrait ? ".site-page h1{max-width:620px;margin-left:auto;margin-right:auto}" : ""}`} />
      <div style={{ position: "absolute", left: P(L, 0, 110), top: P(L, 250, L.cy - 170), width: P(L, L.W, 780) }}>
        <RollWords f={g} words={words} ats={L0} exitAt={HOW.collapse[0]} size={wordSize} align={P(L, "center", "left")} accentLast />
        <div style={{ textAlign: P(L, "center", "left"), marginTop: 4, overflow: "hidden" }}>
          <RiseWord t={prog(g, L0[0] + 6, L0[0] + 26, EASE.enter)} out={prog(g, HOW.collapse[0] - 14, HOW.collapse[0], EASE.exit)}>
            <Mono size={P(L, 26, 24)} color={C.ink3}>
              {COPY.how.caption}
            </Mono>
          </RiseWord>
        </div>
      </div>
      {g >= HOW.collapse[0] + 8 ? <Dot p={endDot(L)} d={END_DOT_D * prog(g, HOW.collapse[0] + 8, HOW.collapse[1], EASE.enter)} glow={prog(g, HOW.collapse[0] + 8, HOW.collapse[1])} /> : null}
    </AbsoluteFill>
  );
};

// ===========================================================================
// B7 · End (1010–1200): the real stanc.dev mark slams together on the 808
// ===========================================================================
export const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLayout();
  const LOCK = LOGO_AT - BEATS.end.from; // 19.5
  const logoC = endDot(L);
  const size = P(L, 360, 250);
  // the green dot opens into the logo's black disc, the halves slam in (accelerating) and lock ON the beat
  const disc = lerp(END_DOT_D / size, 1, spring({ frame: f - 2, fps, config: { damping: 15, mass: 0.6, stiffness: 150 } }));
  const slam = prog(f, 2, LOCK, Easing.in(Easing.cubic));
  const settle = f >= LOCK ? Math.sin(Math.PI * prog(f, LOCK, LOCK + 10)) * 0.04 * (1 - prog(f, LOCK, LOCK + 10)) : 0;
  const split = (1 - slam) * 1.5 - settle;
  const dotA = 1 - prog(f, 0, 10);
  const nameT = prog(f, 32, 54, EASE.enter);
  const roleT = prog(f, 36, 58, EASE.enter);
  const cta = spring({ frame: f - 78, fps, config: { damping: 13, mass: 0.6, stiffness: 160 } });
  const urlT = prog(f, 86, 104, EASE.enter);
  const q = COPY.end.question;
  const qSize = P(L, 92, 76);
  const line = (words: readonly string[], offset: number) =>
    words.map((w, i) => {
      const gi = offset + i;
      const t = prog(f, 44 + gi * 4, 44 + gi * 4 + 24, EASE.enter);
      return (
        <React.Fragment key={gi}>
          <RiseWord t={t} style={gi >= COPY.end.accentFrom ? { color: C.lime } : undefined}>
            {w}
          </RiseWord>
          {i < words.length - 1 ? " " : ""}
        </React.Fragment>
      );
    });
  return (
    <AbsoluteFill>
      <Rig cam={logoC} A={{ x: 0, y: 0 }} s={P(L, 0.6, 0.74)} rx={60} rz={-45 + prog(f, 0, 190, EASE.soft) * 4} style={{ opacity: 0.5 * prog(f, LOCK - 6, LOCK + 40) }}>
        <IsoGrid size={3600} />
      </Rig>
      <Glow x={logoC.x} y={logoC.y} r={size * 2.1} opacity={0.4 * prog(f, LOCK - 2, LOCK + 26)} src="film/glow-lime.png" />
      <div style={{ position: "absolute", left: logoC.x - size / 2, top: logoC.y - size / 2, width: size, height: size }}>
        <RealLogo size={size} split={split} disc={disc} ring={prog(f, LOCK, LOCK + 30, EASE.glide)} />
      </div>
      {dotA > 0 ? <Dot p={logoC} d={END_DOT_D} glow={dotA} opacity={dotA} /> : null}
      <Shock x={logoC.x} y={logoC.y} at={LOCK} dur={30} r={size * 1.5} color="rgba(177,213,0,0.6)" />
      <Shock x={logoC.x} y={logoC.y} at={LOCK + 5} dur={36} r={size * 2.1} color="rgba(242,244,247,0.25)" />

      <div style={{ position: "absolute", left: 0, right: 0, top: P(L, 860, 470), textAlign: "center", overflow: "hidden", paddingBottom: 8 }}>
        <RiseWord t={nameT}>
          <span style={display(P(L, 76, 60))}>{COPY.end.name}</span>
        </RiseWord>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: P(L, 960, 548), textAlign: "center" }}>
        <RiseWord t={roleT}>
          <Mono size={P(L, 22, 19)} color={C.ink3}>
            {COPY.end.role}
          </Mono>
        </RiseWord>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: P(L, 1080, 628), textAlign: "center", ...display(qSize), lineHeight: 1.08 }}>
        {L.portrait ? (
          <>
            <div>{line(q.slice(0, 3), 0)}</div>
            <div>{line(q.slice(3), 3)}</div>
          </>
        ) : (
          <div>{line(q, 0)}</div>
        )}
      </div>
      <RealCta x={L.cx} y={P(L, 1395, 800)} scale={lerp(0.6, P(L, 2.1, 1.75), clamp(cta))} opacity={clamp(cta * 2)} lift={0} />
      <div style={{ position: "absolute", left: 0, right: 0, top: P(L, 1478, 868), textAlign: "center", opacity: urlT, transform: `translateY(${(1 - urlT) * 14}px)` }}>
        <Mono size={P(L, 22, 19)} color={C.ink4}>
          {COPY.end.url}
        </Mono>
      </div>
    </AbsoluteFill>
  );
};

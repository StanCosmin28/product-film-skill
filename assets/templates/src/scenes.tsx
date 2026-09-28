// Scenes: one component per beat, each mounted in its own <Sequence> (Film.tsx),
// so frames here are LOCAL. Every string comes from COPY and every timing from
// BEATS or named constants.
//
// The four scenes below are a working skeleton (problem → turn → proof → end card).
// Replace the proof with 3–5 real-UI beats (see references/craft.md §2 and §6).
import React from "react";
import { AbsoluteFill, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, COPY, EASE, F, SETTLE, layoutFor, type Layout } from "./tokens";
import { Camera, fitSize, Glow, Lanes, lerp, prog, punch, shake, Shock, Slam, Stagger, Word } from "./kit";
import { LogoMark, Phone, phoneHeight, ReplaceMe } from "./surfaces";

const useLayout = (): Layout => {
  const { width, height } = useVideoConfig();
  return layoutFor(width, height);
};
const P = <T,>(L: Layout, portrait: T, landscape: T) => (L.portrait ? portrait : landscape);

// Shared geometry: adjacent beats hand off on the SAME numbers
export const pillRect = (L: Layout) => ({ w: P(L, 760, 820), h: P(L, 116, 112), x: L.cx, y: P(L, 1010, 690) });
export const heroPhone = (L: Layout) => {
  const w = P(L, 540, 420);
  return { w, h: phoneHeight(w), x: P(L, L.cx, L.W * 0.7), y: P(L, 1160, L.cy + 10) };
};

// ---------------------------------------------------------------------------
// Problem: the old way piles up (grey skeleton tiles are allowed ONLY here)
// ---------------------------------------------------------------------------
const SkeletonTile: React.FC<{ w: number; h: number; label: string }> = ({ w, h, label }) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: 20,
      background: C.skel,
      border: `1.5px solid ${C.skelEdge}`,
      boxShadow: "0 24px 50px -20px rgba(0,0,0,0.9)",
      display: "flex",
      alignItems: "flex-end",
      padding: 18,
      fontFamily: F.mono,
      fontSize: 20,
      color: C.ink4,
      overflow: "hidden",
    }}
  >
    {label}
  </div>
);

export const Problem: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLayout();
  const usable = L.W - L.side * 2;
  const size = Math.min(...COPY.problem.stack.map((w) => fitSize(w, P(L, 206, 184), usable)));
  const punchSize = fitSize(COPY.problem.punch, P(L, 230, 210), usable);
  const pill = pillRect(L);
  const k = prog(f, 58, 70, EASE.exit); // implode into the turn's point
  const [sx, sy] = shake(f, 30, 16, 7, "pile");
  const tiles = Array.from({ length: 16 }, (_, i) => ({
    i,
    w: 220 + random(`w${i}`) * 140,
    h: 90 + random(`h${i}`) * 160,
    x: L.side + random(`x${i}`) * (L.W - L.side * 2 - 300),
    y: P(L, 380, 90) + (i % 8) * P(L, 150, 110) + random(`y${i}`) * 80,
    at: 26 + i * 1.4,
    r: (random(`r${i}`) - 0.5) * 24,
  }));
  return (
    <AbsoluteFill
      style={{
        transformOrigin: `${pill.x}px ${pill.y}px`,
        transform: `translate(${sx}px, ${sy}px) scale(${1 - k}) rotate(${k * 28}deg)`,
        filter: k > 0 ? `blur(${k * 10}px)` : undefined,
        opacity: 1 - prog(f, 64, 70),
      }}
    >
      <div style={{ position: "absolute", left: L.side, top: P(L, 470, 150) }}>
        {COPY.problem.stack.map((w, i) => (
          <div key={w} style={{ height: size * 0.93 }}>
            <Slam at={[-4, 8][i] ?? 16} size={size} seed={`st${i}`}>
              {w}
            </Slam>
          </div>
        ))}
      </div>
      {tiles.map((t) => {
        if (f < t.at) return null;
        const sp = spring({ frame: f - t.at, fps, config: { damping: 13, mass: 0.7, stiffness: 170 } });
        return (
          <div key={t.i} style={{ position: "absolute", left: t.x, top: lerp(-t.h - 300, t.y, sp), transform: `rotate(${lerp(t.r * 3, t.r, sp)}deg)` }}>
            <SkeletonTile w={t.w} h={t.h} label={COPY.skeleton[t.i % COPY.skeleton.length]} />
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 0, right: 0, top: P(L, 1300, 700), textAlign: "center" }}>
        <Slam at={32} size={punchSize} from={1.7} origin="center" seed="punch">
          {COPY.problem.punch}
        </Slam>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Turn: a point → shockwave → the product's first element
// ---------------------------------------------------------------------------
export const Turn: React.FC = () => {
  const f = useCurrentFrame();
  const L = useLayout();
  const p = pillRect(L);
  if (f < 8) return null;
  const w = lerp(18, p.w, prog(f, 10, 24));
  const h = lerp(18, p.h, prog(f, 10, 20));
  const typed = Math.round(prog(f, 20, 36, (t) => t) * COPY.turn.name.length);
  const size = Math.min(...COPY.turn.words.map((w) => fitSize(w, P(L, 232, 200), L.W - L.side * 2)));
  return (
    <AbsoluteFill>
      <Glow x={p.x} y={p.y} r={520} opacity={prog(f, 8, 22)} />
      <Shock x={p.x} y={p.y} at={9} dur={24} r={620} />
      <div
        style={{
          position: "absolute",
          left: p.x - w / 2,
          top: p.y - h / 2,
          width: w,
          height: h,
          borderRadius: h / 2,
          background: C.surface2,
          border: `2px solid ${C.accent}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          fontFamily: F.mono,
          fontSize: p.h * 0.34,
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ opacity: prog(f, 16, 22) }}>
          <span style={{ color: C.ink3 }}>{COPY.turn.prefix}</span>
          <span style={{ color: C.ink, fontWeight: 600 }}>{COPY.turn.name.slice(0, typed)}</span>
        </span>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: P(L, 470, 170), display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ height: size * 0.9 }}>
          <Slam at={12} size={size} origin="center" seed="w0">{COPY.turn.words[0]}</Slam>
        </div>
        <Slam at={20} size={size} origin="center" color={C.accent} seed="w1">{COPY.turn.words[1]}</Slam>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Proof: the hero device with REAL UI (replace ReplaceMe), a 2.5D settle + push
// ---------------------------------------------------------------------------
export const Proof: React.FC = () => {
  const f = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const L = useLayout();
  const ph = heroPhone(L);
  const tilt = prog(f, 0, 14) * (1 - spring({ frame: f - 14, fps, config: SETTLE }));
  const push = lerp(0.97, 1.06, prog(f, 10, durationInFrames - 1, EASE.glide));
  const proofSize = fitSize(COPY.proof.words.join(" "), P(L, 150, 150), L.W - L.side * 2);
  return (
    <AbsoluteFill>
      <Glow x={ph.x} y={ph.y - 110} r={640} opacity={0.85} />
      <Camera x={ph.x} y={ph.y} scale={push} rx={10 * tilt} ry={-16 * tilt}>
        <div style={{ opacity: prog(f, 0, 8) }}>
          <Phone width={ph.w} bg="#0a0a0b">
            <ReplaceMe label="mount the product's real component here (surfaces.tsx)" />
          </Phone>
        </div>
      </Camera>
      <div style={{ position: "absolute", left: 0, right: 0, top: P(L, 262, 300), display: "flex", justifyContent: "center", gap: 30 }}>
        <Slam at={8} size={proofSize} origin="center" seed="p0">{COPY.proof.words[0]}</Slam>
        <Slam at={18} size={proofSize} origin="center" color={C.accent} seed="p1">{COPY.proof.words[1]}</Slam>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// End card: question + lanes collapsing into the ONE logo reveal + the CTA
// ---------------------------------------------------------------------------
export const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLayout();
  const logoY = P(L, 1160, 600);
  const logoSize = P(L, 240, 190);
  const reveal = prog(f, 56, 70);
  const ctaT = prog(f, 56, 74);
  return (
    <AbsoluteFill style={{ transform: `scale(${lerp(1, 1.025, prog(f, 60, 150, EASE.glide))})`, transformOrigin: `${L.cx}px ${logoY}px` }}>
      <Lanes
        cx={L.cx}
        cy={logoY}
        w={P(L, 520, 760)}
        h={P(L, 980, 520)}
        gap={44}
        lanes={9}
        draw={prog(f, 0, 22)}
        collapse={prog(f, 40, 60, EASE.glide)}
        plate={logoSize * 0.8}
        accentMix={prog(f, 44, 56)}
        opacity={1 - prog(f, 58, 64)}
      />
      <Glow x={L.cx} y={logoY} r={520} opacity={prog(f, 56, 76) * 0.9} />
      <div style={{ position: "absolute", left: 90, right: 90, top: P(L, 450, 140), display: "flex", justifyContent: "center" }}>
        <Stagger words={COPY.end.question} at={10} per={3} size={P(L, 124, 110)} accent={{ from: COPY.end.accentFrom, color: C.accent }} maxWidth={P(L, 900, 1500)} />
      </div>
      {f >= 54 && (
        <div style={{ position: "absolute", left: L.cx - logoSize / 2, top: logoY - logoSize / 2, transform: `scale(${lerp(0.86, 1, punch(f, fps, 58))})` }}>
          <LogoMark size={logoSize} t={reveal} />
        </div>
      )}
      {/* Replace this pill with the product's REAL sign-up / CTA component */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: logoY + logoSize / 2 + P(L, 90, 56),
          display: "flex",
          justifyContent: "center",
          opacity: ctaT > 0 ? 1 : 0,
          transform: `translateY(${(1 - ctaT) * 30}px)`,
        }}
      >
        <div style={{ padding: "26px 54px", borderRadius: 999, background: C.ink, color: C.canvasDeep, fontFamily: F.sans, fontWeight: 700, fontSize: P(L, 40, 34), clipPath: `inset(-10px ${(1 - ctaT) * 50}% round 999px)` }}>
          {COPY.end.cta}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export { Word };

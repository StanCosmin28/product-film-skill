// Product film: motion kit. Every primitive is driven by useCurrentFrame();
// nothing runs on wall-clock time. Extend it, don't rewrite it.
import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, EASE, F, HERO, PUNCH } from "./tokens";

// ---------- math ----------
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0→1 between frames a and b with an easing (default: enter curve). */
export const prog = (f: number, a: number, b: number, easing: (t: number) => number = EASE.enter) =>
  interpolate(f, [a, b], [0, 1], { ...CLAMP, easing });

/** Punch spring starting at frame `at`. */
export const punch = (f: number, fps: number, at: number, config: object = PUNCH) =>
  spring({ frame: f - at, fps, config });

/** Deterministic decaying shake: [x, y] offset in px. */
export const shake = (f: number, at: number, dur: number, amp: number, seed = "s"): [number, number] => {
  if (f < at || f > at + dur) return [0, 0];
  const k = 1 - (f - at) / dur;
  return [(random(`${seed}x${f}`) - 0.5) * 2 * amp * k, (random(`${seed}y${f}`) - 0.5) * 2 * amp * k];
};

// ---------- canvas ----------
/** The page canvas: a soft radial gradient in the palette's canvas tones. */
export const Canvas: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(120% 75% at 50% -18%, ${C.canvasTop} 0%, ${C.canvas} 42%, ${C.canvasDeep} 100%)`,
    }}
  >
    {children}
  </AbsoluteFill>
);

/**
 * Ambient accent glow. Drawn from a dithered
 * texture: a CSS radial-gradient on near-black bands visibly in 8-bit video.
 * Its blur is never animated, only its place and opacity.
 */
export const Glow: React.FC<{ x: number; y: number; r: number; opacity?: number }> = ({ x, y, r, opacity = 1 }) => (
  <Img
    src={staticFile("film/glow.png")}
    style={{
      position: "absolute",
      left: x - r,
      top: y - r,
      width: r * 2,
      height: r * 2,
      opacity,
      pointerEvents: "none",
    }}
  />
);

/** Film grain: 4 static noise tiles, one per frame, random offset. */
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.055 }) => {
  // whole frames only: sub-frame samples (motion blur) share one grain pattern
  const f = Math.floor(useCurrentFrame() + 1e-6);
  const i = f % 4;
  const ox = Math.floor(random(`gx${f}`) * 320);
  const oy = Math.floor(random(`gy${f}`) * 320);
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `url(${staticFile(`film/grain-${i}.png`)})`,
        backgroundPosition: `${ox}px ${oy}px`,
        backgroundSize: "320px 320px",
        mixBlendMode: "overlay",
        opacity,
        pointerEvents: "none",
      }}
    />
  );
};

// ---------- kinetic type ----------
/**
 * fitSize — the largest font size (≤ max) at which `text` fits in `width` px.
 * Heuristic per-character widths for a heavy display face (uppercase ≈ 0.66 em,
 * lowercase ≈ 0.54 em, narrow glyphs ≈ 0.3 em), tracking included. Use it for
 * EVERY headline: product copy varies and overflowing text is the #1 layout bug.
 */
export const fitSize = (text: string, max: number, width: number, { upper = true, tracking = -0.055 } = {}) => {
  let em = 0;
  for (const ch of upper ? text.toUpperCase() : text) {
    em += /[.,:;'!|I1ijlt ]/.test(ch) ? 0.3 : /[MWmw]/.test(ch) ? 0.86 : upper || /[A-Z0-9]/.test(ch) ? 0.66 : 0.54;
    em += tracking;
  }
  return Math.min(max, Math.floor(width / Math.max(em, 0.1)));
};

type WordProps = {
  size: number;
  color?: string;
  weight?: number;
  upper?: boolean;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

/** Static hero word (no motion) — used inside the moving primitives. */
export const Word: React.FC<WordProps> = ({ size, color = C.ink, weight = HERO.weight, upper = true, style, children }) => (
  <span
    style={{
      display: "inline-block",
      fontFamily: F.display,
      fontSize: size,
      fontWeight: weight,
      letterSpacing: HERO.tracking,
      lineHeight: HERO.leading,
      textTransform: upper ? "uppercase" : "none",
      color,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </span>
);

/**
 * SlamIn — scale 1.35→1 in ~8f with a punch spring, weight inflates 480→800,
 * then a 2f impact (hairline shake). `at` may be negative: the film opens
 * mid-slam, so frame 0 is already moving.
 */
export const Slam: React.FC<
  WordProps & { at: number; from?: number; origin?: string; impact?: boolean; seed?: string }
> = ({ at, from = 1.35, origin = "left center", impact = true, seed = "slam", weight = HERO.weight, ...word }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const t = punch(f, fps, at);
  const scale = lerp(from, 1, t);
  const opacity = interpolate(f - at, [0, 2], [0, 1], CLAMP);
  const wght = lerp(480, weight, prog(f, at, at + 9));
  const [sx, sy] = impact ? shake(f, at + 7, 4, word.size * 0.014, seed) : [0, 0];
  return (
    <Word
      {...word}
      weight={wght}
      style={{
        ...word.style,
        opacity,
        transform: `translate(${sx}px, ${sy}px) scale(${scale})`,
        transformOrigin: origin,
      }}
    />
  );
};

/**
 * RollSwap — words replace each other in place: the incoming word pushes the
 * outgoing one out of a clipped line (vertical mask roll).
 */
export const Roll: React.FC<
  Omit<WordProps, "children"> & {
    words: { text: string; at: number; color?: string }[];
    exitAt?: number;
    align?: "left" | "center";
    width?: number;
  }
> = ({ words, exitAt, align = "center", width, size, ...word }) => {
  const f = useCurrentFrame();
  const lineH = size * 1.02;
  return (
    <div
      style={{
        position: "relative",
        height: lineH,
        width: width ?? "100%",
        overflow: "hidden",
        textAlign: align,
      }}
    >
      {words.map((w, i) => {
        const next = words[i + 1]?.at ?? exitAt ?? Infinity;
        if (f < w.at || f > next + 10) return null;
        // outgoing and incoming ride the SAME curve: a clean push, never overlapping
        const inY = 1 - prog(f, w.at, w.at + 10);
        const outY = Number.isFinite(next) ? prog(f, next, next + 10) : 0;
        const y = (inY - outY) * 105;
        return (
          <div
            key={w.text + i}
            style={{ position: "absolute", inset: 0, transform: `translateY(${y}%)`, paddingTop: size * 0.08 }}
          >
            <Word size={size} {...word} color={w.color ?? word.color}>
              {w.text}
            </Word>
          </div>
        );
      })}
    </div>
  );
};

/** WordStagger — each word rises out of its own baseline mask, `per` frames apart. */
export const Stagger: React.FC<{
  words: readonly string[];
  at: number;
  per?: number;
  size: number;
  color?: string;
  accent?: { from: number; color: string };
  weight?: number;
  lineHeight?: number;
  align?: "left" | "center";
  maxWidth?: number;
}> = ({ words, at, per = 3, size, color = C.ink, accent, weight = 700, lineHeight = 1.0, align = "center", maxWidth }) => {
  const f = useCurrentFrame();
  return (
    <div
      style={{
        fontFamily: F.display,
        fontSize: size,
        fontWeight: weight,
        letterSpacing: "-0.045em",
        lineHeight,
        textAlign: align,
        maxWidth,
        textWrap: "balance",
      }}
    >
      {words.map((w, i) => {
        const s = at + i * per;
        const t = prog(f, s, s + 14);
        const isAccent = accent && i >= accent.from;
        return (
          <span
            key={i}
            style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top", padding: "0.06em 0.02em 0.12em", margin: "-0.06em 0 -0.12em" }}
          >
            <span
              style={{
                display: "inline-block",
                transform: `translateY(${(1 - t) * 110}%)`,
                color: isAccent ? accent!.color : color,
              }}
            >
              {w}
            </span>
            {i < words.length - 1 ? " " : ""}
          </span>
        );
      })}
    </div>
  );
};

// ---------- numbers ----------
const DIGITS = "0123456789";

/** One rolling digit column; `pos` is continuous (3.4 = between 3 and 4). */
const DigitColumn: React.FC<{ pos: number; size: number; color: string; weight: number }> = ({ pos, size, color, weight }) => {
  const lineH = size * 0.92;
  const wrapped = ((pos % 10) + 10) % 10;
  return (
    <span
      style={{
        display: "inline-block",
        position: "relative",
        height: lineH,
        width: "0.62em",
        overflow: "hidden",
        verticalAlign: "top",
        WebkitMaskImage: "linear-gradient(180deg, transparent 0%, #000 18%, #000 82%, transparent 100%)",
        maskImage: "linear-gradient(180deg, transparent 0%, #000 18%, #000 82%, transparent 100%)",
      }}
    >
      <span
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          transform: `translateY(${-wrapped * lineH}px)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {(DIGITS + "0").split("").map((d, i) => (
          <span key={i} style={{ height: lineH, lineHeight: `${lineH}px`, color, fontWeight: weight }}>
            {d}
          </span>
        ))}
      </span>
    </span>
  );
};

/** Odometer — continuous value, fixed digit count (01 → 12). */
export const Odometer: React.FC<{ value: number; digits?: number; size: number; color?: string; weight?: number }> = ({
  value,
  digits = 2,
  size,
  color = C.ink,
  weight = 800,
}) => {
  const cols: number[] = [];
  for (let d = digits - 1; d >= 0; d--) {
    const unit = Math.pow(10, d);
    const whole = Math.floor(value / unit);
    // a higher digit only rolls while the lower ones pass 9 → 0
    const below = value % unit;
    const carry = d === 0 ? value % 1 : clamp((below - (unit - 1)) / 1);
    cols.push(d === 0 ? value : whole + carry);
  }
  return (
    <span
      style={{ display: "inline-flex", fontFamily: F.display, fontSize: size, letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums" }}
    >
      {cols.map((p, i) => (
        <DigitColumn key={i} pos={p} size={size} color={color} weight={weight} />
      ))}
    </span>
  );
};

/**
 * SlotNumber — "1,842": every digit spins in from 0 with extra turns and a
 * staggered punch, landing left to right. Separators stay put.
 */
export const SlotNumber: React.FC<{
  text: string;
  at: number;
  size: number;
  color?: string;
  weight?: number;
  turns?: number;
  per?: number;
}> = ({ text, at, size, color = C.ink, weight = 800, turns = 2, per = 5 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  let di = 0;
  return (
    <span
      style={{ display: "inline-flex", fontFamily: F.display, fontSize: size, letterSpacing: "-0.05em", fontVariantNumeric: "tabular-nums" }}
    >
      {text.split("").map((ch, i) => {
        if (!DIGITS.includes(ch)) {
          return (
            <span key={i} style={{ height: size * 0.92, lineHeight: `${size * 0.92}px`, color, fontWeight: weight, width: "0.26em" }}>
              {ch}
            </span>
          );
        }
        const k = di++;
        const target = Number(ch) + 10 * (turns + k);
        const t = spring({ frame: f - at - k * per, fps, config: { damping: 20, mass: 0.6, stiffness: 170 } });
        return <DigitColumn key={i} pos={t * target} size={size} color={color} weight={weight} />;
      })}
    </span>
  );
};

// ---------- track lanes (brand motif) ----------
/**
 * Concentric stadium lanes (a brand motif), drawn in
 * hairlines. `draw` 0→1 strokes them on; `collapse` 0→1 shrinks every lane
 * onto the centre, where the innermost becomes the logo's rounded plate.
 */
export const Lanes: React.FC<{
  cx: number;
  cy: number;
  w: number;
  h: number;
  lanes?: number;
  gap?: number;
  draw?: number;
  collapse?: number;
  plate?: number; // final plate size (px) the lanes collapse into
  color?: string;
  accentMix?: number; // 0→1: the innermost lane turns accent-coloured as the lanes squeeze
  opacity?: number;
}> = ({ cx, cy, w, h, lanes = 8, gap = 40, draw = 1, collapse = 0, plate = 0, color = "rgba(255,255,255,0.2)", accentMix = 0, opacity = 1 }) => {
  const R = Math.max(w, h) / 2 + lanes * gap;
  const fade = `radial-gradient(${R * 1.15}px ${R * 1.15}px at ${cx}px ${cy}px, #000 0%, rgba(0,0,0,0.6) 62%, transparent 100%)`;
  return (
    <svg
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        overflow: "visible",
        pointerEvents: "none",
        opacity,
        WebkitMaskImage: fade,
        maskImage: fade,
      }}
    >
      {Array.from({ length: lanes }, (_, i) => {
        const lw0 = w + i * gap * 2;
        const lh0 = h + i * gap * 2;
        // collapse: lanes race inward, outer lanes a little later (a squeeze)
        const c = clamp(collapse * (1 + i * 0.06));
        const lw = lerp(lw0, plate, c);
        const lh = lerp(lh0, plate, c);
        const rx = lerp(lh0 / 2, plate * 0.21, c);
        const d = clamp(draw * 1.3 - i * 0.04);
        const isHi = i === 0 && accentMix > 0;
        return (
          <rect
            key={i}
            x={cx - lw / 2}
            y={cy - lh / 2}
            width={lw}
            height={lh}
            rx={Math.min(rx, lw / 2, lh / 2)}
            fill="none"
            stroke={isHi ? `color-mix(in srgb, ${C.accent} ${Math.round((0.2 + 0.8 * accentMix) * 100)}%, transparent)` : color}
            strokeWidth={isHi ? lerp(2, 3.5, accentMix) : 2}
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - d}
            opacity={1 - c * (i === 0 ? 0 : 0.9)}
          />
        );
      })}
    </svg>
  );
};

/** Expanding hairline ring (the "snap" shockwave). */
export const Shock: React.FC<{ x: number; y: number; at: number; dur?: number; r?: number; color?: string }> = ({
  x,
  y,
  at,
  dur = 22,
  r = 520,
  color = C.accent,
}) => {
  const f = useCurrentFrame();
  if (f < at || f > at + dur) return null;
  const t = prog(f, at, at + dur);
  const rad = lerp(8, r, t);
  return (
    <div
      style={{
        position: "absolute",
        left: x - rad,
        top: y - rad,
        width: rad * 2,
        height: rad * 2,
        borderRadius: "50%",
        border: `${lerp(3, 1, t)}px solid ${color}`,
        opacity: 1 - t,
      }}
    />
  );
};

/** Diagonal light sweep across its parent (medal glint). `t` 0→1. */
export const Sheen: React.FC<{ t: number; strength?: number; radius?: number | string }> = ({ t, strength = 0.85, radius = "inherit" }) => {
  if (t <= 0 || t >= 1) return null;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: radius, pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: "-50%",
          bottom: "-50%",
          width: "60%",
          left: `${lerp(-80, 140, t)}%`,
          transform: "rotate(18deg)",
          background: `linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,${strength}) 50%, rgba(255,255,255,0) 100%)`,
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
};

/** Mono caption / eyebrow (Geist Mono, uppercase, wide tracking). */
export const Mono: React.FC<{ size?: number; color?: string; style?: React.CSSProperties; children: React.ReactNode }> = ({
  size = 26,
  color = C.ink3,
  style,
  children,
}) => (
  <span
    style={{
      fontFamily: F.mono,
      fontSize: size,
      fontWeight: 500,
      letterSpacing: "0.22em",
      textTransform: "uppercase",
      color,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </span>
);

/** 2.5D camera: perspective wrapper around a centred actor. */
export const Camera: React.FC<{
  x: number;
  y: number;
  scale?: number;
  rx?: number;
  ry?: number;
  rz?: number;
  perspective?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ x, y, scale = 1, rx = 0, ry = 0, rz = 0, perspective = 2200, style, children }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: 0,
      height: 0,
      perspective,
      ...style,
    }}
  >
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        transform: `translate(-50%, -50%) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${scale})`,
        transformStyle: "preserve-3d",
      }}
    >
      {children}
    </div>
  </div>
);

/** A soft floor shadow under an actor (static blur, never animated). */
export const FloorShadow: React.FC<{ w: number; opacity?: number }> = ({ w, opacity = 0.7 }) => (
  <div
    style={{
      position: "absolute",
      left: "50%",
      bottom: -w * 0.08,
      width: w * 0.9,
      height: w * 0.16,
      transform: "translateX(-50%)",
      borderRadius: "50%",
      background: "radial-gradient(closest-side, rgba(0,0,0,0.85), rgba(0,0,0,0))",
      opacity,
    }}
  />
);

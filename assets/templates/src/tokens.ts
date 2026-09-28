// Film tokens. Palette, fonts, easing, the beat map and every on-screen string.
// Scenes never hardcode these. Replace the defaults with the PRODUCT'S own design tokens
// (read its CSS variables / Tailwind theme / brand guide).
import { Easing } from "remotion";

// ---------- Timebase ----------
export const FPS = 60;
export const DURATION = 780; // 13.0 s. See references/craft.md §2 for 10 / 15 / 20 / 30 s maps
export const BPM = 120;
export const BEAT = (60 / BPM) * FPS; // 30 frames per quarter note

// ---------- Palette (defaults = "dark editorial"; accent set by scaffold) ----------
export const C = {
  canvas: "#07090e",
  canvasTop: "#0b0e14",
  canvasDeep: "#020203",
  ink: "#f2f4f7",
  ink2: "#c3c8d0",
  ink3: "#9ba2ad",
  ink4: "#7e8a9c",
  accent: "__ACCENT__",
  accentBright: "__ACCENT_BRIGHT__",
  accentInk: "#04120f", // text on accent fills
  line: "rgba(255,255,255,0.07)",
  line2: "rgba(255,255,255,0.10)",
  line3: "rgba(255,255,255,0.22)",
  surface: "rgba(255,255,255,0.035)",
  surface2: "rgba(255,255,255,0.055)",
  lane: "rgba(255,255,255,0.06)",
  // Problem beat only: the grey "old way"
  skel: "#15181f",
  skelEdge: "rgba(255,255,255,0.08)",
  skelBar: "rgba(255,255,255,0.09)",
  skelBar2: "rgba(255,255,255,0.05)",
} as const;

// ---------- Type (installed by scaffold: Inter Tight + Geist Mono; swap for the brand's) ----------
export const F = {
  display: '"Inter Tight Variable", "Inter Tight", ui-sans-serif, system-ui, sans-serif',
  sans: '"Inter Tight Variable", ui-sans-serif, system-ui, sans-serif',
  mono: '"Geist Mono Variable", ui-monospace, SFMono-Regular, Menlo, monospace',
} as const;
// Families + weights FontGate waits for before the first frame
export const FONT_FACES = [
  '800 100px "Inter Tight Variable"',
  '700 100px "Inter Tight Variable"',
  '500 100px "Inter Tight Variable"',
  '500 20px "Geist Mono Variable"',
];

export const HERO = { weight: 800, tracking: "-0.055em", leading: 0.86 } as const;

// ---------- Motion: two easings + one punch spring ----------
export const EASE = {
  enter: Easing.bezier(0.16, 1, 0.3, 1),
  exit: Easing.bezier(0.7, 0, 0.84, 0),
  glide: Easing.bezier(0.65, 0, 0.35, 1),
} as const;
export const PUNCH = { damping: 12, mass: 0.5, stiffness: 220 } as const;
export const SETTLE = { damping: 20, mass: 0.9, stiffness: 120 } as const;

// ---------- Beat map (global frames) ----------
// Default 13 s film: problem → turn → hero proof → wow → breadth → numbers → end card.
export const BEATS = {
  problem: { from: 0, to: 60 },
  turn: { from: 60, to: 120 },
  proof: { from: 120, to: 630 }, // split into your proof beats (3–5)
  end: { from: 630, to: 780 },
} as const;
export type BeatId = keyof typeof BEATS;

// ---------- Copy: EVERY on-screen string lives here ----------
export const COPY = {
  problem: { stack: ["Your", "work"], punch: "Scattered." },
  turn: { words: ["One", "place."], prefix: "product.com/", name: "you" },
  proof: { words: ["Real", "UI."] },
  end: {
    question: ["Where", "will", "they", "find", "you", "next?"],
    accentFrom: 3,
    cta: "Get started — free",
  },
  skeleton: ["IMG_4829.PNG", "final_v3(2).pdf", "screenshot 14.02", "link 4 of 7", "old website", "notes_old.txt"],
} as const;

// ---------- Device (logical width of the phone screen) ----------
export const PHONE = { logicalWidth: 393, clock: "9:41" } as const;

// ---------- Layout per format ----------
export type Layout = {
  W: number;
  H: number;
  portrait: boolean;
  cx: number;
  cy: number;
  side: number;
  heroSize: number;
  titleSize: number;
};
export const layoutFor = (W: number, H: number): Layout => {
  const portrait = H > W;
  return portrait
    ? { W, H, portrait, cx: W / 2, cy: H / 2, side: 72, heroSize: 220, titleSize: 140 }
    : { W, H, portrait, cx: W / 2, cy: H / 2, side: 150, heroSize: 200, titleSize: 130 };
};

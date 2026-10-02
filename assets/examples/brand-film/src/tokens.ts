// Film tokens: palette, fonts, easing, the beat map and every on-screen string.
// Palette and type are the site's own (stc.com/src/index.css: "Afacere dark glass").
import { Easing } from "remotion";

// ---------- Timebase ----------
// Locked to the music: "Thunder" (Mixkit), 95 BPM. One beat = 37.9 frames, a bar = 151.6.
// The track's drop (20.203 s) lands on frame 120: the green dot is born on the 808.
export const FPS = 60;
export const DURATION = 1200; // 20.0 s
export const BEAT = 0.63158 * FPS; // 37.895 frames
export const BAR = BEAT * 4;
export const DROP = 120;
/** the frame of beat n after the drop (n may be fractional) */
export const B = (n: number) => DROP + n * BEAT;
export const LOGO_AT = B(24); // 1029.5: bar 6 downbeat, the S slams together
export const MUSIC = { file: "audio-src/m318.mp3", start: 20.203 - DROP / FPS } as const;

// ---------- Palette (stc.com tokens) ----------
export const C = {
  canvas: "#07090e",
  canvasTop: "#0a0b0e",
  canvasDeep: "#000000",
  ink: "#f2f4f7",
  ink2: "#c3c8d0",
  ink3: "#9ba2ad",
  ink4: "#7e8a9c",
  ink5: "#4b5361",
  accent: "#34c07a",
  accentBright: "#55e69d",
  lime: "#b1d500", // the stanc.dev mark (stanc-dev-logo.ai)
  logo: "#ebe4dd", // the S mark's cream (public/apple-icon.png)
  line: "rgba(255,255,255,0.07)",
  line2: "rgba(255,255,255,0.10)",
  line3: "rgba(255,255,255,0.18)",
  surface: "rgba(255,255,255,0.035)",
  surface2: "rgba(255,255,255,0.055)",
  // problem beat only: the grey "never built" wireframes
  skel: "#10131a",
  skelEdge: "rgba(255,255,255,0.09)",
  skelBar: "rgba(255,255,255,0.08)",
  skelBar2: "rgba(255,255,255,0.045)",
} as const;

// The hero's own gradient on "ships." (from-white via-emerald-100 to-[#34c07a])
export const HERO_GRADIENT = "linear-gradient(to right, #ffffff, #d0fae5, #34c07a)";

// ---------- Type ----------
export const F = {
  display: '"Bricolage Grotesque", "Geist", system-ui, sans-serif',
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  mono: '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
} as const;
export const FONT_FACES = [
  '600 72px "Bricolage Grotesque"',
  '700 120px "Bricolage Grotesque"',
  '500 20px "Geist Mono"',
  '400 20px "Geist Mono"',
  '400 20px "Geist"',
];

// The real h1 (hero.jsx): lg:text-7xl, font-semibold, tracking -0.045em, leading 1.08, max-w-3xl
export const H1 = { size: 72, weight: 600, tracking: "-0.045em", leading: 1.08, width: 768 } as const;

// ---------- Motion ----------
export const EASE = {
  enter: Easing.bezier(0.16, 1, 0.3, 1),
  exit: Easing.bezier(0.7, 0, 0.84, 0),
  glide: Easing.bezier(0.65, 0, 0.35, 1),
  soft: Easing.bezier(0.33, 0, 0.15, 1),
} as const;
export const PUNCH = { damping: 14, mass: 0.6, stiffness: 180 } as const;
export const SETTLE = { damping: 20, mass: 0.9, stiffness: 120 } as const;

// ---------- Beat map (global frames) ----------
export const BEATS = {
  problem: { from: 0, to: 120 }, // the riser: the old way
  site: { from: 120, to: 575 }, // the drop, the headline, the real site (it stays behind "what I solve")
  solve: { from: 300, to: 575 }, // what I solve: 3 problems flip into fixes on the snares
  services: { from: 537, to: 753 }, // what I offer: the 3 real service cards on a carousel
  how: { from: 715, to: 1010 }, // strategy → architecture → design → code → deploy
  end: { from: 1010, to: 1200 }, // the real logo on the 808, the question, the CTA
} as const;
export type BeatId = keyof typeof BEATS;
// inside the site scene, LOCAL frames (global = 120 + local)
export const SITE = {
  dotLand: B(3) - 120, // the dot lands on the snare
  pullBack: [B(4) - 120, B(4) - 120 + 40],
  recede: [B(5) - 120, B(5) - 120 + 34],
} as const;
// global frames
export const SOLVE = { flips: [B(7), B(8), B(9)] } as const;
export const SWIPE: [number, number] = [B(11), B(11) + 38]; // site + solve ← | → services
export const SERVICES = { fronts: [B(11) + 8, B(13), B(15)] } as const;
export const LIFT: [number, number] = [715, 753]; // services ↑ | ↑ how
export const HOW = { lights: [B(16), B(17.5), B(19), B(20.5), B(22)], collapse: [990, 1010] } as const;
/** bar downbeats where the camera takes a small punch (the 808 hits) */
export const PUNCHES = [B(0), B(4), B(8), B(16), B(24)];

// ---------- Copy: EVERY on-screen string ----------
export const COPY = {
  problem: { lines: [["Most", "ideas"], ["never", "ship."]] },
  // The real h1, word for word; the period of "ships." is where the dot lands
  turn: { words: ["I", "build", "software", "that"], accent: "ships", period: "." },
  solve: {
    eyebrow: "What I solve",
    // pain → fix. Fixes are the site's own promises (hero, why-stan.jsx, process.jsx)
    rows: [
      ["Months of waiting", "Live in 2–4 weeks"],
      ["Five vendors, no owner", "One engineer, end to end"],
      ["Code you can't scale", "Clean code you own"],
    ],
  },
  services: { eyebrow: "What I offer", tiers: ["Web & Mobile Apps", "SaaS & Product Dev", "Freelance Engineering"] },
  how: {
    words: ["Strategy.", "Architecture.", "Design.", "Code.", "Deploy."],
    caption: "One person. Full ownership.",
  },
  // real copy from why-stan.jsx and process.jsx
  strategy: {
    title: "I think about your business, not just the ticket",
    steps: [
      ["01", "Quick Call", "20–30 min"],
      ["02", "Scope & Plan", "24–48h"],
      ["03", "Build & Ship", "2–8 weeks"],
      ["04", "Launch & Support", "Ongoing"],
    ],
  },
  // his real stack (CV + tech-stack.jsx)
  arch: {
    nodes: [
      ["Client", "Web · iOS · Android"],
      ["API", "Node.js · NestJS"],
      ["Data", "PostgreSQL · MongoDB"],
      ["Cloud", "AWS · Vercel"],
      ["Auth & Payments", "Roles · Stripe"],
    ],
  },
  end: {
    question: ["What", "are", "we", "building", "next?"],
    accentFrom: 4,
    name: "Stan Cosmin",
    role: "Software Engineer & Technical Founder",
    url: "stan-cosmin.com",
  },
  skeleton: ["landing_v7.fig", "TODO: launch", "pitch_final(2).pdf", "someday.md", "mvp-scope.docx", "idea.txt"],
} as const;

// Verbatim lines of stc.com/src/components/hero.jsx (line number, text)
export const CODE: [number, string][] = [
  [3, "export default function Hero() {"],
  [4, "  return ("],
  [5, "    <section className=\"relative min-h-[78vh] sm:min-h-[82vh] flex flex-col justify-center items-center px-6 pt-24 pb-12 sm:pt-28 sm:pb-16 overflow-hidden\">"],
  [28, "          <h1 className=\"text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-[-0.045em] leading-[1.08] text-[#f2f4f7] text-balance font-display\">"],
  [29, "            I build software that{\" \"}"],
  [30, "            <span className=\"text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-100 to-[#34c07a]\">"],
  [31, "              ships."],
  [32, "            </span>"],
  [33, "          </h1>"],
];
// The real `vite build` of stc.com (2 Oct 2026)
export const BUILD: string[] = [
  "$ npm run build",
  "vite v7.3.1 building client environment for production...",
  "✓ 1766 modules transformed.",
  "dist/index.html                  6.07 kB │ gzip:   1.97 kB",
  "dist/assets/index-BcaU_oal.css 132.23 kB │ gzip:  21.60 kB",
  "dist/assets/index-J77ejsbn.js  466.96 kB │ gzip: 149.65 kB",
  "✓ built in 1.54s",
];

// ---------- Layout per format ----------
export type Layout = {
  W: number;
  H: number;
  portrait: boolean;
  cx: number;
  cy: number;
  side: number;
  pageW: number; // logical width the real site is laid out at
  viewH: number; // the browser window's viewport height
};
export const layoutFor = (W: number, H: number): Layout => {
  const portrait = H > W;
  return portrait
    ? { W, H, portrait, cx: W / 2, cy: H / 2, side: 72, pageW: 1100, viewH: 780 }
    : { W, H, portrait, cx: W / 2, cy: H / 2, side: 110, pageW: 1280, viewH: 780 };
};

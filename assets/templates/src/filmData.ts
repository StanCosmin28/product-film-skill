// Film-only demo data, in the product's REAL data shapes (copy them from its API
// types / fixtures / demo mode). Why film-only: the product's own demo data is
// often branded (duplicating the logo reveal), uses real third-party names, or is
// random. Keep a clearly fictional demo user, neutral names, local images
// (public/film/), and seeded series so every frame renders the same.
import { staticFile } from "remotion";

export const mulberry32 = (seed: number) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** 30-day series ending on a fixed date (never Date.now()), deterministic. */
export function dailySeries(base: number, variance: number, key: string, seed: number, endUTC = Date.UTC(2026, 0, 14)) {
  const rnd = mulberry32(seed);
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(endUTC - (29 - i) * 86400000);
    const v = Math.round(base + (rnd() - 0.5) * variance);
    return { date: d.toISOString().split("T")[0], [key]: Math.max(0, v) };
  });
}

// Example:
export const DEMO_USER = { id: "demo-1", name: "Demo User", username: "demo", avatar: staticFile("film/avatar.jpg") };

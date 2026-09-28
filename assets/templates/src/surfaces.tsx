// Surfaces: where the product's REAL UI is mounted (path A) or its real captures are placed
// (path B), plus readiness hooks, device frames and film runtime helpers.
// Rule: nothing here redraws product UI. Device frames and the cursor are film chrome.
import React, { useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { continueRender, delayRender, Img, staticFile } from "remotion";
import { C, F, FONT_FACES, PHONE, PUNCH } from "./tokens";
import { lerp, prog, punch } from "./kit";

// ============================================================================
// Film runtime hooks: installed once, film-wide
// ============================================================================
declare global {
  interface Window {
    __filmInlinePortals?: boolean;
    __filmNow?: number;
  }
}
if (typeof window !== "undefined") {
  // Real dialogs portal to <body>; render them in place (src/stubs/react-dom.js)
  window.__filmInlinePortals = true;
  // `new Date()` with NO arguments reads the film clock when set (Film.tsx sets it each frame).
  // Date.now() stays real (Remotion needs it).
  const RealDate = Date;
  if (!(RealDate as unknown as { __film?: boolean }).__film) {
    class FilmDate extends RealDate {
      constructor(...args: unknown[]) {
        if (args.length === 0) super(window.__filmNow ?? RealDate.now());
        // @ts-expect-error — forwarding the original overloads
        else super(...args);
      }
      static now() {
        return RealDate.now();
      }
      static __film = true;
    }
    window.Date = FilmDate as unknown as DateConstructor;
  }
}

/** The film's "now": set it to the time the phone status bar shows. */
export const FILM_NOW = new Date(2026, 0, 15, 9, 41, 0).getTime();
export const filmClock = (globalFrame: number, fps = 60) => FILM_NOW + (globalFrame / fps) * 1000;

// ============================================================================
// Readiness: never capture a half-loaded frame
// ============================================================================
export const FontGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [handle] = useState(() => delayRender("film: fonts"));
  useLayoutEffect(() => {
    Promise.all(FONT_FACES.map((f) => document.fonts.load(f)))
      .then(() => document.fonts.ready)
      .then(() => continueRender(handle));
  }, [handle]);
  return <>{children}</>;
};

/** Holds the render until every <img> inside `ref` is loaded and decoded. */
export const useImagesReady = (ref: React.RefObject<HTMLElement | null>, label = "images") => {
  const [handle] = useState(() => delayRender(`film: ${label}`));
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return void continueRender(handle);
    const imgs = Array.from(el.querySelectorAll("img"));
    imgs.forEach((img) => {
      img.loading = "eager";
      img.decoding = "sync";
    });
    Promise.all(imgs.map((img) => (img.complete && img.naturalWidth > 0 ? Promise.resolve() : img.decode().catch(() => undefined)))).then(() =>
      continueRender(handle),
    );
  }, [handle, ref]);
};

/** Holds the render until `selector` exists inside `ref` (async layouts such as responsive charts). */
export const useSelectorReady = (ref: React.RefObject<HTMLElement | null>, selector: string, label: string) => {
  const [handle] = useState(() => delayRender(`film: ${label}`));
  useLayoutEffect(() => {
    let raf = 0;
    let tries = 0;
    const tick = () => {
      if (ref.current?.querySelector(selector) || tries++ > 600) {
        raf = requestAnimationFrame(() => requestAnimationFrame(() => continueRender(handle)));
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [handle, ref, selector]);
};

/** Per-frame CSS aimed at the real DOM inside a scope class. */
export const ScopedStyle: React.FC<{ css: string }> = ({ css }) => <style>{css}</style>;

/** opacity + rise (+ pop) stagger over real DOM nodes, frame by frame. */
export type CascadeItem = { sel: string; at: number; y?: number; pop?: number; dur?: number };
export const cascadeCSS = (f: number, fps: number, items: CascadeItem[]) =>
  items
    .map(({ sel, at, y = 26, pop, dur = 12 }) => {
      const t = prog(f, at, at + dur);
      const o = prog(f, at, at + 5);
      const s = pop != null ? lerp(pop, 1, punch(f, fps, at, PUNCH)) : 1;
      return `${sel}{opacity:${o.toFixed(3)};transform:translateY(${((1 - t) * y).toFixed(2)}px) scale(${s.toFixed(4)});transform-origin:50% 50%;}`;
    })
    .join("\n");

/**
 * Type a draft into a REAL form (remount it every frame with key={frame}).
 * One flushSync per field, after commit: a form's onChange usually spreads the
 * state from its last render, so batching all fields keeps only the last one.
 */
export const useTypeInto = (ref: React.RefObject<HTMLElement | null>, fields: [id: string, value: string][]) => {
  const [handle] = useState(() => delayRender("film: typing"));
  useLayoutEffect(() => {
    const t = setTimeout(() => {
      for (const [id, value] of fields) {
        const el = ref.current?.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(`#${id}`);
        if (!el || !value) continue;
        const proto = Object.getPrototypeOf(el);
        flushSync(() => {
          Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(el, value);
          el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? "change" : "input", { bubbles: true }));
        });
      }
      requestAnimationFrame(() => continueRender(handle));
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle]);
};

// ============================================================================
// Providers for real components (router, toast, theme, auth mocks…)
// ============================================================================
// import { MemoryRouter } from "react-router-dom";   // resolves from the app's node_modules
export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  // <MemoryRouter initialEntries={["/"]}>{children}</MemoryRouter>
  <>{children}</>
);

// ============================================================================
// Device + window chrome (replace with the product's own device art if its site has one)
// ============================================================================
export const phoneHeight = (width: number) => width * 2.08;

/**
 * CSS phone: bezel, dynamic island, status bar. Content renders at the true
 * logical width (393px) and is scaled into the screen, so real components lay
 * out exactly as on a phone.
 */
export const Phone: React.FC<{ width: number; bg?: string; scroll?: number; children: React.ReactNode }> = ({
  width,
  bg = "#000",
  scroll = 0,
  children,
}) => {
  const height = phoneHeight(width);
  const bezel = width * 0.035;
  const screenW = width - bezel * 2;
  const screenH = height - bezel * 2;
  const scale = screenW / PHONE.logicalWidth;
  const barH = screenH * 0.062;
  const light = luminance(bg) > 140;
  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        borderRadius: width * 0.16,
        background: "linear-gradient(145deg,#2a2d33,#0d0e11 40%,#1b1d22)",
        boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.12), 0 40px 90px -30px rgba(0,0,0,0.9)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: bezel,
          borderRadius: width * 0.13,
          overflow: "hidden",
          background: bg,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: barH,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: `0 ${screenW * 0.1}px`,
            color: light ? "#0a0c10" : "#fff",
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontWeight: 600,
            fontSize: barH * 0.36,
            zIndex: 2,
          }}
        >
          <span>{PHONE.clock}</span>
          <span style={{ width: screenW * 0.3, height: barH * 0.55, borderRadius: 999, background: "#000", position: "absolute", left: "50%", transform: "translateX(-50%)" }} />
          <span style={{ letterSpacing: "0.1em", fontSize: barH * 0.28 }}>▮▮▮</span>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, top: barH, overflow: "hidden" }}>
          <div style={{ width: PHONE.logicalWidth, height: (screenH - barH) / scale, transform: `scale(${scale})`, transformOrigin: "top left", overflow: "hidden" }}>
            <div style={{ transform: `translateY(${-scroll}px)` }}>{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/** Browser / app window chrome with the product URL and a "Live" beacon. `transform` makes it the containing block for inline dialogs. */
export const BrowserWindow: React.FC<{ width: number; height: number; url: string; children: React.ReactNode }> = ({ width, height, url, children }) => (
  <div style={{ width, borderRadius: 26, padding: 5, background: C.surface2, border: `1.5px solid ${C.line2}`, boxShadow: "0 40px 90px -40px rgba(0,0,0,0.9)" }}>
    <div style={{ height: 36, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px" }}>
      <span style={{ fontFamily: F.mono, fontSize: 12, color: C.ink3, padding: "4px 12px", borderRadius: 999, background: C.surface, border: `1px solid ${C.line}` }}>{url}</span>
      <span style={{ fontFamily: F.mono, fontSize: 11, color: C.ink3, letterSpacing: "0.16em", textTransform: "uppercase" }}>
        <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: 4, background: C.accent, marginRight: 8 }} />
        Live
      </span>
    </div>
    <div style={{ position: "relative", height, overflow: "hidden", borderRadius: 21, transform: "translateZ(0)", background: C.canvas }}>{children}</div>
  </div>
);

export const luminance = (hex: string) => {
  const h = (hex || "#000").replace("#", "");
  if (h.length < 6) return 0;
  return (parseInt(h.substring(0, 2), 16) * 299 + parseInt(h.substring(2, 4), 16) * 587 + parseInt(h.substring(4, 6), 16) * 114) / 1000;
};

// ============================================================================
// The logo: revealed ONCE, at the end, joined to the CTA
// ============================================================================
/** Put the product's logo at public/film/logo.svg (or .png). `t` 0→1 reveals it (scale + mask). */
export const LogoMark: React.FC<{ size: number; t: number; src?: string }> = ({ size, t, src = "film/logo.svg" }) => (
  <div style={{ width: size, height: size, clipPath: `inset(${(1 - t) * 50}% round ${size * 0.2}px)` }}>
    <Img src={staticFile(src)} style={{ width: size, height: size, objectFit: "contain", transform: `scale(${lerp(0.86, 1, t)})` }} />
  </div>
);

// ============================================================================
// REAL UI mounts: one surface per component (path A) or capture (path B)
// ============================================================================
// Path A example:
//   import ProfileHeader from "@app/components/ProfileHeader";
//   export const ProfileView: React.FC<{ scope: string }> = ({ scope }) => {
//     const ref = useRef<HTMLDivElement>(null);
//     useImagesReady(ref, scope);
//     return <div ref={ref} className={scope}><Providers><ProfileHeader profile={DEMO_PROFILE} /></Providers></div>;
//   };
// Path B example (element capture at 3×):
//   export const CardCapture: React.FC<{ width: number }> = ({ width }) =>
//     <Img src={staticFile("film/capture/card.png")} style={{ width, display: "block" }} />;

/** Placeholder so the scaffold renders out of the box. Replace with real surfaces. */
export const ReplaceMe: React.FC<{ label: string }> = ({ label }) => {
  const ref = useRef<HTMLDivElement>(null);
  useImagesReady(ref, "placeholder");
  return (
    <div ref={ref} style={{ padding: 28, fontFamily: F.mono, fontSize: 16, color: C.ink3, lineHeight: 1.5 }}>
      REPLACE WITH REAL UI
      <br />
      {label}
    </div>
  );
};

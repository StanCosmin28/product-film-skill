// The timeline. One <Sequence> per beat; TAIL lets a beat keep rendering into the
// next one when both are on screen during a transition (the shared-curve swipes).
// A small camera punch lands on the bar downbeats (the 808s).
// FilmSubframes feeds the master (scripts/master.sh averages 4 sub-frames = motion blur).
import React from "react";
import { AbsoluteFill, Freeze, Sequence, useCurrentFrame } from "remotion";
import "./film.css";
import { BEATS, PUNCHES, type BeatId } from "./tokens";
import { Canvas, Grain } from "./kit";
import { FontGate } from "./surfaces";
import { EndCard, How, Problem, ServicesScene, Site, Solve } from "./scenes";

const TAIL: Record<BeatId, number> = { problem: 0, site: 0, solve: 0, services: 0, how: 0, end: 0 };

const Beat: React.FC<{ id: BeatId; children: React.ReactNode }> = ({ id, children }) => (
  <Sequence name={id} from={BEATS[id].from} durationInFrames={BEATS[id].to - BEATS[id].from + TAIL[id]} layout="none">
    {children}
  </Sequence>
);

const punchAt = (f: number) => PUNCHES.reduce((acc, p) => acc + (f >= p ? 0.022 * Math.exp(-(f - p) / 7) : 0), 0);

export const Film: React.FC = () => {
  const f = useCurrentFrame();
  const k = 1 + punchAt(f);
  return (
    <FontGate>
      <AbsoluteFill className="film-root">
        <Canvas />
        <AbsoluteFill style={{ transform: `scale(${k})` }}>
          <Beat id="problem">
            <Problem />
          </Beat>
          <Beat id="site">
            <Site />
          </Beat>
          <Beat id="solve">
            <Solve />
          </Beat>
          <Beat id="services">
            <ServicesScene />
          </Beat>
          <Beat id="how">
            <How />
          </Beat>
          <Beat id="end">
            <EndCard />
          </Beat>
        </AbsoluteFill>
        <Grain opacity={0.03} />
      </AbsoluteFill>
    </FontGate>
  );
};

// ---------- motion blur: SUB samples per frame over a 180° shutter ----------
export const SUB = 4;
const SHUTTER = 0.5;
export const FilmSubframes: React.FC = () => {
  const k = useCurrentFrame();
  const frame = Math.floor(k / SUB) + ((k % SUB) * SHUTTER) / SUB;
  return (
    <Freeze frame={frame}>
      <Film />
    </Freeze>
  );
};

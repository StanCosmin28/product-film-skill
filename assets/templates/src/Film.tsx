// The timeline. One <Sequence> per beat; TAIL lets a beat keep rendering a few
// frames into the next one when both must be on screen during a transition.
// FilmSubframes feeds the master (scripts/master.sh averages 4 sub-frames = motion blur).
import React from "react";
import { AbsoluteFill, Freeze, Sequence, useCurrentFrame } from "remotion";
import "./film.css";
import { BEATS, type BeatId } from "./tokens";
import { Canvas, Grain } from "./kit";
import { FontGate, filmClock } from "./surfaces";
import { EndCard, Problem, Proof, Turn } from "./scenes";

const TAIL: Record<BeatId, number> = { problem: 12, turn: 0, proof: 0, end: 0 };

const Beat: React.FC<{ id: BeatId; children: React.ReactNode }> = ({ id, children }) => (
  <Sequence name={id} from={BEATS[id].from} durationInFrames={BEATS[id].to - BEATS[id].from + TAIL[id]} layout="none">
    {children}
  </Sequence>
);

export const Film: React.FC = () => {
  const frame = useCurrentFrame();
  // the film clock: status-bar time, countdowns, "x minutes ago" all read it
  if (typeof window !== "undefined") window.__filmNow = filmClock(frame);
  return (
    <FontGate>
      <AbsoluteFill className="film-root">
        <Canvas />
        <Beat id="problem">
          <Problem />
        </Beat>
        <Beat id="turn">
          <Turn />
        </Beat>
        <Beat id="proof">
          <Proof />
        </Beat>
        <Beat id="end">
          <EndCard />
        </Beat>
        <Grain />
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

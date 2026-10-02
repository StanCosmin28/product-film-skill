import React from "react";
import { Composition } from "remotion";
import { Film, FilmSubframes, SUB } from "./Film";
import { DURATION, FPS } from "./tokens";

// <Id>9x16 / <Id>16x9 for previews; the *Sub versions feed scripts/master.sh (motion blur).
// Extra formats are extra compositions: 1:1 (1080×1080), 4:5 (1080×1350).
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Film9x16" component={Film} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} />
    <Composition id="Film16x9" component={Film} durationInFrames={DURATION} fps={FPS} width={1920} height={1080} />
    <Composition id="Film9x16Sub" component={FilmSubframes} durationInFrames={DURATION * SUB} fps={FPS} width={1080} height={1920} />
    <Composition id="Film16x9Sub" component={FilmSubframes} durationInFrames={DURATION * SUB} fps={FPS} width={1920} height={1080} />
  </>
);

"""The film's score. Cue frames are copied from src/scenes.tsx (global frame =
beat start + local frame). When a scene's timing moves, move its cue.

    python3 scripts/sound.py   -> out/audio/sound.wav   (master.sh normalises to -14 LUFS)
"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from sfx import *  # noqa: F401,F403
from sfx import render

drums, music, sfx = Bus(), Bus(), Bus()
BEAT = 30                        # 120 BPM at 60 fps
PULSE_FROM, PULSE_TO = 90, 690   # the pulse starts after the turn and stops on the logo (keep the logo ON the grid)

# Problem (0–70): weight, no pulse
for at in (-4, 8):
    sfx.add(impact(0.55), fr(at + 5), 0.5)          # slam landings
for i in range(16):
    sfx.add(clack(0.8 + rng.uniform(0, 0.6)), fr(26 + i * 1.4 + 9), 0.3, pan=rng.uniform(-0.7, 0.7))
sfx.add(impact(1.3), fr(37), 0.9)                   # the punch word
sfx.add(suck(fr(70) - fr(55)), fr(55), 0.7)         # implode

# Turn (60–120)
sfx.add(ping(note("A5"), 1.4, 0.4), fr(69))
drums.add(kick(0.7), fr(69), 0.7)
for k in range(8):
    sfx.add(key_click(), fr(80 + 2 * k), 0.4)
sfx.add(impact(0.5), fr(76), 0.4); sfx.add(impact(0.5), fr(84), 0.45)

# Proof (120–630): add one line per visual event (camera moves, pops, clicks, glints, counters)
sfx.add(whoosh(0.32, 400, 3500, 0.5, 0.45), fr(118))

# End (630–780): riser → the one logo sting ON the beat → CTA tick
LOGO = 690
sfx.add(whoosh(0.4, 250, 2000, 0.5, 0.3), fr(628))
sfx.add(riser(fr(LOGO) - fr(664), 160, 1500, 0.55), fr(664))
sfx.add(impact(1.5), fr(LOGO), 1.0)
for nme, g, p in [("A4", 0.28, -0.2), ("E5", 0.22, 0.2), ("B5", 0.16, -0.35), ("C#6", 0.12, 0.35)]:
    sfx.add(bell(note(nme), 3.0, g), fr(LOGO), 1.0, pan=p)
sfx.add(ping(note("A5"), 2.2, 0.35), fr(LOGO))

# The pulse
for fcount in range(PULSE_FROM, PULSE_TO, BEAT):
    drums.add(kick(), fr(fcount), 0.85)
    drums.add(hat(), fr(fcount + 15), 0.28, pan=0.25)
    drums.add(hat(), fr(fcount + 7.5), 0.1, pan=-0.3)
    drums.add(hat(), fr(fcount + 22.5), 0.1, pan=0.3)
bars = [("A1", ["A2", "E3", "G3", "B3", "C4"]), ("F1", ["F2", "C3", "E3", "A3", "C4"]),
        ("C2", ["C3", "E3", "G3", "B3", "D4"]), ("G1", ["G2", "D3", "E3", "B3", "D4"]),
        ("A1", ["A2", "E3", "G3", "B3", "E4"])]
for b, (root, chord) in enumerate(bars):
    start = PULSE_FROM + b * BEAT * 4
    if start >= PULSE_TO:
        break
    length = min(BEAT * 4, PULSE_TO - start)
    for e in range(BEAT // 2, length, BEAT):
        music.add(sub_note(note(root), 0.2, 0.34), fr(start + e))
    music.add_st(*[pad_chord([note(n) for n in chord], fr(length) + 0.3, 0.16)] * 2, fr(start))
music.add(pad_chord([note(n) for n in ["A2", "E3", "B3", "C#4", "E4"]], 2.2, 0.22, 2600), fr(LOGO))

render(drums, music, sfx, PULSE_FROM, PULSE_TO, "out/audio/sound.wav", BEAT)

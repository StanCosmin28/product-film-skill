# Sound: procedural design on the beat grid

Sound is half the perceived quality. The default is **procedural sound design**, generated in
numpy/scipy from the film's own frame cues. It's always delivered with a **silent copy**, so the
user can lay a licensed track underneath. You can't listen to what you make, so verify it
visually (waveform + spectrogram) and tell the user to listen before publishing.

## The grammar

- **The problem beat has no pulse**, only weight: impacts on slams, clacks of tiles landing, a low rumble.
- **The turn switches the pulse on:** a brand "ping" (clean sine + octave) and the first kick.
- **120 BPM grid** (30 frames per beat at 60 fps): a kick on every beat, closed hats on the off-beats,
  soft 16ths, an off-beat sub bass (pumping between kicks) and a quiet pad chord per bar, ducked
  under the kick.
- **Every visual event gets a cue:** whooshes on camera moves (band-pass noise sweeping up or down),
  ticks on UI pops (short sine blips), key clicks on typing, a click on the button, a shimmer
  (a quick run of high bells) on a glint, counter ticks while numbers run, and a riser into the logo.
- **The logo sting lands ON the beat** (put the logo frame on the grid): a sub impact + an open
  chord of bells + the ping. The pulse stops there, and the tail rings under the question.

## Files

- `scripts/sfx.py`: the instruments (kick, hat, impact, clack, tick, key_click, whoosh, suck,
  ping, bell, shimmer, riser, sub_note, pad_chord), `Bus`, `note()`, `fr()` (frame → seconds)
  and `render(drums, music, sfx, pulse_from, pulse_to, out_path)`, which sidechains the music,
  adds a synthetic reverb to the SFX and pads, and peak-normalises.
- `scripts/sound.py`: the film's **score**, a list of cues whose frame numbers are copied from the
  scenes (write `# B3 — …` comments). When a scene's timing changes, move its cue too.

## Cue sheet from the beat map

For each beat, list its slams (`at + 4..5` lands), camera moves, pops, typing spans, clicks,
glints, counters and transitions. Then write one line per cue:
```python
sfx.add(impact(0.5), fr(E + 6), 0.35)                 # EDIT. lands
sfx.add(whoosh(0.34, 4000, 400, 0.3, 0.45), fr(E + 94))  # the window leaves upward
```
Key clicks: at most one every 2 frames, however fast the text types.

## Mix and loudness

- Peak-normalise in Python, then `ffmpeg -af loudnorm=I=-14:TP=-1.5:LRA=11` (the social / streaming
  target). Verify with `ebur128=peak=true`: integrated about −14 LUFS, true peak ≤ −1.5 dBFS.
- Look at the waveform (`showwavespic`). It needs visible dynamics: B1 punches with gaps, then kicks
  on the grid. A solid block means the mix is over-compressed or too bass-heavy. The two usual fixes
  are to lower the sub, and to move the bass to the off-beats.
- Check the spectrogram (`showspectrumpic`). The low end shouldn't be continuous yellow in the problem beat.

## Variants the user may ask for

| Ask | Do |
|---|---|
| **no sound** | deliver only the `-silent` masters; skip `sound.py` |
| **licensed music** | pick a track at the film's BPM (or retime the grid to the track's BPM: 60 fps × 60 / BPM frames per beat), cut on the downbeats, keep the SFX at −6 dB under the music or drop them |
| **voice-over** | write a script of at most 2.3 words per second, leave space under the VO (sidechain the music by −8 dB), and put the logo on the last word's beat |
| **calmer** | 90–100 BPM, no hats on 16ths, softer pad, no impacts; whooshes only |
| **punchier** | add claps on 2 and 4, a stronger kick click, shorter reverb |

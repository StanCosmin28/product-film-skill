"""The film's sound: a real music bed + real sound effects, placed on the film's frames.

    python3 scripts/music.py ...   # pick and measure the track (see its docstring)
    python3 scripts/sfx_pack.py    # fetch + measure the effects (audio-src/sfx/meta.json)
    python3 scripts/mix.py         # -> out/audio/mix.wav (master.sh normalises to -14 LUFS / -1.5 dBTP)

Every cue is a GLOBAL film frame (60 fps), copied from src/tokens.ts / src/scenes.tsx.
place() lands an effect's PEAK on the frame (its transient, or the end of its rise), so
"hit on frame X" means the listener hears the hit on frame X.

The grammar that made the shipped films work:
- the track starts so its DROP lands on the turn (the problem plays over the riser);
- the intro sits ~5 dB back, so the drop arrives with weight;
- the beat drops out for the last eighth notes before the logo, then slams back ON it;
- after the logo the bed rides out through a low-pass sweep and fades;
- effects stay 10–20 dB under the music, except the logo impact.
"""
import json, os, subprocess, wave
import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
FPS = 60
DUR = 13.0                          # film length (s): match DURATION in tokens.ts
N = int(SR * DUR)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SFX_DIR = os.path.join(ROOT, "audio-src", "sfx")
META = json.load(open(os.path.join(SFX_DIR, "meta.json"))) if os.path.exists(os.path.join(SFX_DIR, "meta.json")) else {}

# ---- the track (from scripts/music.py grid) ----
MUSIC_FILE = os.path.join(ROOT, "audio-src", "m318.mp3")
DROP_TRACK = 20.203                 # the drop in the track (s)
DROP_FILM = 120                     # ...the frame it lands on
BEAT = 0.63158 * FPS                # frames per beat
MUSIC_START = DROP_TRACK - DROP_FILM / FPS


def Bt(n):
    """frame of beat n after the drop"""
    return DROP_FILM + n * BEAT


LOGO = Bt(12)                       # the logo locks on a downbeat
MUTE_FROM = LOGO - 18               # the beat drops out just before it
RIDE_OUT = (DUR * FPS - 60, DUR * FPS - 4)


def load(path, start=0.0, dur=None):
    cmd = ["ffmpeg", "-loglevel", "error", "-ss", f"{start:.4f}", "-i", path]
    if dur:
        cmd += ["-t", f"{dur:.4f}"]
    cmd += ["-ac", "2", "-ar", str(SR), "-f", "f32le", "-"]
    x = np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32)
    return x.reshape(-1, 2).astype(np.float64)


def db(v):
    return 10 ** (v / 20)


def t(frame):
    return frame / FPS


out = np.zeros((N + SR * 8, 2))
duck = np.ones(N + SR * 8)


def place(name, frame, gain_db, pan=0.0, align="peak", trim=None, fade=0.0):
    """put sfx `name` (e.g. "s2908") so its peak (or its start) lands on `frame`"""
    f = next(k for k in META if k.startswith(name + "."))
    x = load(os.path.join(SFX_DIR, f))
    if trim:
        x = x[int(trim[0] * SR):int(trim[1] * SR)].copy()
        off = 0.0
    else:
        off = META[f]["peak"] if align == "peak" else 0.0
    if fade:
        n = int(fade * SR)
        x[:n] *= np.linspace(0, 1, n)[:, None]
        x[-n:] *= np.linspace(1, 0, n)[:, None]
    gl = np.cos((pan + 1) * np.pi / 4) * np.sqrt(2)
    gr = np.sin((pan + 1) * np.pi / 4) * np.sqrt(2)
    i = int((t(frame) - off) * SR)
    if i < 0:
        x = x[-i:]
        i = 0
    n = min(len(x), len(out) - i)
    out[i:i + n, 0] += x[:n, 0] * db(gain_db) * gl
    out[i:i + n, 1] += x[:n, 1] * db(gain_db) * gr


def duck_at(frame, depth_db=-4.0, hold=0.35, release=0.5):
    """dip the music under a big hit"""
    i = int(t(frame) * SR)
    a, h, r = int(0.04 * SR), int(hold * SR), int(release * SR)
    g = np.concatenate([np.linspace(1, db(depth_db), a), np.full(h, db(depth_db)), np.linspace(db(depth_db), 1, r)])
    s = max(0, i - a)
    duck[s:s + len(g)] = np.minimum(duck[s:s + len(g)], g[: len(duck[s:s + len(g)])])


# ------------------------------------------------------------------ the cues (edit these)
# One line per visual event, with a comment naming it. Roles of each file: audio-src/sfx/meta.json.
place("s1493", DROP_FILM - 8, -5)           # the problem collapses into a point
place("s2908", DROP_FILM, -9)               # the drop: the turn
place("s2520", Bt(3), -7)                   # a landing on the snare
place("s1492", Bt(8), -6)                   # a swipe between scenes
place("s790", LOGO - 2, -8)                 # riser into the logo
place("s788", LOGO, -2)                     # the logo impact
place("s2908", LOGO, -6)
place("s2568", LOGO + 58, -12)              # the CTA pops

# ------------------------------------------------------------------ music bed
music = load(MUSIC_FILE, MUSIC_START, DUR + 1.0)[:N]
n_in = int(0.12 * SR)
music[:n_in] *= np.linspace(0, 1, n_in)[:, None]
# ride-out: a click-free low-pass sweep (blend fixed low-passed versions) and a fade
a, b = int(t(RIDE_OUT[0]) * SR), int(t(RIDE_OUT[1]) * SR)
seg = music[a:].copy()
cuts = [16000, 6000, 2500, 1100, 520, 240]
V = np.stack([sosfilt(butter(2, fc, btype="low", fs=SR, output="sos"), seg, axis=0) for fc in cuts])
k = np.clip(np.arange(len(seg)) / max(1, b - a), 0, 1) * (len(cuts) - 1)
lo = np.floor(k).astype(int).clip(0, len(cuts) - 2)
w = (k - lo)[:, None]
idx = np.arange(len(seg))
music[a:] = (V[lo, idx] * (1 - w) + V[lo + 1, idx] * w) * (np.clip(1 - idx / max(1, b - a), 0, 1) ** 1.6)[:, None]
# the intro sits back; the beat drops out before the logo
pre = np.full(N, db(-5.0))
pre[int(t(DROP_FILM - 1) * SR):] = 1.0
m0, m1, r = int(t(MUTE_FROM) * SR), int(t(LOGO - 1) * SR), int(0.05 * SR)
pre[m0:m1] = db(-22.0)
pre[m0 - r:m0] = np.linspace(1.0, db(-22.0), r)
music *= (duck[:N] * pre)[:, None] * db(-2.0)

mix = out[:N] + music
mix = np.tanh(mix * 0.9) / 0.9      # gentle bus glue, no pumping
fade = int(0.2 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
mix /= np.max(np.abs(mix)) / 0.89

os.makedirs(os.path.join(ROOT, "out", "audio"), exist_ok=True)
path = os.path.join(ROOT, "out", "audio", "mix.wav")
with wave.open(path, "wb") as wv:
    wv.setnchannels(2)
    wv.setsampwidth(2)
    wv.setframerate(SR)
    wv.writeframes((mix * 32767).astype(np.int16).tobytes())
print(path, len(mix) / SR, "s")

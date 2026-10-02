"""The film's sound: a real music bed + real sound effects, placed on the film's frames.

Music: "Thunder" by Arulo, Mixkit (Mixkit Stock Music Free License). 95 BPM trap.
SFX:   Mixkit sound effects (Mixkit Sound Effects Free License).
Files live in audio-src/ (music) and audio-src/sfx/ (effects).

Every cue is a GLOBAL film frame (60 fps), copied from src/scenes.tsx / src/tokens.ts.
A cue names the frame where the effect's PEAK lands (its transient or the end of its rise),
so "hit on frame X" means the listener hears the hit on frame X.

    python3 scripts/mix.py   -> out/audio/mix.wav   (master.sh normalises to -14 LUFS / -1.5 dBTP)
"""
import json, os, subprocess
import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
FPS = 60
DUR = 20.0
N = int(SR * DUR)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SFX_DIR = os.path.join(ROOT, "audio-src", "sfx")
META = json.load(open(os.path.join(SFX_DIR, "meta.json")))

MUSIC_FILE = os.path.join(ROOT, "audio-src", "m318.mp3")
DROP_TRACK = 20.203                # the 808 drop in the track
DROP_FILM = 120                    # ...lands on the green dot
MUSIC_START = DROP_TRACK - DROP_FILM / FPS
BEAT = 0.63158 * FPS               # 37.9 frames
def Bt(n):
    return DROP_FILM + n * BEAT
LOGO = Bt(24)                      # 1029.5, bar 6 downbeat


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
    """put sfx `name` so its peak (or its start) lands on `frame`"""
    f = next(k for k in META if k.startswith(name + "."))
    x = load(os.path.join(SFX_DIR, f))
    if trim:
        a, b = trim
        x = x[int(a * SR):int(b * SR)].copy()
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
    a = int(0.04 * SR)
    h = int(hold * SR)
    r = int(release * SR)
    g = np.concatenate([np.linspace(1, db(depth_db), a), np.full(h, db(depth_db)), np.linspace(db(depth_db), 1, r)])
    s = max(0, i - a)
    duck[s:s + len(g)] = np.minimum(duck[s:s + len(g)], g[: len(duck[s:s + len(g)])])


# ------------------------------------------------------------------ the cues
# B1 problem (0–120): the track's riser
place("s166", 2, -16, -0.2)                   # "Most ideas" rising
place("s175", 26, -15, 0.2)                   # "never ship."
place("s1493", 112, -5)                       # the wireframes swirl into one point
place("s2608", 110, -12)
# B2 the DROP (120): the green dot is born on the 808
place("s2908", 120, -9)
place("s2521", 122, -9)
place("s3124", 132, -18, -0.3)                # the headline rises
place("s3124", 150, -18, 0.3)
place("s2520", Bt(3), -7)                     # the dot lands as the period of "ships." (snare)
# B3 the real site
place("s1486", Bt(4) + 14, -9)                # pull back into the window
for k in range(3):
    place("s2568", Bt(4) + 10 + 9 * k, -19, -0.4 + 0.4 * k)
place("s169", Bt(5) + 20, -10, 0.2)           # the window steps back
# B4 what I solve: rows land, then strike + flip on the beat
for k in range(3):
    place("s2568", 312 + 7 * k, -18, -0.3 + 0.3 * k)
for k, fr in enumerate((Bt(7), Bt(8), Bt(9))):
    place("s166", fr - 8, -16, 0.3)           # the strike
    place("s2577", fr, -10, -0.2 + 0.2 * k)   # the flip
    place("s2520", fr + 2, -15, 0.2)
# B5 what I offer
place("s1492", Bt(11) + 24, -6)               # swipe to the services
for fr in (Bt(13), Bt(15)):
    place("s3120", fr - 6, -10)               # the carousel turns
    place("s2573", fr, -13)
place("s3114", 735, -7)                       # lift into the tower
# B6 how: one cue per layer
for k, fr in enumerate((Bt(16), Bt(17.5), Bt(19), Bt(20.5), Bt(22))):
    place("s175", fr - 4, -14, -0.2 + 0.1 * k)
    place("s2573", fr, -12)
for k in range(4):
    place("s2568", Bt(16) + 6 + 8 * k, -21, -0.3 + 0.2 * k)  # the 4 process steps
place("s2537", Bt(20.5), -15, 0.0, trim=(6.9, 7.6), fade=0.04)  # code types in
place("s2520", Bt(22) + 26, -10, 0.2)         # ✓ built in 1.54s
place("s1492", 1010, -5)                      # the tower collapses into the dot
# B7 the logo: a beat of silence, then the slam ON the 808
place("s790", LOGO - 2, -8)                   # riser into the slam
place("s788", LOGO, -2)
place("s2908", LOGO, -6)
place("s2568", 1088, -12)                     # the button pops
place("s3124", 1096, -18)

# ------------------------------------------------------------------ music bed
music = load(MUSIC_FILE, MUSIC_START, DUR + 1.0)[:N]
n_in = int(0.12 * SR)
music[:n_in] *= np.linspace(0, 1, n_in)[:, None]
# after the logo: the bed closes down (low-pass sweep) and fades out under the impact's tail
a = int(t(1140) * SR)
b = int(t(1196) * SR)
seg = music[a:].copy()
# click-free sweep: blend between fixed low-pass versions of the same tail
cuts = [16000, 6000, 2500, 1100, 520, 240]
vers = [sosfilt(butter(2, fc, btype="low", fs=SR, output="sos"), seg, axis=0) for fc in cuts]
k = np.clip(np.arange(len(seg)) / max(1, (b - a)), 0, 1) * (len(cuts) - 1)
lo = np.floor(k).astype(int).clip(0, len(cuts) - 2)
w = (k - lo)[:, None]
V = np.stack(vers)  # (versions, n, 2)
idx = np.arange(len(seg))
y = V[lo, idx] * (1 - w) + V[lo + 1, idx] * w
env = np.clip(1 - np.arange(len(seg)) / max(1, (b - a)), 0, 1) ** 1.6
music[a:] = y * env[:, None]
# the intro sits back so the drop on the green dot lands with weight
pre = np.full(N, db(-5.0))
d0 = int(t(DROP_FILM - 1) * SR)
pre[d0:] = 1.0
# the beat drops out for the last 8th notes before the logo, then slams back on it
m0, m1 = int(t(1012) * SR), int(t(LOGO - 1) * SR)
r = int(0.05 * SR)
pre[m0:m1] = db(-22.0)
pre[m0 - r:m0] = np.linspace(1.0, db(-22.0), r)
music *= (duck[:N] * pre)[:, None] * db(-2.0)
mix = out[:N] + music
# gentle bus glue: soft knee saturation, no pumping
mix = np.tanh(mix * 0.9) / 0.9
fade = int(0.2 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
mix /= np.max(np.abs(mix)) / 0.89

os.makedirs(os.path.join(ROOT, "out", "audio"), exist_ok=True)
import wave
path = os.path.join(ROOT, "out", "audio", "mix.wav")
with wave.open(path, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())
print(path, len(mix) / SR, "s")

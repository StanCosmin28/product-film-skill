"""Product film: shared procedural sound kit (instruments, buses, mix).
Each film's score lives in its own script (scripts/sound.py).

Notes:

Every cue below is a frame number from src/scenes.tsx / src/Film.tsx (60 fps).
Story in sound: the problem beat has no music, only weight (impacts, the
pile). The snap clicks a 120 BPM pulse on. It runs on the film's beat grid and
cuts out for the logo sting, which rings under the final question.

    python3 scripts/sound.py            -> out/audio/sound.wav
"""
import os
import numpy as np
from scipy.signal import butter, sosfilt, sosfilt_zi, fftconvolve

SR = 48000
FPS = 60
DUR = 13.0
N = int(SR * DUR)
rng = np.random.default_rng(1842)

def fr(frame):
    return frame / FPS

def env_exp(n, decay_s):
    t = np.arange(n) / SR
    return np.exp(-t / max(decay_s, 1e-4))

def adsr(n, a, r):
    """linear attack a seconds, then exponential release r seconds"""
    t = np.arange(n) / SR
    e = np.minimum(1.0, t / max(a, 1e-4))
    rel = np.exp(-np.maximum(0, t - a) / max(r, 1e-4))
    return e * rel

def bp(x, lo, hi, order=2):
    sos = butter(order, [lo, hi], btype="bandpass", fs=SR, output="sos")
    return sosfilt(sos, x)

def hp(x, f, order=2):
    return sosfilt(butter(order, f, btype="highpass", fs=SR, output="sos"), x)

def lp(x, f, order=2):
    return sosfilt(butter(order, f, btype="lowpass", fs=SR, output="sos"), x)

def sweep_bp(x, f0, f1, q=1.4, block=256):
    """band-pass whose centre sweeps f0 -> f1 (exponential), block-wise"""
    out = np.zeros_like(x)
    nb = int(np.ceil(len(x) / block))
    zi = None
    for b in range(nb):
        t = b / max(1, nb - 1)
        fc = f0 * (f1 / f0) ** t
        lo, hi = fc / (1 + 1 / (2 * q)), min(fc * (1 + 1 / (2 * q)), SR / 2 - 100)
        sos = butter(2, [lo, hi], btype="bandpass", fs=SR, output="sos")
        seg = x[b * block:(b + 1) * block]
        if zi is None:
            zi = sosfilt_zi(sos) * 0
        y, zi = sosfilt(sos, seg, zi=zi)
        out[b * block:b * block + len(seg)] = y
    return out

class Bus:
    def __init__(self):
        self.l = np.zeros(N + SR * 3)
        self.r = np.zeros(N + SR * 3)

    def add(self, sig, t, gain=1.0, pan=0.0):
        i = int(t * SR)
        if i < 0:
            sig = sig[-i:]
            i = 0
        n = min(len(sig), len(self.l) - i)
        if n <= 0:
            return
        gl = gain * np.cos((pan + 1) * np.pi / 4) * np.sqrt(2)
        gr = gain * np.sin((pan + 1) * np.pi / 4) * np.sqrt(2)
        self.l[i:i + n] += sig[:n] * gl
        self.r[i:i + n] += sig[:n] * gr

    def add_st(self, l, r, t, gain=1.0):
        i = int(t * SR)
        n = min(len(l), len(self.l) - i)
        self.l[i:i + n] += l[:n] * gain
        self.r[i:i + n] += r[:n] * gain

# ---------------------------------------------------------------- instruments
def kick(punch=1.0):
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    f = 46 + 110 * np.exp(-t / 0.028)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * env_exp(n, 0.2)
    click = hp(rng.standard_normal(n), 3000) * env_exp(n, 0.003) * 0.35
    return np.tanh((body + click) * 1.6 * punch) * 0.9

def hat(open_=False):
    n = int((0.22 if open_ else 0.06) * SR)
    x = hp(rng.standard_normal(n), 7500, 3)
    return x * env_exp(n, 0.07 if open_ else 0.018) * 0.5

def impact(size=1.0):
    """weighty hit: sub boom + low noise thump + short transient"""
    n = int(1.4 * SR)
    t = np.arange(n) / SR
    f = 38 + 70 * np.exp(-t / 0.05)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(n, 0.35 * size)
    thump = lp(rng.standard_normal(n), 900) * env_exp(n, 0.06) * 0.9
    snap = hp(rng.standard_normal(n), 2500) * env_exp(n, 0.006) * 0.4
    return np.tanh((boom * 1.2 + thump + snap) * 1.4) * 0.8

def clack(bright=1.0):
    """a card/tile landing: short wooden-ish knock"""
    n = int(0.12 * SR)
    x = bp(rng.standard_normal(n), 400 * bright, 2400 * bright)
    t = np.arange(n) / SR
    tone = np.sin(2 * np.pi * (180 + 120 * bright) * t) * 0.6
    return (x * 1.4 + tone) * env_exp(n, 0.025) * 0.5

def tick(freq=3200, dur=0.025, gain=0.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * freq * t) + 0.4 * np.sin(2 * np.pi * freq * 2.01 * t)
    return s * env_exp(n, dur / 4) * gain

def key_click():
    n = int(0.03 * SR)
    x = bp(rng.standard_normal(n), 1800, 6500) * env_exp(n, 0.004) * 0.6
    tk = tick(4200, 0.015, 0.15)
    x[: len(tk)] += tk
    return x

def whoosh(dur, f0=300, f1=4000, rise=0.6, gain=0.6):
    n = int(dur * SR)
    x = rng.standard_normal(n)
    y = sweep_bp(x, f0, f1, q=1.2)
    t = np.linspace(0, 1, n)
    e = np.where(t < rise, (t / rise) ** 2, ((1 - t) / (1 - rise)) ** 1.5)
    return y * e * gain

def suck(dur):
    """reverse-feel implode: rising noise that stops dead"""
    n = int(dur * SR)
    y = sweep_bp(rng.standard_normal(n), 200, 6000, q=1.0)
    t = np.linspace(0, 1, n)
    return y * t ** 2.4 * 0.8

def ping(freq=880, dur=1.2, gain=0.5):
    """the brand 'pluck': clean sine + soft octave, fast attack"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(2 * np.pi * freq * 2 * t) + 0.12 * np.sin(2 * np.pi * freq * 3.01 * t)
    return s * adsr(n, 0.002, 0.28) * gain

def bell(freq=1318.5, dur=2.2, gain=0.35):
    n = int(dur * SR)
    t = np.arange(n) / SR
    partials = [(1.0, 1.0, 0.9), (2.76, 0.5, 0.5), (5.40, 0.25, 0.3), (8.93, 0.12, 0.2)]
    s = sum(a * np.sin(2 * np.pi * freq * m * t) * env_exp(n, d) for m, a, d in partials)
    return s * adsr(n, 0.001, 10) * gain

def shimmer(dur=0.9, gain=0.25):
    """medal glint: a quick run of high bells"""
    out = np.zeros(int(dur * SR) + SR)
    for k, f in enumerate([2637, 3136, 3951, 5274]):
        b = bell(f, 1.0, gain * (0.9 - k * 0.15))
        i = int(k * 0.035 * SR)
        out[i:i + len(b)] += b
    return out

def riser(dur, f0=180, f1=1400, gain=0.4):
    n = int(dur * SR)
    t = np.linspace(0, 1, n)
    noise = sweep_bp(rng.standard_normal(n), 600, 9000, q=0.9) * t ** 2 * 0.7
    f = f0 * (f1 / f0) ** t
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * t ** 1.5 * 0.35
    return (noise + tone) * gain

def sub_note(freq, dur, gain=0.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * freq * t) + 0.18 * np.sin(2 * np.pi * freq * 2 * t)
    return s * adsr(n, 0.005, dur * 0.6) * gain

def pad_chord(freqs, dur, gain=0.12, cutoff=1800):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for f in freqs:
        for det in (-0.12, 0.0, 0.11):
            ph = 2 * np.pi * f * (1 + det / 100) * t + rng.uniform(0, 2 * np.pi)
            # band-limited-ish saw: few harmonics
            s += sum(np.sin(k * ph) / k for k in range(1, 7))
    s = lp(s, cutoff, 2)
    e = np.minimum(1, t / 0.35) * np.minimum(1, (dur - t) / 0.4).clip(0, 1)
    return s * e * gain / (len(freqs) * 3)

def note(name):
    names = {"C": -9, "C#": -8, "D": -7, "D#": -6, "E": -5, "F": -4, "F#": -3, "G": -2, "G#": -1, "A": 0, "A#": 1, "B": 2}
    n, o = name[:-1], int(name[-1])
    return 440.0 * 2 ** ((names[n] + (o - 4) * 12) / 12)

# ---------------------------------------------------------------- mix
def render(drums, music, sfx, pulse_from, pulse_to, out_path, beat=30):
    PULSE_FROM, PULSE_TO, BEAT = pulse_from, pulse_to, beat
    def sidechain(bus_l, bus_r):
        """duck music under every kick"""
        g = np.ones(len(bus_l))
        for fcount in range(PULSE_FROM, PULSE_TO, BEAT):
            i = int(fr(fcount) * SR)
            n = int(0.22 * SR)
            curve = 1 - 0.65 * np.exp(-np.arange(n) / SR / 0.07)
            g[i:i + n] = np.minimum(g[i:i + n], curve[: len(g[i:i + n])])
        return bus_l * g, bus_r * g

    ml, mr = sidechain(music.l, music.r)

    # reverb: synthetic stereo IR (decaying filtered noise)
    ir_n = int(1.8 * SR)
    t = np.arange(ir_n) / SR
    irl = lp(rng.standard_normal(ir_n), 6000) * np.exp(-t / 0.45)
    irr = lp(rng.standard_normal(ir_n), 6000) * np.exp(-t / 0.45)
    irl[: int(0.012 * SR)] = 0
    irr[: int(0.017 * SR)] = 0
    irl /= np.sqrt(np.sum(irl ** 2)); irr /= np.sqrt(np.sum(irr ** 2))
    wet_l = fftconvolve(sfx.l, irl)[: len(sfx.l)]
    wet_r = fftconvolve(sfx.r, irr)[: len(sfx.r)]
    pad_wet_l = fftconvolve(ml, irl)[: len(ml)]
    pad_wet_r = fftconvolve(mr, irr)[: len(mr)]

    L = drums.l * 1.0 + ml * 0.9 + sfx.l * 0.95 + wet_l * 0.22 + pad_wet_l * 0.12
    R = drums.r * 1.0 + mr * 0.9 + sfx.r * 0.95 + wet_r * 0.22 + pad_wet_r * 0.12
    L, R = L[:N], R[:N]
    # gentle fade at the very end so the loop cut is clean
    fade = int(0.25 * SR)
    L[-fade:] *= np.linspace(1, 0, fade); R[-fade:] *= np.linspace(1, 0, fade)
    # peak-normalise only; loudness (-14 LUFS) + true-peak limiting happen in ffmpeg
    peak = max(np.max(np.abs(L)), np.max(np.abs(R)))
    out = np.stack([L, R], axis=1) / peak * 0.89

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    pcm = (out * 32767).astype(np.int16)
    import wave
    with wave.open(out_path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print(out_path, out.shape[0] / SR, "s")

"""Find, fetch and measure a real music track for the film (royalty-free, from Mixkit).

Claude can't listen, so the choice is made from data: tempo, where the drop is, and a
spectrogram sheet it reads as an image. Always shortlist, and keep 2 alternates.

    python3 scripts/music.py search hip-hop trap edm cinematic   # list tracks (id | name | genre | artist | length)
    python3 scripts/music.py fetch 318 470 140                    # -> audio-src/m<id>.mp3
    python3 scripts/music.py analyze 318 470 140                  # tempo + drops + audio-src/analysis.png
    python3 scripts/music.py grid 318 --drop 20.2                 # exact beat, downbeat, and the film's numbers

Licence: Mixkit Stock Music Free License (free for commercial and personal projects, no
attribution, don't redistribute the track on its own). Re-read https://mixkit.co/license/
before a paid campaign, and record the track in docs/CREDITS.md.
"""
import json, os, re, subprocess, sys
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "audio-src")
SR = 22050


def get(url):
    # curl, not urllib: python.org builds on macOS often ship without root certificates
    return subprocess.run(["curl", "-sfL", "-A", "Mozilla/5.0", url], capture_output=True, check=True).stdout


def search(tags):
    """Mixkit tag pages (/free-stock-music/tag/<t>/) and genre pages (/free-stock-music/<t>/) carry JSON-LD."""
    seen = {}
    for t in tags:
        for url in (f"https://mixkit.co/free-stock-music/tag/{t}/", f"https://mixkit.co/free-stock-music/{t}/"):
            try:
                h = get(url).decode("utf-8", "ignore")
            except Exception:
                continue
            for m in re.finditer(r'\{"@id":"[^"]*","@type":"MusicRecording".*?"datePublished":"[^"]*"\}', h):
                d = json.loads(m.group(0))
                i = d["url"].split("/")[-2]
                seen.setdefault(i, {**d, "tags": set()})["tags"].add(t)
    os.makedirs(SRC, exist_ok=True)
    out = {i: {k: (sorted(v) if isinstance(v, set) else v) for k, v in d.items()} for i, d in seen.items()}
    json.dump(out, open(os.path.join(SRC, "catalog.json"), "w"), indent=1)
    for i, d in sorted(out.items(), key=lambda x: x[1]["genre"]):
        print(f"{i:>5} | {d['name']} | {d['genre']} | {d['byArtist']} | {d['duration']} | {','.join(d['tags'])}")


def fetch(ids):
    os.makedirs(SRC, exist_ok=True)
    for i in ids:
        p = os.path.join(SRC, f"m{i}.mp3")
        if not os.path.exists(p):
            open(p, "wb").write(get(f"https://assets.mixkit.co/music/{i}/{i}.mp3"))
        print(p)


def load(path, sr=SR):
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", path, "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def path_of(a):
    return a if os.path.exists(a) else os.path.join(SRC, f"m{a}.mp3")


def tempo(x, a=20, b=60):
    from scipy.signal import stft
    hop = 256
    _, _, Z = stft(x[int(a * SR):int(b * SR)], SR, nperseg=1024, noverlap=1024 - hop)
    S = np.log1p(np.abs(Z) * 100)
    fl = np.maximum(0, np.diff(S, axis=1)).sum(0)
    fl -= fl.mean()
    fps = SR / hop
    ac = np.correlate(fl, fl, "full")[len(fl) - 1:]
    lags = np.arange(1, len(ac))
    bpm = 60 * fps / lags
    m = (bpm >= 85) & (bpm < 175)
    return float(bpm[m][np.argmax(ac[1:][m])])


def drops(x, top=3):
    """biggest jumps in the low end (30–120 Hz): mean of the next 2 s vs the previous 2 s"""
    from scipy.signal import butter, sosfilt
    lo = sosfilt(butter(4, [30, 120], btype="band", fs=SR, output="sos"), x)
    e = np.array([np.sqrt(np.mean(lo[k * SR // 2:(k + 1) * SR // 2] ** 2)) for k in range(int(len(x) / SR * 2))])
    e /= e.max() + 1e-9
    j = sorted(((e[k:k + 4].mean() - e[k - 4:k].mean(), k / 2) for k in range(4, min(len(e) - 4, 160))), reverse=True)
    picked = []
    for v, s in j:
        if all(abs(s - p) > 3 for p, _ in picked):
            picked.append((float(s), round(float(v), 2)))
        if len(picked) == top:
            break
    return picked


def analyze(ids):
    from PIL import Image, ImageDraw
    sheets = []
    for a in ids:
        p = path_of(a)
        x = load(p)
        print(f"{os.path.basename(p):12s} {len(x)/SR:6.1f}s  ~{tempo(x):5.1f} bpm  drops (s, strength): {drops(x)}")
        png = os.path.join(SRC, f"spec-{os.path.basename(p)}.png")
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-t", "60", "-i", p, "-lavfi", "showspectrumpic=s=1500x220:legend=1:scale=log:fscale=log", png], check=True)
        sheets.append((os.path.basename(p), Image.open(png)))
    W = max(im.width for _, im in sheets)
    H = sum(im.height + 18 for _, im in sheets)
    out = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(out)
    y = 0
    for name, im in sheets:
        d.text((5, y + 2), name, fill=(255, 255, 0))
        out.paste(im, (0, y + 18))
        y += im.height + 18
    out.save(os.path.join(SRC, "analysis.png"))
    print(os.path.join(SRC, "analysis.png"), "(read it: a drop is where the low band turns solid; a riser is a rising diagonal just before)")


def grid(a, drop):
    """exact beat from the hats (8ths) or snares; the downbeat nearest the drop; the film's numbers"""
    from scipy.signal import butter, sosfilt, find_peaks
    sr = 44100
    x = load(path_of(a), sr)

    def onsets(lo, hi, t0, t1, thr):
        y = sosfilt(butter(4, [lo, hi], btype="band", fs=sr, output="sos"), x[int(t0 * sr):int(t1 * sr)])
        hop = 128
        e = np.sqrt(np.convolve(y ** 2, np.ones(512) / 512, "same"))[::hop]
        dd = np.maximum(0, np.diff(e))
        pk, _ = find_peaks(dd, height=dd.max() * thr, distance=int(sr / hop * 0.12))
        return t0 + pk / (sr / hop)

    hats = onsets(6000, 16000, max(0, drop - 16), drop + 16, 0.35)
    iv = np.diff(hats)
    iv = iv[(iv > 0.12) & (iv < 0.9)]
    eighth = float(np.median(iv)) if len(iv) else 0.0
    phase = float(hats[0]) if len(hats) else 0.0
    if eighth and len(hats) > 8:
        # refine: least-squares fit of every hat onto one grid (far more precise than the median)
        k = np.round((hats - hats[0]) / eighth)
        eighth, phase = (float(v) for v in np.polyfit(k, hats, 1))
    beat = eighth * 2 if eighth < 0.4 else eighth
    kicks = onsets(30, 120, drop - 1, drop + 1, 0.3)
    down = float(kicks[np.argmin(np.abs(kicks - drop))]) if len(kicks) else drop
    if eighth:
        # a kick's detected onset lags its transient: snap it to the hat grid
        down = phase + round((down - phase) / eighth) * eighth
    print(f"beat {beat:.5f} s = {60/beat:.2f} BPM = {beat*60:.3f} frames at 60 fps; bar = {beat*240:.2f} frames")
    print(f"downbeat near the drop: {down:.3f} s (check it against the spectrogram)")
    print("in tokens.ts:  BEAT = %.5f * FPS;  DROP = <the frame the drop lands on>;  MUSIC.start = %.3f - DROP / FPS" % (beat, down))


if __name__ == "__main__":
    cmd, *rest = sys.argv[1:] or ["help"]
    if cmd == "search":
        search(rest)
    elif cmd == "fetch":
        fetch(rest)
    elif cmd == "analyze":
        analyze(rest)
    elif cmd == "grid":
        a = rest[0]
        d = float(rest[rest.index("--drop") + 1]) if "--drop" in rest else 20.0
        grid(a, d)
    else:
        print(__doc__)

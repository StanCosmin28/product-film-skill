"""Fetch a curated pack of real sound effects (Mixkit, Sound Effects Free License) and
measure each one, so scripts/mix.py can land its PEAK on a frame.

    python3 scripts/sfx_pack.py            # -> audio-src/sfx/s<id>.wav + audio-src/sfx/meta.json
    python3 scripts/sfx_pack.py 2900 1287  # add more ids (find them on mixkit.co/free-sound-effects/<category>/)

meta.json: onset (first audible), peak (the transient or the end of a rise) and tail, in seconds.
"""
import json, os, subprocess, sys
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIR = os.path.join(ROOT, "audio-src", "sfx")

# id: role. Every one of these was used in a shipped film.
PACK = {
    "166": "fast small sweep: a word rising, a strike",
    "175": "short transition sweep: a camera step",
    "169": "futuristic sweep pass-by: a step back",
    "1486": "cinematic tunnel woosh: a pull-back",
    "1492": "cinematic whoosh, rises into a cut: swipes, a collapse",
    "1493": "swirling whoosh, rises to a point: an implode",
    "2608": "air zoom vacuum: suck into a point",
    "3114": "fast sci-fi sweep: a lift between scenes",
    "3120": "technology transition slide: a carousel turn",
    "2618": "UI zoom in: a dive",
    "2568": "cool interface click: UI settling, a button",
    "2573": "interface option select: a layer lights up",
    "2577": "interface device click: a card flips",
    "3124": "modern technology select: a tiny tick",
    "2520": "high-tech confirmation: success, a landing",
    "2521": "high-tech bleep: a birth",
    "2537": "laptop typing sequence: code types in (trim ~0.7 s)",
    "2908": "trailer impact, short rise: a downbeat hit",
    "788": "big cinematic impact, rises ~1.4 s: the logo",
    "790": "cinematic trailer riser: into the logo",
    "2903": "whoosh impact: a scene landing",
}


def get(url):
    # curl, not urllib: python.org builds on macOS often ship without root certificates
    return subprocess.run(["curl", "-sfL", "-A", "Mozilla/5.0", url], capture_output=True, check=True).stdout


def measure(path):
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", path, "-ac", "1", "-ar", "48000", "-f", "f32le", "-"], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.float32)
    env = np.sqrt(np.convolve(x.astype(np.float64) ** 2, np.ones(480) / 480, "same"))
    m = env.max() + 1e-12
    return {
        "onset": round(int(np.argmax(env > 0.1 * m)) / 48000, 3),
        "peak": round(int(np.argmax(env)) / 48000, 3),
        "tail": round((len(env) - int(np.argmax(env[::-1] > 0.02 * m))) / 48000, 2),
    }


if __name__ == "__main__":
    os.makedirs(DIR, exist_ok=True)
    ids = list(PACK) + sys.argv[1:]
    meta_path = os.path.join(DIR, "meta.json")
    meta = json.load(open(meta_path)) if os.path.exists(meta_path) else {}
    for i in ids:
        name = None
        for ext, url in ((".wav", f"https://assets.mixkit.co/active_storage/sfx/{i}/{i}.wav"), (".mp3", f"https://assets.mixkit.co/active_storage/sfx/{i}/{i}-preview.mp3")):
            p = os.path.join(DIR, f"s{i}{ext}")
            if os.path.exists(p):
                name = p
                break
            try:
                data = get(url)  # fetch first: a failed download must not leave an empty file behind
                open(p, "wb").write(data)
                name = p
                break
            except Exception:
                continue
        if not name:
            print("could not fetch", i)
            continue
        meta[os.path.basename(name)] = {**measure(name), "role": PACK.get(i, "")}
        print(f"{os.path.basename(name):12s} {meta[os.path.basename(name)]}")
    json.dump(meta, open(meta_path, "w"), indent=1)
    print(meta_path)

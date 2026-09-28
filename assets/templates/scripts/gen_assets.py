"""Generate the film's texture assets in public/film/:
  grain-0..3.png  static film-grain tiles (one per whole frame, overlay blend)
  glow.png        a DITHERED radial glow in the brand accent. CSS radial gradients
                  band visibly on near-black in 8-bit video; dithering removes it.
    python3 scripts/gen_assets.py "#00c4ab"
"""
import os, sys
import numpy as np
from PIL import Image

accent = (sys.argv[1] if len(sys.argv) > 1 else "#00c4ab").lstrip("#")
r, g, b = (int(accent[i:i + 2], 16) for i in (0, 2, 4))
os.makedirs("public/film", exist_ok=True)
rng = np.random.default_rng(7)
for i in range(4):
    a = rng.normal(128, 42, (320, 320)).clip(0, 255).astype("uint8")
    Image.fromarray(a, "L").save(f"public/film/grain-{i}.png")
S = 1280
y, x = np.mgrid[0:S, 0:S]
t = np.sqrt((x - S / 2 + 0.5) ** 2 + (y - S / 2 + 0.5) ** 2) / (S / 2)
alpha = np.clip(1 - t, 0, 1) ** 1.5 * 0.2
a8 = np.clip(np.floor(alpha * 255 + rng.random((S, S))), 0, 255).astype(np.uint8)
a8[t >= 1] = 0
img = np.zeros((S, S, 4), np.uint8)
img[..., 0], img[..., 1], img[..., 2], img[..., 3] = r, g, b, a8
Image.fromarray(img, "RGBA").save("public/film/glow.png", optimize=True)
print("public/film: grain-0..3.png, glow.png (accent #%s)" % accent)

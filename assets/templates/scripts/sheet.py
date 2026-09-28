# Contact sheet: python3 scripts/sheet.py <frames dir> <out.png> <step> <start> <cols> <thumb width>
import sys, glob
from PIL import Image, ImageDraw
files = sorted(glob.glob(sys.argv[1] + '/f*.png'))
step = int(sys.argv[3]) if len(sys.argv) > 3 else 15
start = int(sys.argv[4]) if len(sys.argv) > 4 else 0
cols = int(sys.argv[5]) if len(sys.argv) > 5 else 9
w = int(sys.argv[6]) if len(sys.argv) > 6 else 216
ims = [Image.open(f) for f in files]
h = int(ims[0].height * w / ims[0].width)
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * w, rows * (h + 22)), (40, 40, 40))
d = ImageDraw.Draw(sheet)
for i, im in enumerate(ims):
    x = (i % cols) * w; y = (i // cols) * (h + 22)
    sheet.paste(im.resize((w, h)), (x, y + 22))
    d.text((x + 4, y + 4), f"f{start + i * step}", fill=(255, 230, 0))
sheet.save(sys.argv[2])
print(sheet.size)

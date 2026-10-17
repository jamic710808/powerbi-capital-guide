#!/usr/bin/env python3
"""把 preview/dev/<前綴>_*.png 依時間排序，拼成帶標籤的接觸表。用法：python tools/sheet.py s04 [欄數=3]"""
import glob, re, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
ROOT = Path(__file__).resolve().parent.parent
pre = sys.argv[1]; cols = int(sys.argv[2]) if len(sys.argv) > 2 else 3
files = sorted(glob.glob(str(ROOT / 'preview' / 'dev' / f'{pre}_*.png')), key=lambda f: float(re.search(r'_([\d.]+)\.png', f).group(1)))
W, H = 800, 450
rows = (len(files) + cols - 1) // cols
sh = Image.new('RGB', (W * cols, H * rows), (0, 0, 0))
try: font = ImageFont.truetype('C:/Windows/Fonts/msjh.ttc', 22)
except Exception: font = ImageFont.load_default()
for i, f in enumerate(files):
    im = Image.open(f).convert('RGB').resize((W, H), Image.LANCZOS); d = ImageDraw.Draw(im)
    t = re.search(r'_([\d.]+)\.png', f).group(1); d.rectangle([0, 0, 120, 30], fill=(0, 0, 0)); d.text((6, 3), f'{pre} {t}s', fill=(255, 255, 0), font=font)
    sh.paste(im, ((i % cols) * W, (i // cols) * H))
out = ROOT / 'preview' / f'sheet_{pre}.jpg'; sh.save(out, quality=88); print(out, len(files))

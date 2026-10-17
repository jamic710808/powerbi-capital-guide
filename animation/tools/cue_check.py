#!/usr/bin/env python3
"""比較「字數比例推算的子句邊界」與「音檔實際靜音位置」，評估畫面對時誤差。
用法：python tools/cue_check.py [scene-id]"""
import json, re, subprocess, sys
from pathlib import Path
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
ROOT = Path(__file__).resolve().parent.parent
t = json.loads((ROOT / 'timeline.json').read_text(encoding='utf-8'))
want = sys.argv[1] if len(sys.argv) > 1 else None
for s in t['scenes']:
    if want and want != s['id']: continue
    text = re.sub(r'\s+', '', s['narration']); n = len(text); vs = s['voiceFrames'] / t['fps']
    bounds = [(m.end(), text[:m.end()][-6:]) for m in re.finditer(r'[，。！？；：、]', text)]
    pred = [(round(vs * i / n, 2), tail) for i, tail in bounds[:-1]]
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(ROOT / s['voice']), '-af', 'silencedetect=noise=-38dB:d=0.10', '-f', 'null', '-'],
                       capture_output=True, text=True)
    st = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', r.stderr)]
    en = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', r.stderr)]
    sil = [(round(a, 2), round(b, 2)) for a, b in zip(st, en)]
    print(f"\n{s['id']}  voice={vs:.2f}s  子句邊界 {len(pred)}  偵測到靜音 {len(sil)}")
    print('  推算邊界（秒）:', [p[0] for p in pred])
    print('  實際靜音區間 :', sil)

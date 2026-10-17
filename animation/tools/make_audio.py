#!/usr/bin/env python3
"""《有個口袋在冒汗》程式合成配樂（暖色 marimba／pizzicato／pad，旁白時自動閃避）與對時音效 → audio/music.wav、audio/sfx.wav。
合成器沿用前作《錢，怎麼還沒回家？》驗證過的做法；和弦進行、速度與全部音效時間點為本片重寫。
需先 `pipeline.py timeline . --lock`（讀 timeline.json 的旁白起訖）。全部為原創合成，無版權問題。
音效時間用「旁白片段 → 字數比例」推算，與 scenes 內的 K.cue 同一公式。"""
import json, re, sys, wave
from pathlib import Path
import numpy as np

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
ROOT = Path(__file__).resolve().parent.parent
SR = 48000
TL = json.loads((ROOT / 'timeline.json').read_text(encoding='utf-8'))
FPS = TL['fps']; TOTAL = TL['durationSeconds']; N = int((TOTAL - 0.05) * SR)
SC = {s['id']: s for s in TL['scenes']}
rng = np.random.default_rng(20261017)

def cue(sid, frag, nth=0, off=0.0):
    s = SC[sid]; text = re.sub(r'\s+', '', s['narration']); f = re.sub(r'\s+', '', frag); idx = -1
    for _ in range(nth + 1):
        idx = text.find(f, idx + 1)
        if idx < 0: raise ValueError(f'{sid}: 找不到片段 {frag}')
    lead = (s['voiceStartFrame'] - s['startFrame']) / FPS; vs = s['voiceFrames'] / FPS
    return s['startFrame'] / FPS + lead + vs * idx / len(text) + off

def read_wav(p):
    w = wave.open(str(p)); a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    ch = w.getnchannels(); sr = w.getframerate(); assert sr == SR, (p, sr)
    return a.reshape(-1, ch).mean(1)

# ---------- 旁白包絡（閃避用）與音量基準 ----------
voice = np.zeros(N, np.float32)
for s in TL['scenes']:
    if not s.get('voice'): continue
    a = read_wav(ROOT / s['voice']); i = int(s['voiceStartFrame'] / FPS * SR); seg = a[:max(0, N - i)]; voice[i:i + len(seg)] += seg
act = np.abs(voice) > 0.01
vrms = float(np.sqrt(np.mean(voice[act] ** 2))) if act.any() else .07
k = int(.12 * SR); env = np.convolve(np.abs(voice), np.ones(k) / k, mode='same'); env = np.clip(env * 14, 0, 1)
# 起音快、釋放慢
duck = np.zeros(N, np.float32); cur = 0.0; a_att = 1 - np.exp(-1 / (.05 * SR)); a_rel = 1 - np.exp(-1 / (.45 * SR))
for i in range(0, N, 24):
    tgt = env[i:i + 24].max(); cur += (tgt - cur) * (a_att if tgt > cur else a_rel); duck[i:i + 24] = cur
print(f'旁白 RMS={vrms:.3f}（{20*np.log10(vrms):.1f} dBFS）')

def midi(n): return 440.0 * 2 ** ((n - 69) / 12)
def add(buf, start, sig, gain=1.0):
    i = int(start * SR)
    if i >= len(buf) or i < 0 and -i >= len(sig): return
    if i < 0: sig = sig[-i:]; i = 0
    e = min(len(buf), i + len(sig)); buf[i:e] += sig[:e - i] * gain

# ---------- 配樂 ----------
BPM = 108; BEAT = 60 / BPM; BAR = 4 * BEAT
CH = {'C': [48, 55, 60, 64, 67], 'Am': [45, 52, 57, 60, 64], 'F': [41, 48, 53, 57, 60], 'G': [43, 50, 55, 59, 62], 'Dm': [50, 57, 62, 65, 69], 'Em': [52, 59, 64, 67, 71]}
PROG = {'s00-title': ['C', 'G', 'Am', 'F'], 's01-call': ['Am', 'F', 'C', 'G'], 's02-pockets': ['C', 'G', 'Am', 'F'], 's03-safety': ['Dm', 'G', 'C', 'Am'],
        's04-flows': ['C', 'Am', 'F', 'G'], 's05-timeline': ['F', 'G', 'C', 'Am'], 's06-borrow': ['Am', 'F', 'C', 'G'], 's07-pool': ['C', 'Em', 'F', 'G'],
        's08-fx': ['Dm', 'G', 'Em', 'Am'], 's09-evening': ['F', 'G', 'Am', 'C']}
DENS = {'s00-title': .5, 's01-call': .35, 's02-pockets': .6, 's03-safety': .7, 's04-flows': .65, 's05-timeline': .7, 's06-borrow': .7, 's07-pool': .75, 's08-fx': .7, 's09-evening': .5}
PENT = [0, 2, 4, 7, 9]

def pluck(f, dur=.9, bright=1.0, sub=0.0):
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) + .35 * bright * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 9) + .12 * bright * np.sin(2 * np.pi * f * 4.1 * t) * np.exp(-t * 18) + sub * np.sin(2 * np.pi * f * .5 * t)
    return s * np.exp(-t * 4.2) * np.minimum(1, t * 900)

def pad(chord, dur):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for m in chord[:4]:
        f = midi(m); s += np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * f * 1.003 * t + 1.1) + .15 * np.sin(2 * np.pi * f * 2 * t)
    return s * np.minimum(t / .8, 1) * np.minimum((dur - t) / .8, 1) / 6

music = np.zeros(N, np.float32)
bars = int(TOTAL / BAR) + 2
scene_of = lambda t: next((s for s in TL['scenes'] if s['startFrame'] / FPS <= t < s['endFrame'] / FPS), TL['scenes'][-1])
mel_state = 2
for b in range(bars):
    t0 = b * BAR; sc = scene_of(t0); prog = PROG[sc['id']]; name = prog[(b) % 4]; chord = CH[name]; dens = DENS[sc['id']]
    add(music, t0, pad(chord, BAR + .6), .55)
    # 低音撥弦：第 1、3 拍
    for beat in (0, 2):
        add(music, t0 + beat * BEAT, pluck(midi(chord[0]), .7, .2, .5), .9)
    # 八分音符琶音（marimba 感）
    steps = [0, 2, 3, 4, 3, 2, 1, 2]
    for j in range(8):
        if rng.random() > dens + .15: continue
        m = chord[1 + steps[j] % 4] + 12
        add(music, t0 + j * BEAT / 2, pluck(midi(m), .8, 1.0), .34 + .08 * (j % 2 == 0))
    # 旋律：五聲音階隨機漫步，稀疏
    for beat in range(4):
        if rng.random() < dens * .55:
            mel_state = int(np.clip(mel_state + rng.integers(-2, 3), 0, 9)); deg = PENT[mel_state % 5] + 12 * (mel_state // 5)
            add(music, t0 + beat * BEAT + (BEAT / 2 if rng.random() < .3 else 0), pluck(midi(72 + deg), 1.0, 1.4), .42)
    # 搖鈴（中段較有律動）
    if sc['id'] in ('s03-safety', 's04-flows', 's05-timeline', 's07-pool', 's08-fx'):
        for j in range(8):
            n = int(.05 * SR); sh = rng.standard_normal(n) * np.exp(-np.arange(n) / SR * 70); sh = np.diff(sh, prepend=0)
            add(music, t0 + j * BEAT / 2 + BEAT / 4, sh, .05)
# 片尾收束：最後和弦長音，結尾淡出
end_t = TOTAL - 4.2
add(music, end_t, pad([48, 55, 60, 64, 71], 4.1), .8); add(music, end_t, pluck(midi(72), 3.5, 1.2), .5); add(music, end_t + .15, pluck(midi(76), 3.2, 1.2), .4); add(music, end_t + .3, pluck(midi(79), 3.0, 1.2), .35)
music *= np.minimum(1, np.arange(N) / SR / 1.5) * np.minimum(1, (N - np.arange(N)) / SR / 2.5)
# 基準：未閃避時 RMS ≈ 旁白的 0.55；旁白時壓到約 0.22
m_act = music[np.abs(music) > 1e-4]; music *= (vrms * .55) / (np.sqrt(np.mean(m_act ** 2)) + 1e-9)
music *= (1 - .62 * duck)

# ---------- 音效 ----------
def env_dec(n, k): return np.exp(-np.arange(n) / SR * k)
def sfx_pop(f=520, dur=.14):
    n = int(dur * SR); t = np.arange(n) / SR; fr = f * (1 + 1.2 * np.minimum(1, t / dur)); return np.sin(2 * np.pi * np.cumsum(fr) / SR) * env_dec(n, 28)
def sfx_tick(f=1800): n = int(.03 * SR); return np.sin(2 * np.pi * f * np.arange(n) / SR) * env_dec(n, 120)
def sfx_ding(f=880, dur=1.0):
    n = int(dur * SR); t = np.arange(n) / SR; return (np.sin(2 * np.pi * f * t) + .4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6)) * env_dec(n, 4.5) * np.minimum(1, t * 800)
def sfx_clink(f=2600): n = int(.28 * SR); t = np.arange(n) / SR; return (np.sin(2 * np.pi * f * t) + .6 * np.sin(2 * np.pi * f * 1.5 * t)) * env_dec(n, 22) * np.minimum(1, t * 1500)
def sfx_thunk(f=130, dur=.22):
    n = int(dur * SR); t = np.arange(n) / SR; ns = rng.standard_normal(n); ns = np.convolve(ns, np.ones(40) / 40, 'same'); return (np.sin(2 * np.pi * f * t * (1 - .3 * t / dur)) * 1.0 + .5 * ns) * env_dec(n, 18)
def sfx_whoosh(dur=.6, f0=300, f1=2400):
    n = int(dur * SR); ns = rng.standard_normal(n); out = np.zeros(n); y = 0.0; t = np.arange(n) / n
    for i in range(n): c = 2 * np.pi * (f0 + (f1 - f0) * np.sin(np.pi * t[i]) ** 2) / SR; y += min(.9, c) * (ns[i] - y); out[i] = y
    return out * np.sin(np.pi * t) ** 2 * 2.2
def sfx_noise(dur=.1, lp=3000, k=40):
    n = int(dur * SR); ns = rng.standard_normal(n); ns = np.convolve(ns, np.ones(max(1, SR // lp)) / max(1, SR // lp), 'same'); return ns * env_dec(n, k)
def sfx_knock():
    out = sfx_thunk(190, .14) * 1.1; x = sfx_noise(.05, 4000, 90) * .4; out[:len(x)] += x; return out
def sfx_spark(base=1320):
    out = np.zeros(int(1.0 * SR))
    for j, r in enumerate([1, 1.26, 1.5, 2]):
        x = sfx_ding(base * r, .5)[:int(.5 * SR)]; i = int(j * .07 * SR); out[i:i + len(x)] += x[:len(out) - i]
    return out
def sfx_splash(): return sfx_noise(.9, 2500, 3.5) * np.minimum(1, np.arange(int(.9 * SR)) / SR * 6)
def sfx_alarm(): n = int(.16 * SR); t = np.arange(n) / SR; return np.sign(np.sin(2 * np.pi * 880 * t)) * .5 * env_dec(n, 14)
def sfx_chord(root=60):
    out = np.zeros(int(2.4 * SR))
    for j, iv in enumerate([0, 4, 7, 12, 16]):
        x = sfx_ding(midi(root + iv), 2.2); i = int(j * .04 * SR); out[i:i + len(x)] += x[:len(out) - i]
    return out


def sfx_buzz():
    n = int(.34 * SR); t = np.arange(n) / SR
    return np.sign(np.sin(2 * np.pi * 150 * t)) * (np.sin(2 * np.pi * 22 * t) ** 2) * env_dec(n, 3) * .5

EV = []  # (time, signal, gain)
def ev(t, sig, g=1.0): EV.append((t, sig, g))
def S0(sid): return SC[sid]['startFrame'] / FPS
def VEND(sid): return S0(sid) + (SC[sid]['voiceStartFrame'] - SC[sid]['startFrame']) / FPS + SC[sid]['voiceFrames'] / FPS
def STN(sid, frag): ev(cue(sid, frag, 0, -.3) + .3, sfx_pop(500), .9)         # 站牌滑入

# ---- s00 片頭 ----
S = 's00-title'
for i in range(6): ev(S0(S) + .1 + i * .08 + .15, sfx_pop(480 + 50 * i), .6)
ev(S0(S) + .5, sfx_spark(1320), .7); ev(S0(S) + .45, sfx_whoosh(.5, 300, 1800), .5)
# ---- s01 一通電話 ----
S = 's01-call'
for k in range(3): ev(S0(S) + .3 + k * .42, sfx_buzz(), .7)
ev(cue(S, '老闆問', 0, .1), sfx_pop(560), .9); ev(cue(S, '看了一眼', 0, -.1), sfx_whoosh(.4, 300, 1400), .4)
for i, f in enumerate((784, 988, 1175, 1568)): ev(cue(S, '約四點三億元', 0, -.25) + i * .5 + .15, sfx_ding(f, 1.0), .7)
ev(cue(S, '那就好', 0, -.05), sfx_pop(620), .9); ev(cue(S, '小衡補一句', 0, .05), sfx_pop(700), .8)
tf = cue(S, '十月十五日', 0, -.15); ev(tf, sfx_whoosh(.5, 300, 1500), .6); ev(tf + .55, sfx_thunk(120, .22), 1.0)
tq = cue(S, '安靜了', 0, -.1)
for i in range(3): ev(tq + .2 + i * .45, sfx_tick(900 - 60 * i), .7)
ev(tq + 1.6, sfx_thunk(80, .35), .6)
# ---- s02 六個口袋 ----
S = 's02-pockets'
for i, n in enumerate(('總部', '華東', '華南', '華北', '跨境運營', '香港貿易')): ev(cue(S, n, 0, -.15) + .15, sfx_pop(520 + 45 * i), .9)
ev(cue(S, '錢不是一鍋粥', 0, -.15) + .1, sfx_pop(420), .8); ts = cue(S, '是六個口袋', 0, -.1)
ev(ts, sfx_whoosh(.4, 300, 1500), .5); ev(ts + .25, sfx_thunk(130, .2), 1.0)
for i in range(6): ev(ts + .05 + i * .1 + .72, sfx_clink(2300 + 110 * i), .6)
ev(cue(S, '各有各的脾氣', 0, -.1), sfx_pop(700), .7)
# ---- s03 第一站 ----
S = 's03-safety'
STN(S, '第一頁'); ev(cue(S, '一句話判斷', 0, -.1), sfx_whoosh(.5, 300, 1600), .6)
ev(cue(S, '最低也有', 0, -.1), sfx_whoosh(.9, 250, 1500), .45); ev(cue(S, '二十九點六倍', 0, -.2), sfx_ding(988, 1.1), .9); ev(cue(S, '二十九點六倍', 0, -.2) + .05, sfx_spark(1480), .35)
ev(cue(S, '可是按法人', 0, -.2), sfx_whoosh(.6, 300, 1700), .6); ev(cue(S, '香港貿易的人民幣口袋', 0, -.1), sfx_pop(430), .9)
tc = cue(S, '十月十五日', 0, -.1); ev(tc + .1, sfx_thunk(120, .2), 1.0)
for i in range(3): ev(tc + .2 + i * .35, sfx_clink(1500 - 120 * i), .35)
tg = cue(S, '缺口最大', 0, -.1); ev(tg, sfx_whoosh(1.2, 200, 900), .45)
for j in range(2): ev(tg + 1.5 + j * .25, sfx_alarm(), .45)
ev(cue(S, '整座水庫', 0, -.25), sfx_splash(), .55); tk = cue(S, '在咳嗽', 0, -.1)
ev(tk, sfx_noise(.14, 900, 30), .9); ev(tk + .55, sfx_noise(.14, 900, 30), .9)
ev(cue(S, '原因是合同回款', 0, -.2), sfx_whoosh(.5, 300, 1500), .5); ev(cue(S, '百分之十三點六', 0, -.1), sfx_ding(784, 1.0), .9)
# ---- s04 第二站 ----
S = 's04-flows'
STN(S, '第二頁'); ev(cue(S, '淨現金流', 0, -.1), sfx_ding(880, 1.1), .8)
for i in range(3): ev(cue(S, '全靠經營活動', 0, -.15) + i * .35 + .1, sfx_pop(500 + 60 * i), .7)
ev(cue(S, '預算執行率', 0, -.2) + .1, sfx_pop(560), .8); tG = cue(S, '百分之一百一十點五', 0, -.1)
for k in range(18): ev(tG + k * .07, sfx_tick(1400 + 35 * k), .35)
ev(cue(S, '叫超支', 0, -.2) + .2, sfx_thunk(110, .25), 1.1); ev(cue(S, '叫超支', 0, -.2) + .2, sfx_alarm(), .5)
tr = cue(S, '各法人裡', 0, -.2); ev(tr, sfx_whoosh(.5, 300, 1500), .5)
for i in range(6): ev(tr + .15 + i * .12 + .15, sfx_pop(480 + 25 * i), .45)
ev(cue(S, '今天特別忙', 0, -.2) + .1, sfx_pop(700), .8)
# ---- s05 第三站 ----
S = 's05-timeline'
STN(S, '第三頁'); ev(cue(S, '未結應收', 0, -.15) + .1, sfx_pop(520), .9); ev(cue(S, '逾期七十一萬元', 0, -.15) + .15, sfx_thunk(120, .2), 1.0)
ev(cue(S, '像朋友說下週還', 0, -.1), sfx_pop(430), .8); ev(cue(S, '慢了一點點', 0, -.3), sfx_whoosh(.6, 250, 900), .4); ev(cue(S, '慢了一點點', 0, .3), sfx_pop(360), .7)
ev(cue(S, '準時付款', 0, -.1), sfx_spark(1175), .9); ev(cue(S, '準時付款', 0, -.1) + .1, sfx_ding(880, 1.1), .6)
ev(cue(S, '未來三十日', 0, -.2), sfx_whoosh(.5, 300, 1500), .5); ev(cue(S, '未來三十日', 0, 0) + .2, sfx_ding(740, 1.1), .8)
# ---- s06 第四站 ----
S = 's06-borrow'
STN(S, '第四頁'); ev(cue(S, '貸款餘額', 0, -.25) + .15, sfx_ding(660, 1.1), .8); ev(cue(S, '加權年利率', 0, -.1), sfx_pop(560), .8)
ev(cue(S, '另有可提款授信', 0, -.1), sfx_pop(620), .9); ev(cue(S, '另有可提款授信', 0, -.1) + .1, sfx_spark(1320), .5)
tb = cue(S, '但授信只是備用額度', 0, -.1); ev(tb, sfx_whoosh(.5, 250, 900), .4); ev(tb + .58, sfx_thunk(130, .22), 1.2); ev(tb + .68, sfx_pop(900), .5); ev(tb + .7, sfx_pop(400), .7)
ev(cue(S, '像朋友說缺錢跟我說', 0, -.1), sfx_pop(520), .8); tl = cue(S, '房租不能用心意付', 0, -.5); ev(tl, sfx_pop(380), .8)
for j in range(2): ev(tl + .95 + j * .25, sfx_thunk(150, .12), .6)
ev(cue(S, '理財可變現', 0, -.15), sfx_pop(540), .8); ev(cue(S, '理財可變現', 0, -.15) + .3, sfx_ding(330, 1.2), .7)
# ---- s07 第五站 ----
S = 's07-pool'
STN(S, '第五頁'); ev(cue(S, '先別急著借', 0, -.4), sfx_whoosh(.7, 250, 1500), .5)
for i in range(6): ev(cue(S, '先別急著借', 0, -.3) + i * .08 + .15, sfx_pop(480 + 40 * i), .55)
ev(cue(S, '人民幣資金池', 0, -.2) + .1, sfx_ding(784, 1.1), .8); tF = cue(S, '補得上', 0, -.1)
for i in range(5): ev(tF + .1 + i * .2 + 1.1, sfx_clink(2200 + 100 * i), .5)
ev(tF + 2.3, sfx_spark(1175), .8); ev(tF + 2.3, sfx_ding(880, 1.2), .6)
ev(cue(S, '不過這只是候選安排', 0, -.2), sfx_whoosh(.5, 300, 1500), .5); ev(cue(S, '要經過審批', 0, -.1) + .1, sfx_thunk(120, .25), 1.0)
ev(cue(S, '簽核點頭', 0, -.2) + .1, sfx_pop(400), .6)
# ---- s08 第六站 ----
S = 's08-fx'
STN(S, '最後一頁'); tN = cue(S, '對沖前的淨敞口', 0, -.2)
for i in range(3): ev(tN + i * .35 + .2, sfx_pop(430 + 60 * i), .8)
ev(cue(S, '美元最大', 0, -.1) + .1, sfx_pop(700), .8); tF = cue(S, '做了遠期', 0, -.1); ev(tF + .8, sfx_whoosh(.5, 300, 1400), .5); ev(tF + 1.5, sfx_thunk(120, .22), 1.1)
ev(cue(S, '增加到', 0, -.05), sfx_ding(660, 1.0), .8); ev(cue(S, '增加到', 0, -.05) + .15, sfx_alarm(), .35)
ev(cue(S, '就像想減肥', 0, -.2), sfx_pop(520), .8); ev(cue(S, '多點了一份炸雞', 0, -.2) + .1, sfx_pop(760), .9); ev(cue(S, '多點了一份炸雞', 0, -.2) + .12, sfx_spark(1100), .5)
ev(cue(S, '各幣種不利變動', 0, -.2), sfx_whoosh(.9, 200, 1000), .5); ev(cue(S, '影響約負', 0, -.2) + .8, sfx_thunk(100, .3), 1.0)
# ---- s09 傍晚 ----
S = 's09-evening'
for k in range(2): ev(S0(S) + .3 + k * .42, sfx_buzz(), .7)
tB = cue(S, '老闆又打來', 0, -.1); ev(tB + .2, sfx_pop(560), .9)
for i in range(11): ev(tB + .3 + i * .145, sfx_tick(1500 + 20 * (i % 4)), .22)
ev(cue(S, '小衡笑了', 0, -.1), sfx_pop(700), .8)
ev(cue(S, '不是告訴你還剩多少', 0, -.2), sfx_pop(430), .7); ev(cue(S, '而是告訴你', 0, -.1), sfx_whoosh(.45, 300, 1600), .6); ev(cue(S, '而是告訴你', 0, .35), sfx_ding(784, 1.0), .8)
ev(cue(S, '至少這一晚', 0, -.1), sfx_pop(520), .9); td = cue(S, '該去敲哪一扇門', 0, -.15)
ev(td - .1, sfx_pop(430), .6)
for n in range(3): ev(td + .3 + n * .3, sfx_knock(), .8)
ts_ = cue(S, '而那個口袋', 0, -.1); ev(ts_, sfx_pop(480), .7)
for k in range(10): ev(ts_ + .4 + k * .3, sfx_tick(1700), .22)
th = cue(S, '還來得及補回元氣', 0, -.1); ev(th, sfx_spark(1175), .9); ev(th + .1, sfx_ding(880, 1.4), .7)
ev(VEND(S) + .3, sfx_chord(60), .8)

sfx = np.zeros(N, np.float32)
for t, sig, g in EV: add(sfx, t, sig.astype(np.float32), g)
pk = np.abs(sfx).max() + 1e-9; sfx *= (vrms * 3.2 * .22) / pk   # 最大音效峰值約為旁白 RMS 的 1.1 倍
def save(p, mono):
    st = np.stack([mono, mono], 1); st = np.clip(st, -1, 1)
    with wave.open(str(p), 'w') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype('<i2').tobytes())
(ROOT / 'audio').mkdir(exist_ok=True)
save(ROOT / 'audio' / 'music.wav', music); save(ROOT / 'audio' / 'sfx.wav', sfx)
print(f'音效事件 {len(EV)} 個；music.wav / sfx.wav = {N / SR:.2f} s（片長 {TOTAL:.2f} s）')

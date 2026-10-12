# 旁白是否落在時間軸視窗內？（庫存版第 3 輪驗收踩過：24 kHz 旁白直接貼進 44.1 kHz 時間軸，聲音被加快 1.84×、旁白提早結束）
# 做法：每個場景比較「旁白視窗 [A+0.3, A+vo-0.3] 的 RMS」與「旁白結束後到場景尾 [A+vo+0.15, T+D-0.15] 的 RMS」。
# 旁白在視窗內 → 前者應明顯大於後者（後者只剩配樂與音效）；比值 < 1.6 視為異常。
import json,wave,numpy as np,sys
sys.stdout.reconfigure(encoding='utf-8')
TL=json.load(open('timeline.json',encoding='utf-8'))
w=wave.open('mix.wav'); sr=w.getframerate(); ch=w.getnchannels(); n=w.getnframes()
a=np.frombuffer(w.readframes(n),dtype=np.int16).astype(np.float32)/32768
a=a.reshape(-1,ch).mean(1)
print(f'mix.wav: {sr} Hz, {ch} ch, {n/sr:.2f} s（timeline.total={TL["total"]}）')
assert sr==44100
rms=lambda x:float(np.sqrt(np.mean(x**2))) if len(x) else 0.0
bad=0
for s in TL['scenes']:
    t0=s['A']+0.3; t1=s['A']+s['vo']-0.3
    u0=s['A']+s['vo']+0.15; u1=s['T']+s['D']-0.15
    v=rms(a[int(t0*sr):int(t1*sr)]); m=rms(a[int(u0*sr):int(u1*sr)]) if u1-u0>0.3 else None
    ratio=(v/m) if m else float('nan')
    flag='' if (m is None or ratio>=1.6) else '  ⚠ 異常'
    bad+= flag!=''
    print(f"{s['k']:>4}  旁白窗 {t0:7.2f}–{t1:7.2f}s RMS={v:.3f}   結束後 RMS={'--' if m is None else f'{m:.3f}'}   比值={'--' if m is None else f'{ratio:4.1f}'}{flag}")
print('異常場景數：',bad)

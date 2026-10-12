import json,numpy as np,wave,subprocess,sys
SR=44100
TL=json.load(open('timeline.json',encoding='utf-8')); N=int((TL['total']+1)*SR)
def rd(f):
    assert wave.open(f).getframerate()==SR, f+' 取樣率與時間軸不符'
    w=wave.open(f);a=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)/32768;ch=w.getnchannels();return a.reshape(-1,ch).mean(1)
vo=np.zeros(N,np.float32)
for sc in TL['scenes']:
    # 旁白先重新取樣到 44.1k（TTS 是 24k；以前直接貼進 44.1k 時間軸 → 聲音被加快 1.84×）
    a=rd(f"vo44/{sc['k']}.wav"); a=a/ (np.abs(a).max()+1e-6)*0.85; i=int(sc['A']*SR); vo[i:i+len(a)]+=a[:N-i]
# envelope for ducking
env=np.abs(vo); k=int(0.25*SR); cs=np.cumsum(np.pad(env,(k//2,k//2))); env=((cs[k:]-cs[:-k])/k)[:N]; env=np.pad(env,(0,N-len(env))); env=np.clip(env*4,0,1)
# music: pad + pluck, 72bpm
rng=np.random.default_rng(7); t=np.arange(N)/SR; m=np.zeros(N,np.float32)
chords=[[57,60,64,67,71],[53,57,60,64,67],[48,55,60,64,67],[55,59,62,64,69]]  # Am9 Fmaj7(add) Cmaj7 G6
f=lambda n:440*2**((n-69)/12); beat=60/72; bar=4*beat
for bi in range(int(TL['total']/bar)+2):
    ch=chords[bi%4]; t0=bi*bar; i0=int(t0*SR); L=int((bar+0.8)*SR); tt=np.arange(L)/SR
    env_p=np.minimum(tt/0.9,1)*np.minimum((bar+0.8-tt)/0.9,1)
    pad=sum(np.sin(2*np.pi*f(n-12)*tt)+0.4*np.sin(2*np.pi*f(n)*tt*1.002)+0.15*np.sin(2*np.pi*f(n-12)*2*tt) for n in ch[:4])/6
    seg=pad*env_p*0.30; e=min(L,N-i0)
    if e>0: m[i0:i0+e]+=seg[:e]
    arp=[ch[0]+12,ch[2]+12,ch[3]+12,ch[4]+12,ch[3]+12,ch[2]+12,ch[1]+12,ch[2]+12]
    for j,n in enumerate(arp):
        ts=t0+j*beat/2; i1=int(ts*SR); l2=int(1.4*SR); t2=np.arange(l2)/SR
        pl=(np.sin(2*np.pi*f(n)*t2)+0.3*np.sin(2*np.pi*f(n)*2*t2))*np.exp(-t2*3.2)*(1-np.exp(-t2*200))*0.16*(0.8+0.2*((j%2)==0))
        e=min(l2,N-i1)
        if e>0: m[i1:i1+e]+=pl[:e]
m*=np.minimum(t/3,1)*np.minimum((TL['total']-t)/3,1).clip(0,1)
m=m/(np.abs(m).max()+1e-6)*0.5
music=m*(1-0.78*env)*0.36   # 評審：配樂偏大 → 基準降約 3.7 dB、說話時多壓到 -13 dB
# whoosh at scene starts
def whoosh(L=0.7):
    n=int(L*SR); x=rng.standard_normal(n); tt=np.arange(n)/SR
    # sweeping one-pole lowpass (cutoff rises) then highpass
    y=np.zeros(n); a=0
    for i in range(n):
        c=0.02+0.35*np.sin(np.pi*i/n)**2; a+=c*(x[i]-a); y[i]=a
    hp=np.zeros(n); b=0
    for i in range(n):
        b+=0.03*(y[i]-b); hp[i]=y[i]-b
    return hp*np.sin(np.pi*tt/L)**2
W=whoosh(); W=W/np.abs(W).max()*0.11    # 轉場音效再收斂（原先比配樂高 8–10 dB）
sfx=np.zeros(N,np.float32)
for sc in TL['scenes'][1:]:
    i=int((sc['T']-0.05)*SR); sfx[i:i+len(W)]+=W[:N-i]
mix=vo*0.9+music+sfx
mix=np.clip(mix,-1,1)
st=np.stack([mix,mix],1); 
with wave.open('mix_raw.wav','w') as w: w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((st*32767).astype('<i2').tobytes())
with wave.open('music_only.wav','w') as w: w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((np.stack([music,music],1)*32767).astype('<i2').tobytes())

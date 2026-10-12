# narration.json + vo44/*.wav → timeline.json
# 場景長度 D = lead(全頁前導) + 0.5 + 旁白 + 尾巴；場景首尾相接（轉場交叉淡化 0.25 s）
import wave,json
N=json.load(open('narration.json',encoding='utf-8'))
LEAD={'s04':1.4,'s05':1.0,'s06':1.0,'s07':1.0,'s08':1.0,'s09':1.0}   # 內頁先看全頁再推近
TAIL={'s12':0.2}                                                      # 其餘 0.6 s
sc=[];T=0.0
for n in N:
    w=wave.open(f"vo44/{n['k']}.wav"); assert w.getframerate()==44100,n['k']
    vo=w.getnframes()/w.getframerate(); lead=LEAD.get(n['k'],0.0)
    D=round(lead+0.5+vo+TAIL.get(n['k'],0.6),3)
    sc.append({"k":n['k'],"T":round(T,3),"D":D,"vo":round(vo,3),"lead":lead,"A":round(T+0.5+lead,3),"text":n['t']}); T+=D
    print(n['k'],'vo',round(vo,2),'D',D,'T',round(T-D,2))
total=round(T,3)
json.dump({"fps":30,"total":total,"scenes":sc},open('timeline.json','w',encoding='utf-8'),ensure_ascii=False,indent=1)
print('total',total,'s =',round(total/60,2),'min')

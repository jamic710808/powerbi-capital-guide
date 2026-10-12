# template + assets + timeline → 單檔 index.html（圖片以 base64 內嵌，單檔就能開）
# 嵌入 1920 寬（點開放大用）與 960 寬（縮圖用）兩種；影片與海報另放（film.mp4 / poster.jpg），同資料夾即可播放
# 影片章節秒數一律由 film/timeline.json 的場景起點產生（舊作踩過「手填秒數會錯」的坑）
import base64,json,sys
sys.stdout.reconfigure(encoding='utf-8')
t=open('src/explainer.template.html',encoding='utf-8').read()
d={}
for i in range(7):
    for k in (f'p{i}',f'p{i}_s'):
        d[k]='data:image/jpeg;base64,'+base64.b64encode(open(f'assets/{k}.jpg','rb').read()).decode()
assert '/*IMGS*/{}' in t and '/*CH*/[]' in t
t=t.replace('/*IMGS*/{}',json.dumps(d,ensure_ascii=False))
TL=json.load(open('film/timeline.json',encoding='utf-8'))
NAME={'s01':'開場','s02':'首頁','s03':'六個問題','sT':'四個詞','s04':'第1頁 資金安全','s05':'第2頁 收支預算','s06':'第3頁 結算到期',
      's07':'第4頁 融資工具','s08':'第5頁 集團調配','s09':'第6頁 跨境匯率','s10':'度量值','s11':'星狀模型','s12':'結語'}
CH=[[NAME[s['k']],round(s['T'],1)] for s in TL['scenes']]
t=t.replace('/*CH*/[]',json.dumps(CH,ensure_ascii=False))
out=sys.argv[1] if len(sys.argv)>1 else 'explainer.html'
open(out,'w',encoding='utf-8').write(t)
print(round(len(t.encode('utf-8'))/1e6,2),'MB ->',out)
print('chapters:',CH)

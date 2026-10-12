# 只重生缺檔的場景（刪掉 audio/<k>.wav 即可重做）；python gen_tts.py [k1 k2 ...] 強制重做指定場景
import json,subprocess,os,sys
from concurrent.futures import ThreadPoolExecutor
sys.stdout.reconfigure(encoding='utf-8')
S=json.load(open('narration.json',encoding='utf-8'))
force=set(sys.argv[1:])
def one(s):
    out=f"audio/{s['k']}.wav"
    if s['k'] in force and os.path.exists(out): os.remove(out)
    if os.path.exists(out) and os.path.getsize(out)>10000: return s['k'],'cached'
    for i in range(3):
        r=subprocess.run([sys.executable,'K:/antigravity/scripts/gemini_tts.py',s['t'],'-v','Kore','-o',out],capture_output=True,text=True,encoding='utf-8',env={**os.environ,'PYTHONIOENCODING':'utf8'})
        if os.path.exists(out) and os.path.getsize(out)>10000: return s['k'],'ok'
    return s['k'],'FAIL '+r.stderr[-200:]
with ThreadPoolExecutor(3) as ex:
    for k,st in ex.map(one,S): print(k,st)

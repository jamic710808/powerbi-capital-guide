# 與 stage.html 的 clausesOf() 相同的切句規則：在「，。？：；」之後切開
# 用途：寫鏡頭／聚光框時，要用「句序號」對時，先印出來看
import json,re,sys
sys.stdout.reconfigure(encoding='utf-8')
N=json.load(open('narration.json',encoding='utf-8'))
for n in N:
    parts=[s.strip() for s in re.split(r'(?<=[，。？：；])',re.sub(r'\s+',' ',n['t'])) if s.strip()]
    print(n['k'],'|',' / '.join(f"{i}:{re.sub('[，。？：；]$','',p)}" for i,p in enumerate(parts)))
    print('   字數',sum(len(p) for p in parts),'句數',len(parts))

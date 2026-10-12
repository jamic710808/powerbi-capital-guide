# shots/*.png（線上 Power BI 原生 3840×2160）→ assets/ 三種尺寸（_hi 3840／中 1920／_s 960）
# 與庫存版的差異：不裁邊（shoot.js 已用 displayArea 精準裁好）、不打馬賽克（本報表沒有品牌圖標）
# 注意：報表側欄標題本身是簡體「集团资金分析报告」（圖片原貌，不修改）；見互動頁「觀察」
import glob,os,sys
from PIL import Image
sys.stdout.reconfigure(encoding='utf-8')
os.makedirs('assets',exist_ok=True)
files=sorted(glob.glob('shots/*.png'))
assert len(files)==7,f'應有 7 頁，實際 {len(files)}'
for i,f in enumerate(files):
    im=Image.open(f).convert('RGB')
    assert im.size==(3840,2160),(f,im.size)
    for suf,size,q in (("_hi",(3840,2160),90),("",(1920,1080),88),("_s",(960,540),82)):
        im.resize(size,Image.LANCZOS).save(f"assets/p{i}{suf}.jpg",quality=q)
    print(i,os.path.basename(f),'ok')

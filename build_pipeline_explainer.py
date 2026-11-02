# 全流程零基礎解說頁：src/pipeline_explainer.template.html + 真實截圖／動畫畫面（base64）→ 單檔 HTML
# 用法：python build_pipeline_explainer.py 專案全流程_零基礎互動解說.html
# 圖片來源：capital/assets/p0_s..p6_s（報告 7 頁）、capital-animation/preview/frame-*.png（動畫畫面）、capital/poster.jpg（導覽影片海報）
# 都先縮成 720 寬 JPG（約 420 KB），內嵌進頁面，離線就能開
import base64, io, re, sys
from pathlib import Path
from PIL import Image
sys.stdout.reconfigure(encoding='utf-8')
HERE = Path(__file__).parent
RES = HERE.parent  # specs/research
SRC = {f'rp{i}': HERE / 'assets' / f'p{i}_s.jpg' for i in range(7)}
FR = {'af_title': '000045', 'af_call': '000439', 'af_pockets': '001051', 'af_safety': '001389', 'af_pool': '004758', 'af_end': '005843'}
SRC.update({k: RES / 'capital-animation' / 'preview' / f'frame-{v}.png' for k, v in FR.items()})
SRC['guide_poster'] = HERE / 'poster.jpg'

def b64(p, w=720):
    im = Image.open(p).convert('RGB')
    im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    buf = io.BytesIO(); im.save(buf, 'JPEG', quality=74, optimize=True)
    return 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode()

t = (HERE / 'src' / 'pipeline_explainer.template.html').read_text(encoding='utf-8')
need = set(re.findall(r'\{\{IMG:(\w+)\}\}', t))
missing = need - set(SRC)
assert not missing, missing
for k in need:
    t = t.replace('{{IMG:%s}}' % k, b64(SRC[k]))
out = Path(sys.argv[1] if len(sys.argv) > 1 else '專案全流程_零基礎互動解說.html')
out.write_text(t, encoding='utf-8')
print(round(out.stat().st_size / 1e6, 2), 'MB ->', out, '| images:', len(need))

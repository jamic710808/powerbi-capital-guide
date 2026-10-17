#!/usr/bin/env python3
"""film.json 旁白 → Gemini 3.8 Flash TTS（Kore）→ audio/<id>.wav（48 kHz 單聲道、去頭尾靜音）＋台詞指紋旁車檔。
用法：python tools/gen_voice.py [scene-id ...]   指定場景＝強制重做；省略＝只做缺檔或台詞已變的場景
TTS 腳本預設 K:/antigravity/scripts/gemini_tts.py，可用環境變數 GEMINI_TTS_SCRIPT 覆蓋；需要 GEMINI_API_KEY。
旁白文字會送到 Google 合成（內容為示範資料，無個資）。"""
import hashlib, json, os, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
ROOT = Path(__file__).resolve().parent.parent
TTS = os.environ.get('GEMINI_TTS_SCRIPT', 'K:/antigravity/scripts/gemini_tts.py')
VOICE, ENGINE = 'Kore', 'gemini-3.8-flash-tts'
TRIM = ('silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05,areverse,'
        'silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.08,areverse')

def sha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()

def one(s, force):
    sid, text = s['id'], s.get('narration', '').strip()
    if not text: return sid, 'skip (無旁白)'
    out = ROOT / 'audio' / f'{sid}.wav'; rec = out.with_suffix('.wav.json'); raw = ROOT / 'audio' / 'raw' / f'{sid}.wav'
    key = hashlib.sha256(json.dumps([text, ENGINE, VOICE], ensure_ascii=False).encode()).hexdigest()
    if not force and out.exists() and rec.exists():
        r = json.loads(rec.read_text(encoding='utf-8'))
        if r.get('key') == key and r.get('audioSha256') == sha(out): return sid, '復用'
    raw.parent.mkdir(parents=True, exist_ok=True)
    err = ''
    for _ in range(3):
        if raw.exists(): raw.unlink()
        r = subprocess.run([sys.executable, TTS, text, '-v', VOICE, '-o', str(raw)], capture_output=True, text=True,
                           encoding='utf-8', env={**os.environ, 'PYTHONIOENCODING': 'utf8'})
        err = (r.stderr or '')[-300:]
        if raw.exists() and raw.stat().st_size > 10000: break
    else:
        return sid, 'FAIL ' + err
    tmp = out.with_name(out.stem + '.new.wav')
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(raw), '-af', TRIM, '-ar', '48000', '-ac', '1', str(tmp)], check=True)
    tmp.replace(out)
    rec.write_text(json.dumps({'key': key, 'engine': ENGINE, 'text': text, 'voice': VOICE, 'rate': 0,
                               'audioSha256': sha(out)}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return sid, '生成'

def main():
    film = json.loads((ROOT / 'film.json').read_text(encoding='utf-8'))
    force = set(sys.argv[1:])
    with ThreadPoolExecutor(3) as ex:
        for sid, st in ex.map(lambda s: one(s, s['id'] in force), film['scenes']):
            print(sid, st)

if __name__ == '__main__':
    main()

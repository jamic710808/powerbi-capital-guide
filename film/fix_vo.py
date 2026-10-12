# audio/<k>.wav（Gemini TTS，24 kHz）→ vo44/<k>.wav（去頭尾靜音＋重新取樣到 44.1 kHz，單聲道）
# 為什麼一定要重新取樣：mkaudio.py 的時間軸是 44.1 kHz；24 kHz 檔案直接貼上會被加快約 1.84×（庫存版第 3 輪驗收踩過的坑）
import json,subprocess,sys,wave
sys.stdout.reconfigure(encoding='utf-8')
N=json.load(open('narration.json',encoding='utf-8'))
def dur(f):
    w=wave.open(f); return w.getnframes()/w.getframerate(), w.getframerate()
AF=("silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.06,"
    "areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.10,areverse")
for n in N:
    k=n['k']; src=f'audio/{k}.wav'; dst=f'vo44/{k}.wav'
    d0,sr0=dur(src)
    subprocess.run(['ffmpeg','-y','-v','error','-i',src,'-af',AF,'-ac','1','-ar','44100','-c:a','pcm_s16le',dst],check=True)
    d1,sr1=dur(dst); assert sr1==44100,(k,sr1)
    print(f'{k}  原檔 {d0:6.2f}s @{sr0}Hz  →  {d1:6.2f}s @{sr1}Hz  （去靜音 {d0-d1:+.2f}s）')

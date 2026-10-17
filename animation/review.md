# review — 《有個口袋在冒汗》final.mp4

## 規格（實測）
- 1920×1080、30 fps、H.264 + AAC 48 kHz 立體聲；6485 幀 / 216.17 s（3:36.2）；檔案 16.7 MB。
- 旁白：Gemini TTS Kore（溫和女聲），單一聲線；配樂＋音效為程式合成。母帶 -15.6 LUFS、true peak -1.5 dBFS。
- 長度：v1 預估 4:56 → v2 預估 3:29，實測 3:36。

## 檢查層級（區分清楚）
| 層級 | 狀態 | 說明 |
|---|---|---|
| 結構檢查 | ✅ 通過 | `pipeline.py validate`：尺寸、幀率、幀數、音畫時長；`ffmpeg` 全片解碼無錯 |
| 真實渲染 | ✅ 通過 | `render.cjs --preview`（126 張抽幀，含場景邊界與亂序重畫）、`--render` 逐幀導出 6485 幀 |
| 視覺檢查（我） | ✅ 已看 | 逐張看過 126 張抽幀的接觸表，並抽看成片末幀；未逐幀看完整動態 |
| 聽感檢查 | ❌ 未做 | 我無法聽音訊：旁白發音是否讀對、配樂與旁白的音量關係，只有響度數值，沒有試聽 |
| 獨立 critic | ❌ 未做 | 沒有另一位獨立審片者 |
| 用戶驗收 | ⏳ 待你 | 尚未由你確認 |

## 已知限制
1. **字幕為估時**：字幕與音效時間點依旁白字元比例估算（cue），非逐字對齊，可能與實際發音有零點幾秒誤差。
2. 小瑕疵（未修）：s04「今天特別忙！」氣泡蓋住第三張卡的標題；s05 小衡的鉛筆靠近「應付」列右緣；s09「看餘額→做安排」橫幅短暫遮住看板一角。
3. 轉場為斜切 wipe，中間幀以深藍為主，屬刻意設計。
4. 數字皆取自示範（模擬）資料報告，截至 2026-10-05（單位萬元），已對 DAX 逐項核對；片中候選安排明示「須審批」，未宣稱已補上缺口。
5. 老闆不發聲，只以手機對話框呈現（單一 Kore 聲線限制）。

## 複跑命令
```sh
export PYTHON="$(which python)" CHROME_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe" PYTHONIOENCODING=utf-8
python tools/gen_voice.py            # 旁白（Gemini Kore，需 API 金鑰）
python tools/pipeline.py timeline . --lock
python tools/make_audio.py           # 配樂＋音效
python tools/pipeline.py mix .
node tools/render.cjs . --preview
node tools/render.cjs . --render     # 約 14 分鐘
python tools/pipeline.py finish . && python tools/pipeline.py validate .
```
改旁白只需重跑「旁白 → timeline --lock → make_audio → mix → render → finish」。

## 未做
未發佈、未部署、未 git；成片僅在本機資料夾。

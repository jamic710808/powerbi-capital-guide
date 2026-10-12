# Power BI 資金分析報告 · 圖解導覽

給「完全不懂 Power BI、也不熟資金管理」的人看的導覽：一支 **6 分 03 秒旁白影片** ＋ 一個 **零基礎互動圖解頁**，把一份集團資金分析報告（7 頁）拆開來講。

> 資料為**示範（模擬）資料**，不代表任何真實公司。畫面擷取自線上 Power BI 報告（Publish to web，2026-10-12），資料截止日 2026-10-05。

## 看成品

| 版本 | 網址 | 備註 |
|---|---|---|
| Vercel | https://powerbi-capital-explainer.vercel.app | 影片載入最快，建議對外分享用這個 |
| GitHub Pages | https://jamic710808.github.io/powerbi-capital-guide/ | 來源是 `gh-pages` 分支 |

互動頁是單檔（圖片內嵌），含：影片章節跳轉、三層架構、六個問題、一筆數字的資料旅程、星狀模型（點節點亮起關聯）、七頁熱點說明、口徑翻牌（真實 DAX）、小字典，以及「已確認事實」與「觀察／待確認」兩欄。

## 報告在回答什麼

七頁＝首頁＋資金安全總覽＋5 個專題，剛好對應六個問題：

| 頁 | 問題 |
|---|---|
| 資金安全總覽 | 未來 13 週，誰會先缺錢？ |
| 收支與預算 | 錢花在哪，預算跑偏了多少？ |
| 渠道結算與到期 | 該收的、該付的，什麼時候？ |
| 融資與金融工具 | 借錢貴不貴，什麼時候要還？ |
| 集團資金調配 | 能不能先不借，內部解決？ |
| 跨境與匯率風險 | 外幣敞口要不要管？ |

模型規模（對本機 pbip 做 DAX 查詢取得）：8 張事實表、10 張維度表、151 個度量值、55 條關聯（50 啟用＋5 停用，全為多對一、單向）。

## 事實與驗證

- 畫面上 **30 個 KPI 逐項對模型 DAX**，全部吻合（對照表見 [`film/BRIEF.md`](film/BRIEF.md)）。
- **可調配資金＝可用資金 − 最低運營備付 − 調撥限制**：42,961.7 − 1,209.8 − 7,224.1 ＝ 34,527.8（萬元，加總後恰好相符）。
- 影片量測：−16.0 LUFS、true peak −3.2 dBFS、旁白落點 13/13 場景正常；近乎靜止畫面約 75%（讀圖型教學片的特性）。
- 完整製作與驗證紀錄、修正過的問題與限制：[`film/GAUNTLET.md`](film/GAUNTLET.md)。

## 目錄

```
shoot.js                 線上報告 → 逐頁 3840×2160 擷取（shots/）
make_assets.py           shots/ → assets/（3840／1920／960 三種尺寸）
src/explainer.template.html   互動頁範本
build_explainer.py       範本＋圖片＋時間軸 → 單檔 index.html（章節秒數取自 timeline.json）
film/
  BRIEF.md  GAUNTLET.md  簡報（事實、不可宣稱）與製作／驗證紀錄
  narration.json         旁白稿（一句＝一個畫面任務）
  gen_tts.py             Gemini TTS（Kore）→ audio/（24 kHz）
  fix_vo.py              去頭尾靜音＋重新取樣 44.1 kHz → vo44/
  build_timeline.py      依旁白實際長度排時間軸 → timeline.json
  stage.html             影片舞台：render(t) 是時間的純函式
  render.js              逐格截圖＋ffmpeg 合成
  mkaudio.py             程式合成配樂與轉場音效、混音
  verify_audio.py        旁白是否落在時間窗口內
  print_clauses.py       印出每場景的句界（鏡頭／聚光框以句序對時）
powerbi-capital-explainer/    部署用：index.html、poster.jpg（film.mp4 見下）
qa_*.js  probe.js        頁面與線上版的檢查腳本
```

## 分支說明

- `main`：研究與製作紀錄（本分支）。**不含 `film.mp4`**（74 MB），避免影片進歷史。
- `gh-pages`：網站三個檔案（`index.html`、`film.mp4`、`poster.jpg`）＋ `.nojekyll`，GitHub Pages 由此發佈。
- 也沒有提交：母檔 `out_final.mp4`（148 MB）、`mix*.wav`、`vo44/`、QA 畫格——都可由腳本重現。

## 重新製作

需要 Node 22、Python（numpy、Pillow）、ffmpeg、系統 Chrome，以及環境變數 `GEMINI_API_KEY`。

> ⚠️ 腳本裡有**寫死的本機路徑**（puppeteer-core 位置、Chrome 路徑、`K:/antigravity/scripts/gemini_tts.py`），換電腦要先改。

```bash
node shoot.js "<publish-to-web URL>" shots     # 1. 擷取 7 頁
python make_assets.py                          # 2. 產生各尺寸圖
cd film
python gen_tts.py                              # 3. 旁白（只重做缺檔場景；加場景代號可強制重做）
python fix_vo.py && python build_timeline.py   # 4. 去靜音、重新取樣、排時間軸
python mkaudio.py                              # 5. 配樂與混音 → mix_raw.wav
ffmpeg -i mix_raw.wav -af loudnorm=I=-16:TP=-2:LRA=11 -ar 44100 mix.wav   # 6. 響度（兩段式更準，見 GAUNTLET）
python verify_audio.py                         # 7. 驗證旁白落點
node render.js . 0 362.666 out_final.mp4       # 8. 渲染（約 17 分鐘；總長以 timeline.json 為準）
cd .. && python build_explainer.py powerbi-capital-explainer/index.html   # 9. 建頁
```

## 已知限制

- **沒有做獨立評審**（只做自查：抽幀、接縫、量測、數字對 DAX）。
- **旁白沒有經過人工聆聽**，數字讀法請自行確認。
- 報表左側選單標題「集团资金分析报告」是**簡體字**（推測為背景圖資源），畫面保持原貌，只在互動頁「觀察」欄揭露。
- 配樂為程式合成，未另外找現成曲目。

## 來源

介紹文章：〈從資金安全到匯率風險：用這個Power BI資金分析報告幫你看清楚〉。文章中的配圖為簡體版，本專案**未引用**，畫面全部重新自線上報告擷取。

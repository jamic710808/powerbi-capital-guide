// 逐格渲染 <workdir>/stage.html → ffmpeg 合成 MP4
//   node render.js <workdir> [startSec endSec out.mp4]          省略區間 = 全片，out 預設 <workdir>/out.mp4
//   node render.js <workdir> --stills 3.2,15,30.5 [outDir]      只輸出幾張 JPG 做 QA（預設 <workdir>/qa）
// 為什麼不螢幕錄影：每格都是 render(t) 算出來的，結果可重現，可以只重跑某一段
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

function loadPuppeteer() {
  const tries = [
    'puppeteer-core',
    'C:/nvm4w/nodejs/node_modules/hyperframes/node_modules/puppeteer-core',   // Jamic 機器上實際可用的那份
    'puppeteer',
  ];
  for (const t of tries) { try { return require(t); } catch {} }
  throw new Error('找不到 puppeteer-core。先問使用者要不要安裝（npm i -g puppeteer-core），不要自己裝。');
}
function chromePath() {
  const c = [process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean);
  const hit = c.find(p => fs.existsSync(p));
  if (!hit) throw new Error('找不到 Chrome/Edge，設 CHROME_PATH');
  return hit;                                  // 一律正斜線：反斜線傳進 node 字串容易被吃掉
}

(async () => {
  const WD = path.resolve(process.argv[2] || '.');
  const TL = JSON.parse(fs.readFileSync(path.join(WD, 'timeline.json'), 'utf8'));
  const puppeteer = loadPuppeteer();
  const browser = await puppeteer.launch({
    executablePath: chromePath(), headless: 'new',
    args: ['--allow-file-access-from-files', '--force-device-scale-factor=1', '--hide-scrollbars'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  const errs = [];
  page.on('pageerror', e => { errs.push(e.message); console.error('[pageerror]', e.message); });
  page.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') console.error('[console]', m.text()); });
  await page.goto('file:///' + path.join(WD, 'stage.html').replace(/\\/g, '/'), { waitUntil: 'load' });
  const info = await page.evaluate(tl => window.init(tl), TL);
  console.log('init', info);

  if (process.argv[3] === '--stills') {
    const ts = process.argv[4].split(',').map(Number);
    const dir = path.resolve(process.argv[5] || path.join(WD, 'qa'));
    fs.mkdirSync(dir, { recursive: true });
    for (const t of ts) {
      await page.evaluate(t => window.render(t), t);
      await page.screenshot({ path: path.join(dir, `f_${t.toFixed(2)}.jpg`), type: 'jpeg', quality: 80 });
    }
    await browser.close();
    console.log('stills ->', dir);
    if (errs.length) process.exit(2);          // 旁白關鍵字找不到等錯誤：不要當成成功
    return;
  }

  const t0 = Number(process.argv[3] ?? 0);
  const t1 = Math.min(Number(process.argv[4] ?? TL.total), TL.total);
  const out = path.resolve(process.argv[5] ?? path.join(WD, 'out.mp4'));
  const nFrames = Math.round((t1 - t0) * TL.fps);

  // 畫面走 stdin（mjpeg），聲音從 mix.wav 切同一段 → 部分渲染也對嘴
  const ff = spawn('ffmpeg', ['-y', '-v', 'error',
    '-f', 'image2pipe', '-framerate', String(TL.fps), '-c:v', 'mjpeg', '-i', '-',
    '-ss', String(t0), '-t', String(t1 - t0), '-i', path.join(WD, 'mix.wav'),
    '-map', '0:v', '-map', '1:a',
    // TTS 原始平均約 -23 dB，手機外放偏小；拉到 -16 LUFS（常見線上影片響度）
    '-ar', '48000',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });

  const started = Date.now();
  for (let i = 0; i < nFrames; i++) {
    const t = t0 + i / TL.fps;
    await page.evaluate(t => window.render(t), t);
    const buf = await page.screenshot({ type: 'jpeg', quality: 93 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 300 === 0) console.log(`frame ${i}/${nFrames}  t=${t.toFixed(1)}s  ${((Date.now() - started) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  const code = await new Promise(r => ff.on('close', r));
  await browser.close();
  if (code !== 0) { console.error('ffmpeg exit', code); process.exit(1); }
  console.log('done', out, ((Date.now() - started) / 1000).toFixed(0) + 's');
})().catch(e => { console.error(e); process.exit(1); });

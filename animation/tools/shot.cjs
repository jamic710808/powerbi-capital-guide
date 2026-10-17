#!/usr/bin/env node
/* 開發用：輸出指定時刻的單格 PNG，逐場景調畫面（不屬於正式管線）。
   用法：node tools/shot.cjs . s01:4.5 s01:9 s02:12 ...   （場景前綴:場景內秒數；或 abs:全片秒數）
   輸出：preview/dev/<場景>_<秒>.png */
'use strict';
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const root = path.resolve(process.argv[2] || '.');
const reqs = process.argv.slice(3);
const mime = { '.html': 'text/html', '.js': 'application/javascript', '.json': 'application/json', '.wav': 'audio/wav' };
(async () => {
  const t = JSON.parse(fs.readFileSync(path.join(root, 'timeline.json')));
  const playwright = require(path.join(root, 'node_modules/playwright'));
  const server = http.createServer((req, res) => {
    const name = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const file = path.resolve(root, '.' + (name === '/' ? '/index.html' : name));
    if (!file.startsWith(root) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream'); res.end(fs.readFileSync(file));
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const browser = await playwright.chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const page = await browser.newPage({ viewport: { width: t.width, height: t.height }, deviceScaleFactor: 1 });
  const errs = []; page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto(`http://127.0.0.1:${server.address().port}/?export=1`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ready === true || window.__fail, null, { timeout: 30000 }).catch(() => {});
  const out = path.join(root, 'preview', 'dev'); fs.mkdirSync(out, { recursive: true });
  for (const r of reqs) {
    const [k, sec] = r.split(':'); let frame;
    if (k === 'abs') frame = Math.round(Number(sec) * t.fps);
    else { const s = t.scenes.find(x => x.id.startsWith(k)); if (!s) { console.log('找不到場景', k); continue; } frame = s.startFrame + Math.min(s.durationFrames - 1, Math.round(Number(sec) * t.fps)); }
    await page.evaluate(async f => { await window.renderFrame(f); }, frame);
    const f = path.join(out, `${k}_${sec}.png`); await page.locator('#stage').screenshot({ path: f, type: 'png' }); console.log(f);
  }
  if (errs.length) console.log('瀏覽器錯誤：\n' + errs.slice(0, 6).join('\n'));
  await browser.close(); server.close();
})().catch(e => { console.error(e); process.exit(1); });

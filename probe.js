// 探測：線上儀表板的翻頁按鈕、頁碼文字、畫布矩形；並存第 1 頁截圖
// 用法：node probe.js <publish-to-web URL>
const puppeteer=require('C:/nvm4w/nodejs/node_modules/hyperframes/node_modules/puppeteer-core');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',args:['--hide-scrollbars']});
 const p=await b.newPage(); await p.setViewport({width:1920,height:1130,deviceScaleFactor:1});
 await p.goto(process.argv[2],{waitUntil:'networkidle2',timeout:90000}); await sleep(9000);
 const info=await p.evaluate(()=>{
  const r=e=>{const q=e.getBoundingClientRect();return [Math.round(q.x),Math.round(q.y),Math.round(q.width),Math.round(q.height)]};
  const btns=[...document.querySelectorAll('button')].map(x=>({a:x.getAttribute('aria-label'),t:(x.innerText||'').slice(0,24),c:x.className.toString().slice(0,60),r:r(x)}));
  const canv=[...document.querySelectorAll('canvas,.displayArea,.pageBackground,.visualContainerHost,.canvasFlexBox,[class*="canvas"]')].slice(0,12).map(x=>({tag:x.tagName,c:x.className.toString().slice(0,60),r:r(x)}));
  const pg=[...document.querySelectorAll('*')].filter(x=>x.children.length===0&&/\d+\s*\/\s*\d+/.test(x.textContent||'')).slice(0,5).map(x=>({t:x.textContent.trim(),r:r(x)}));
  return {btns,canv,pg,title:document.title,w:innerWidth,h:innerHeight};
 });
 console.log(JSON.stringify(info,null,1));
 await p.screenshot({path:'probe_p1.png'});
 await b.close();
})();

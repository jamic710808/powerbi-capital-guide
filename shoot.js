// 線上 Power BI（Publish to web）→ 逐頁擷取 3840×2160 原生解析度
// 作法：視窗 1938×1140 讓報表畫布剛好 1920×1080（縮放 100%）；deviceScaleFactor=2 → 3840×2160；
//       以 displayArea 的實際矩形裁切；用「下一頁」按鈕（aria-label）翻頁，不靠座標
// 用法：node shoot.js <publish-to-web URL> [outDir]
const puppeteer=require('C:/nvm4w/nodejs/node_modules/hyperframes/node_modules/puppeteer-core');
const fs=require('fs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const OUT=(process.argv[3]||'shots')+'/';
fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',args:['--hide-scrollbars']});
 const p=await b.newPage(); await p.setViewport({width:1938,height:1140,deviceScaleFactor:2});
 await p.goto(process.argv[2],{waitUntil:'networkidle2',timeout:90000}); await sleep(10000);
 const names=await p.evaluate(()=>[...document.querySelectorAll('.sectionItem')].map(x=>x.getAttribute('aria-label')));
 console.log('pages:',names.join(' | '));
 for(let i=0;i<names.length;i++){
  if(i>0){ await p.click('button[aria-label="下一頁"]'); await sleep(9000); }
  await p.mouse.move(5,5);                       // 避免 hover 狀態
  await sleep(1500);
  const r=await p.evaluate(()=>{const q=document.querySelector('.displayArea').getBoundingClientRect();
    const sel=document.querySelector('.sectionItem.selected');return {x:q.x,y:q.y,w:q.width,h:q.height,cur:sel&&sel.getAttribute('aria-label')}});
  const file=`${OUT}${String(i).padStart(2,'0')}_${names[i]}.png`;
  await p.screenshot({path:file,clip:{x:r.x,y:r.y,width:r.w,height:r.h}});
  console.log(i,names[i],'selected=',r.cur,'rect=',[r.x,r.y,r.w,r.h].map(Math.round).join(','),'->',file);
 }
 await b.close();
})();

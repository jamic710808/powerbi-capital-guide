// 真 Chrome 開單檔頁面：影片可播放、章節 chip 跳轉、海報載入
const puppeteer=require('C:/nvm4w/nodejs/node_modules/hyperframes/node_modules/puppeteer-core');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',args:['--allow-file-access-from-files','--autoplay-policy=no-user-gesture-required']});
 const p=await b.newPage(); await p.setViewport({width:1280,height:900});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await p.goto('file:///'+process.argv[2].split('\\').join('/'),{waitUntil:'load'}); await sleep(1500);
 const r1=await p.evaluate(()=>{const v=document.querySelector('#vid');return {ready:v.readyState,dur:v.duration,w:v.videoWidth,h:v.videoHeight,poster:v.poster.slice(-12),chips:[...document.querySelectorAll('.chip')].map(c=>c.textContent)}});
 await p.evaluate(()=>{[...document.querySelectorAll('.chip')].find(c=>c.textContent.includes('第3頁')).click()}); await sleep(2500);
 const r2=await p.evaluate(()=>{const v=document.querySelector('#vid');return {t:+v.currentTime.toFixed(1),paused:v.paused,ready:v.readyState}});
 await p.evaluate(()=>document.querySelector('#film').scrollIntoView()); await sleep(300);
 await (await p.$('#film')).screenshot({path:'qa_page/d_film_final.png'});
 console.log(JSON.stringify({r1,r2,errs},null,1)); await b.close();
})();

// 線上版驗證（真 Chrome）：圖片全部載入、影片可載入與跳轉、互動元件可用、無橫向捲動
const puppeteer=require('C:/nvm4w/nodejs/node_modules/hyperframes/node_modules/puppeteer-core');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',args:['--autoplay-policy=no-user-gesture-required']});
 const out={};
 for(const [name,w,h] of [['desktop',1280,900],['mobile',390,844]]){
  const p=await b.newPage(); await p.setViewport({width:w,height:h});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('requestfailed',r=>errs.push('FAILED '+r.url().slice(-40)));
  p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text())});
  const resp=await p.goto(process.argv[2],{waitUntil:'networkidle2',timeout:120000});
  await sleep(2000);
  const r=await p.evaluate(()=>{const v=document.querySelector('#vid');
    return {title:document.title,
      imgsBroken:[...document.images].filter(i=>i.src&&!i.complete||(i.src&&i.complete&&i.naturalWidth===0&&i.closest('#lb')===null)).length,
      nImgs:document.images.length,
      video:{ready:v.readyState,dur:v.duration,w:v.videoWidth,h:v.videoHeight,err:v.error&&v.error.code},
      chips:document.querySelectorAll('.chip').length,tabs:document.querySelectorAll('.tab').length,
      scrollW:document.documentElement.scrollWidth,vw:innerWidth}});
  await p.evaluate(()=>{[...document.querySelectorAll('.chip')].find(c=>c.textContent.includes('第5頁')).click()}); await sleep(3000);
  r.afterChip=await p.evaluate(()=>{const v=document.querySelector('#vid');return {t:+v.currentTime.toFixed(1),paused:v.paused}});
  r.status=resp.status(); r.errs=errs;
  out[name]=r; await p.close();
 }
 console.log(JSON.stringify(out,null,1)); await b.close();
})();

// 互動頁 QA：file:// 開啟單檔，檢查 JS 錯誤、圖片、互動元件、橫向捲動；輸出各區塊截圖
// 用法：node qa_page.js <index.html 絕對路徑> <輸出資料夾>
const puppeteer=require('C:/nvm4w/nodejs/node_modules/hyperframes/node_modules/puppeteer-core');
const fs=require('fs'),path=require('path');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const file=process.argv[2], out=process.argv[3]||'qa_page'; fs.mkdirSync(out,{recursive:true});
(async()=>{
 const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',args:['--allow-file-access-from-files']});
 const res={errors:[],checks:[]};
 for(const [name,w,h] of [['desktop',1280,900],['mobile',390,844]]){
  const p=await b.newPage(); await p.setViewport({width:w,height:h,deviceScaleFactor:1});
  p.on('pageerror',e=>res.errors.push(name+': '+e.message)); p.on('console',m=>{if(m.type()==='error')res.errors.push(name+' console: '+m.text())});
  await p.goto('file:///'+file.replace(/\\/g,'/'),{waitUntil:'load'}); await sleep(800);
  const info=await p.evaluate(()=>({
    imgs:[...document.images].map(i=>({k:i.dataset.k||i.id||'',ok:i.complete&&i.naturalWidth>0})).filter(x=>!x.ok),
    nImgs:document.images.length,
    scrollW:document.documentElement.scrollWidth, vw:innerWidth,
    chips:document.querySelectorAll('.chip').length,
    tabs:document.querySelectorAll('.tab').length,
    flips:document.querySelectorAll('.flip').length,
    nodes:document.querySelectorAll('.node').length,
    edges:document.querySelectorAll('.edge').length,
    video:(()=>{const v=document.querySelector('#vid');return v?{src:v.currentSrc,ready:v.readyState,can:v.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"'),err:v.error&&v.error.code}:null})()
  }));
  res.checks.push({name,...info});
  // 診斷：誰撐出橫向捲動（右緣超出視窗、且不在可捲動容器內）
  res.checks.push({name,overflow:await p.evaluate(()=>{const vw=innerWidth,out=[];
    const inScroll=e=>{for(let a=e.parentElement;a&&a!==document.body;a=a.parentElement){const s=getComputedStyle(a);if(/(auto|scroll|hidden)/.test(s.overflowX))return true}return false};
    document.querySelectorAll('body *').forEach(e=>{const r=e.getBoundingClientRect();if(r.width&&r.right>vw+1&&!inScroll(e)&&getComputedStyle(e).position!=='fixed'&&getComputedStyle(e).display!=='none')out.push(`${e.tagName}.${(e.className||'').toString().slice(0,30)}#${e.id} right=${Math.round(r.right)}`)});
    return out.slice(0,10)})});
  // 互動：七個頁籤＋熱點
  const tabInfo=[];
  for(let i=0;i<7;i++){
    await p.evaluate(i=>document.querySelectorAll('.tab')[i].click(),i);
    const t=await p.evaluate(()=>({n:document.querySelectorAll('.hs').length,src:document.querySelector('#pimg').src.slice(0,22),h:document.querySelector('#pside h3').textContent}));
    tabInfo.push(t);
  }
  res.checks.push({name,tabInfo});
  // 熱點點擊：每頁第一個
  await p.evaluate(()=>{document.querySelectorAll('.tab')[1].click();document.querySelectorAll('.hs')[0].click()});
  res.checks.push({name,hsInfo:await p.evaluate(()=>document.querySelector('#hsInfo').textContent.slice(0,60))});
  // 翻牌、星狀節點、旅程步驟
  await p.evaluate(()=>{document.querySelectorAll('.flip')[0].click()});
  res.checks.push({name,flip:await p.evaluate(()=>document.querySelectorAll('.flip')[0].getAttribute('aria-pressed'))});
  await p.evaluate(()=>{document.querySelector('.node[data-n="維度_公司"]').dispatchEvent(new MouseEvent('click',{bubbles:true}))});
  res.checks.push({name,node:await p.evaluate(()=>({h:document.querySelector('#nodeInfo h3').textContent,hi:document.querySelectorAll('.edge.hi').length,links:document.querySelectorAll('#nodeInfo .pill').length}))});
  for(let i=0;i<5;i++){await p.evaluate(i=>document.querySelectorAll('.step')[i].click(),i);}
  res.checks.push({name,step:await p.evaluate(()=>document.querySelector('#stage h3').textContent)});
  // 截圖：各區塊
  if(name==='desktop'){
    await p.evaluate(()=>{document.querySelectorAll('.step')[0].click();document.querySelectorAll('.tab')[1].click();document.querySelectorAll('.hs')[0].click();});
    await p.evaluate(()=>document.querySelectorAll('.mbar i').forEach(i=>i.style.width=i.dataset.w+'%'));
    for(const id of ['top','film','layers','qs','journey','star','pages','defs','charts','measures','notes','run']){
      const h=await p.$(`#${id}`); if(!h) continue; await h.evaluate(e=>e.scrollIntoView()); await sleep(250);
      await h.screenshot({path:path.join(out,`d_${id}.png`)});
    }
  } else {
    await p.evaluate(()=>window.scrollTo(0,0)); await sleep(200);
    await p.screenshot({path:path.join(out,'m_top.png')});
    for(const id of ['pages','star']){const h=await p.$(`#${id}`); await h.evaluate(e=>e.scrollIntoView()); await sleep(250); await p.screenshot({path:path.join(out,`m_${id}.png`)});}
  }
  await p.close();
 }
 await b.close();
 console.log(JSON.stringify(res,null,1));
})();

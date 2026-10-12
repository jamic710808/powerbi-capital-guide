// 線上影片載入診斷：逐秒記錄 readyState / networkState / buffered / currentTime，並記錄 film.mp4 的所有請求與回應
const puppeteer=require('C:/nvm4w/nodejs/node_modules/hyperframes/node_modules/puppeteer-core');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',args:['--autoplay-policy=no-user-gesture-required']});
 const p=await b.newPage(); await p.setViewport({width:1280,height:900});
 const net=[];
 p.on('response',r=>{if(/film\.mp4/.test(r.url()))net.push({s:r.status(),range:r.request().headers().range||null,len:r.headers()['content-length'],cr:r.headers()['content-range']||null})});
 p.on('requestfailed',r=>{if(/film\.mp4/.test(r.url()))net.push({failed:r.failure()&&r.failure().errorText,range:r.headers().range||null})});
 await p.goto(process.argv[2],{waitUntil:'load',timeout:120000});
 const snap=()=>p.evaluate(()=>{const v=document.querySelector('#vid');const bf=[];for(let i=0;i<v.buffered.length;i++)bf.push([+v.buffered.start(i).toFixed(1),+v.buffered.end(i).toFixed(1)]);
   return {ready:v.readyState,net:v.networkState,dur:v.duration,t:+v.currentTime.toFixed(1),paused:v.paused,buf:bf,err:v.error&&{code:v.error.code,msg:v.error.message}}});
 const log=[];
 for(let i=0;i<8;i++){log.push({sec:i*2,...await snap()}); await sleep(2000);}
 await p.evaluate(()=>{const v=document.querySelector('#vid');v.currentTime=228.8;v.play().catch(()=>{})});
 for(let i=0;i<6;i++){await sleep(2000);log.push({after_seek_sec:(i+1)*2,...await snap()});}
 console.log(JSON.stringify({log,net},null,0).replace(/\},\{/g,'},\n{'));
 await b.close();
})();

const puppeteer=require('C:/nvm4w/nodejs/node_modules/hyperframes/node_modules/puppeteer-core');
(async()=>{
 const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new'});
 const p=await b.newPage(); const bad=[];
 p.on('response',r=>{if(r.status()>=400)bad.push(r.status()+' '+r.url())});
 p.on('requestfailed',r=>bad.push('FAILED('+(r.failure()&&r.failure().errorText)+') '+r.url()));
 await p.goto(process.argv[2],{waitUntil:'networkidle2',timeout:120000});
 await new Promise(r=>setTimeout(r,2500));
 await p.evaluate(()=>{document.querySelector('#vid').currentTime=120});
 await new Promise(r=>setTimeout(r,3000));
 console.log(JSON.stringify(bad,null,1)); await b.close();
})();

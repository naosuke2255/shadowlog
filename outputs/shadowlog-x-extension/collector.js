(()=>{
 if(globalThis.shadowlogCollectorInstalled)return;globalThis.shadowlogCollectorInstalled=true;
 let running=false,working=false,interval=null,queue=[],seen=new Set(),checked=0,found=0,failed=0,error='',generation=0;
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});
 const send=async msg=>{const r=await chrome.runtime.sendMessage(msg);if(!r?.ok)throw Error(r?.error||'拡張との接続が切れました。');return r.data};
 const report=()=>send({type:'progress',running,checked,found,failed,error}).catch(()=>{});
 function stop(){running=false;generation++;clearInterval(interval);interval=null;queue=[];report()}
 function collect(){if(!running)return;
  for(const img of document.querySelectorAll('img')){if(seen.size>=100)break;const rect=img.getBoundingClientRect();if(!img.complete||img.naturalWidth<100||rect.width<50||rect.height<50||rect.bottom<=0||rect.top>=innerHeight||rect.right<=0||rect.left>=innerWidth)continue;
   let url;try{url=new URL(img.currentSrc||img.src);if(url.origin!=='https://pbs.twimg.com'||!url.pathname.startsWith('/media/'))continue;url.searchParams.set('name','orig')}catch{continue}
   const key=url.origin+url.pathname;if(seen.has(key))continue;seen.add(key);
   const article=img.closest('article'),link=article?.querySelector('a[href*="/status/"] time')?.closest('a')||article?.querySelector('a[href*="/status/"]');let post=link?.href||location.href;try{const u=new URL(post);post=u.origin+u.pathname.replace(/\/(?:photo|video)\/\d+$/,'')}catch{post=''}
   queue.push({url:url.href,post});
  }pump();
 }
 async function pump(){if(working||!running)return;working=true;const current=generation;
  try{while(queue.length&&running&&current===generation){const item=queue.shift();let bitmap;
   try{const data=await send({type:'image',url:item.url});if(!running||current!==generation)break;
    const bytes=Uint8Array.from(atob(data.base64),c=>c.charCodeAt(0));bitmap=await createImageBitmap(new Blob([bytes],{type:data.mime}));if(bitmap.width*bitmap.height>50000000)throw Error('画像が大きすぎます。');
    let qr=null;for(const limit of [1600,3000]){const scale=Math.min(1,limit/Math.max(bitmap.width,bitmap.height));canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);const p=ctx.getImageData(0,0,canvas.width,canvas.height);qr=globalThis.jsQR(p.data,p.width,p.height,{inversionAttempts:'attemptBoth'});if(qr||scale===1)break}
    if(!running||current!==generation)break;
    if(qr){const result=await send({type:'found',url:qr.data,post:item.post});if(result.added)found++}else failed++;
   }catch(e){failed++;error=e.message}finally{bitmap?.close()}
   checked++;await report();
  }}finally{working=false;if(running&&current!==generation)pump();if(running&&seen.size>=100&&!queue.length){error='100画像を確認しました。続ける場合は再度開始してください。';stop()}}
 }
 chrome.runtime.onMessage.addListener((msg,sender,reply)=>{if(sender.id!==chrome.runtime.id)return;if(msg.type==='start'){if(!running){generation++;running=true;queue=[];seen=new Set();checked=0;found=0;failed=0;error='';interval=setInterval(collect,1000);collect();report()}reply({ok:true})}else if(msg.type==='stop'){stop();reply({ok:true})}else if(msg.type==='ping')reply({ok:true,running})});
 addEventListener('pagehide',stop);
})();

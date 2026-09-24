export function qrMarkup(id,label='QR画像から取り込む'){
 return `<div class="qr-drop" id="${id}" tabindex="0" role="group" aria-label="${label}"><label>${label}<input type="file" accept="image/png,image/jpeg,image/webp,image/bmp" aria-label="${label}"></label><p>QR画像を選択・ここにドロップ、またはこの枠をクリックして Ctrl+V。スクリーンショットも使えます。</p><p class="qr-status" role="status"></p></div>`;
}
export async function decodeQRImage(file){
 if(!file||!file.type.startsWith('image/'))throw Error('QRコードを含む画像を選んでください。');
 if(file.size>20*1024*1024)throw Error('画像は20MB以下にしてください。');
 let bitmap;try{bitmap=await createImageBitmap(file)}catch{throw Error('画像を開けません。PNG・JPEG形式で保存して試してください。')}
 try{
  if(bitmap.width*bitmap.height>50000000)throw Error('画像が大きすぎます。QR部分を切り抜いてください。');
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});
  for(const limit of [1600,3000]){
   const scale=Math.min(1,limit/Math.max(bitmap.width,bitmap.height));canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);
   ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
   const pixels=ctx.getImageData(0,0,canvas.width,canvas.height),code=globalThis.jsQR(pixels.data,pixels.width,pixels.height,{inversionAttempts:'attemptBoth'});
   if(code?.data)return normalizeQRURL(code.data);
   if(scale===1)break;
  }
  throw Error('QRコードを読み取れませんでした。QR全体と周囲の白い余白が入るように切り抜いてください。');
 }finally{bitmap.close()}
}
export function normalizeQRURL(text){
 let u;try{u=new URL(text.trim())}catch{throw Error('このQRは対応するWBデッキURLではありません。公式のデッキ共有QRを使用してください。')}
 if(u.protocol!=='https:'||u.hostname!=='shadowverse-wb.com'||!/^\/(ja|en|cht|chs|ko|fr)\/deck\/detail\/$/.test(u.pathname)||!u.searchParams.get('hash'))throw Error('このQRはWBのデッキ共有QRではありません。');
 u.pathname='/ja/deck/detail/';return u.href;
}
export function bindQR(root,onDecoded){
 let busy=false;const status=root.querySelector('.qr-status');
 async function read(file){if(busy)return;busy=true;status.textContent='QRコードを読み取り中…';status.classList.remove('error');
 try{const url=await decodeQRImage(file);if(!root.isConnected)return;await onDecoded(url);status.textContent='QRを読み取りました。カードリストを確認してください。'}catch(e){status.textContent=e.message;status.classList.add('error')}finally{busy=false;root.querySelector('input').value=''}
 }
 root.querySelector('input').onchange=e=>read(e.target.files[0]);
 root.ondragover=e=>{e.preventDefault();root.classList.add('dragging')};root.ondragleave=()=>root.classList.remove('dragging');
 root.ondrop=e=>{e.preventDefault();root.classList.remove('dragging');read(e.dataTransfer.files[0])};
 root.onpaste=e=>{const item=[...e.clipboardData.items].find(i=>i.type.startsWith('image/'));if(item){e.preventDefault();read(item.getAsFile())}};
}

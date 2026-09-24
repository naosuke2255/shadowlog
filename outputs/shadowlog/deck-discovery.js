import {parsePortalURL} from './deck-tools.js';
import {normalizeQRURL} from './qr-import.js';
import {importDiscovered} from './x-import-core.js';
import {readDeckImages} from './deck-image-batch.js';
let dispose=null;
export function stopDiscovery(){dispose?.();dispose=null}
export function mountDiscovery(root,{getDB,change,toast}){
 stopDiscovery();let stream=null,timer=null,closed=false,starting=false,busy=false,sessionSeen=new Set(),scanned=0,found=0,added=0,duplicates=0,misses=0;
 const $=s=>root.querySelector(s),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});
 root.innerHTML=`<section class="panel"><div class="section-title"><h2>Xでデッキを探す</h2><span>API不要・ローカル読取</span></div><div class="form-row"><label>検索キーワード<input id="discover-query" value="エルフ 連勝" maxlength="150"></label><button id="discover-search">Xの画像検索を開く ↗</button></div><p class="help">Windows版Xでもブラウザー版Xでも使えます。Xで画像を拡大し、右上などにあるQRがはっきり見える状態にしてください。</p></section>
 <section class="panel"><div class="section-title"><h2>Windows版Xの画面から自動取込</h2><span id="capture-state">停止中</span></div><p>「Xの画面を選ぶ」を押し、共有対象にXのウィンドウを選択してください。表示されたデッキQRを読み取り、差分チェッカーへ自動追加します。</p><div class="form-row"><button id="capture-start" class="primary">Xの画面を選ぶ</button><button id="capture-stop" disabled>読み取り停止</button><button id="capture-once" disabled>今の画面を読む</button></div><p id="capture-status" role="status">画像の保存・APIキーは不要です。画面は端末内だけで処理します。</p><div class="capture-stats" id="capture-stats"></div><video id="capture-preview" muted playsinline hidden aria-label="共有している画面のプレビュー"></video><p class="help">同じ構築は重複追加しません。最大30構築。QRが小さい場合はX側で画像を拡大してください。最小化した共有ウィンドウでは更新が止まる場合があります。Xの検索結果に出ていない投稿は取得しません。</p><div id="capture-results" class="capture-results"></div></section>
 <section class="panel"><h2>保存画像をまとめて読む</h2><label>QRを含む画像（最大30枚）<input id="capture-files" type="file" multiple accept="image/png,image/jpeg,image/webp,image/bmp"></label><p id="capture-files-status" role="status"></p></section>
 <section class="panel"><h2>ブラウザー拡張で集める</h2><p>Chrome／Edge用の「SHADOWLOG QR Collector」も同梱しています。Xの検索画面で読み取りを開始し、スクロールすると表示された投稿画像を収集します。拡張の「比較へ送る」でこのアプリに取り込めます。</p><p class="help">導入手順は配布フォルダー shadowlog-x-extension の README.md を参照してください。拡張方式では画面共有は不要です。</p></section>`;
 const video=$('#capture-preview');
 function stats(){$('#capture-stats').textContent=`読取 ${scanned}回 / QR検出 ${found}件 / 新規追加 ${added}件 / 登録済み ${duplicates}件`}
 function log(message,error=false){const p=document.createElement('p');p.textContent=message;if(error)p.className='error';$('#capture-results').prepend(p);while($('#capture-results').children.length>15)$('#capture-results').lastChild.remove()}
 function stop(){if(timer)clearTimeout(timer);timer=null;stream?.getTracks().forEach(t=>t.stop());stream=null;video.srcObject=null;video.hidden=true;canvas.width=0;canvas.height=0;$('#capture-start').disabled=false;$('#capture-stop').disabled=true;$('#capture-once').disabled=true;$('#capture-state').textContent='停止中'}
 dispose=()=>{closed=true;stop()};
 function accept(items){let result;change(db=>{result=importDiscovered(db.comparison||[],items);db.comparison=result.next});added+=result.added;duplicates+=result.duplicates;return result}
 async function scan(){
  if(closed||busy||!stream||video.readyState<2)return;busy=true;
  try{const scale=Math.min(1,2400/video.videoWidth);canvas.width=Math.round(video.videoWidth*scale);canvas.height=Math.round(video.videoHeight*scale);ctx.drawImage(video,0,0,canvas.width,canvas.height);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);scanned++;const qr=globalThis.jsQR(pixels.data,pixels.width,pixels.height,{inversionAttempts:'attemptBoth'});
   if(qr?.data&&!sessionSeen.has(qr.data)){sessionSeen.add(qr.data);if(sessionSeen.size>200)sessionSeen.delete(sessionSeen.values().next().value);found++;try{const url=normalizeQRURL(qr.data),deck=parsePortalURL(url),result=accept([{url,name:`${deck.class} / X画面 ${new Date().toLocaleDateString('ja-JP')}`}]);log(result.added?`${deck.class}：40枚を差分チェッカーへ追加`:'同じ構築は登録済みです');result.errors.forEach(e=>log(e,true))}catch(e){log(e.message,true)}}
   if(qr)misses=0;else misses++;
   $('#capture-status').textContent=misses>5?'QRが見つかりません。Xで画像を拡大し、QR全体を表示してください。':'共有画面を読み取り中。Xで画像を切り替えると自動で追加します。';stats();
  }catch(e){log(e.message,true);stop()}finally{busy=false}
 }
 async function tick(){await scan();if(!closed&&stream)timer=setTimeout(tick,1500)}
 $('#capture-start').onclick=async()=>{if(starting||stream)return;starting=true;$('#capture-start').disabled=true;try{if(!navigator.mediaDevices?.getDisplayMedia)throw Error('画面共有に対応したChrome／Edgeで開いてください。');const selected=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:{ideal:2,max:5}},audio:false});if(closed){selected.getTracks().forEach(t=>t.stop());return}stream=selected;video.srcObject=stream;video.hidden=false;await video.play();stream.getVideoTracks()[0].addEventListener('ended',()=>{stop();$('#capture-status').textContent='画面共有を終了しました。'});$('#capture-stop').disabled=false;$('#capture-once').disabled=false;$('#capture-state').textContent='読み取り中';tick()}catch(e){if(!closed){stop();$('#capture-status').textContent=e.name==='NotAllowedError'?'画面共有が選択されませんでした。必要なときに再度開始してください。':e.message}}finally{starting=false}};
 $('#capture-stop').onclick=()=>{stop();$('#capture-status').textContent='停止しました。取得したデッキは差分チェッカーに保存されています。'};$('#capture-once').onclick=scan;
 $('#discover-search').onclick=()=>{const query=$('#discover-query').value.trim();if(query)window.open('https://x.com/search?q='+encodeURIComponent(query+' filter:images')+'&f=image','_blank','noopener,noreferrer')};
 $('#capture-files').onchange=async e=>{const files=[...e.target.files];if(!files.length)return;e.target.disabled=true;try{const result=await readDeckImages(files,{isCancelled:()=>closed,onProgress:p=>$('#capture-files-status').textContent=`${p.processed}/${p.total}枚を処理中`});if(closed)return;const saved=accept(result.decks.map(d=>({url:d.sourceURL,name:d.name})));$('#capture-files-status').textContent=`追加${saved.added}件 / 重複${saved.duplicates+result.duplicates}件 / 読取失敗${result.failures.length}件`;result.failures.forEach(f=>log(`${f.name}：${f.error}`,true));saved.errors.forEach(e=>log(e,true));stats()}catch(e){$('#capture-files-status').textContent=e.message}finally{e.target.disabled=false;e.target.value=''}};
 stats();
}

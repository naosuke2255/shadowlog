import {imageURL,deckURL,signature,postURL,isX,transferURL} from './shared.js';
let writes=Promise.resolve();
function mutate(fn){const job=writes.then(async()=>{const {collector={items:[],tabs:{}}}=await chrome.storage.local.get('collector');const result=await fn(collector);await chrome.storage.local.set({collector});return result});writes=job.catch(()=>{});return job}
async function image(value){const url=imageURL(value),response=await fetch(url,{credentials:'omit',redirect:'error',signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('投稿画像を取得できませんでした。');const mime=(response.headers.get('content-type')||'').split(';')[0];if(!['image/png','image/jpeg','image/webp'].includes(mime))throw Error('非対応の画像形式です。');const reader=response.body.getReader(),chunks=[];let length=0;for(;;){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>12*1024*1024){await reader.cancel();throw Error('画像が12MBを超えています。')}chunks.push(value)}const bytes=new Uint8Array(length);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length}let str='';for(let i=0;i<bytes.length;i+=32768)str+=String.fromCharCode(...bytes.subarray(i,i+32768));return {base64:btoa(str),mime}}
chrome.runtime.onMessage.addListener((msg,sender,reply)=>{
 (async()=>{
  if(sender.id!==chrome.runtime.id)throw Error('送信元が不正です。');
  const content=sender.tab&&isX(sender.url||sender.tab.url),popup=!sender.tab&&sender.url?.startsWith(chrome.runtime.getURL('popup.html'));
  if(msg.type==='image'&&content)return image(msg.url);
  if(msg.type==='found'&&content)return mutate(s=>{const url=deckURL(msg.url),key=signature(url);if(s.items.some(x=>signature(x.url)===key))return {duplicate:true};if(s.items.length>=100)throw Error('保存上限100構築です。比較へ送ってから一覧を空にしてください。');const post=postURL(msg.post);s.items.push({id:crypto.randomUUID(),url,post,name:post?`X / ${new URL(post).pathname.split('/')[1]}`:'Xのデッキ',at:new Date().toISOString()});return {added:true}});
  if(msg.type==='progress'&&content)return mutate(s=>{s.tabs[sender.tab.id]={running:!!msg.running,checked:Math.max(0,Math.min(100,Number(msg.checked)||0)),found:Math.max(0,Math.min(100,Number(msg.found)||0)),failed:Math.max(0,Math.min(100,Number(msg.failed)||0)),error:typeof msg.error==='string'?msg.error.slice(0,200):'',at:Date.now()};for(const k of Object.keys(s.tabs))if(Date.now()-s.tabs[k].at>86400000)delete s.tabs[k];return {ok:true}});
  if(msg.type==='state'&&popup){await writes;return (await chrome.storage.local.get('collector')).collector||{items:[],tabs:{}}}
  if(msg.type==='clear'&&popup)return mutate(s=>{s.items=[];return {ok:true}});
  if(msg.type==='transfer'&&popup){await writes;const {collector}=await chrome.storage.local.get('collector'),ids=new Set(msg.ids||[]),items=(collector?.items||[]).filter(x=>ids.has(x.id));const url=transferURL(items);await chrome.tabs.create({url});return {ok:true}}
  throw Error('この操作は利用できません。');
 })().then(data=>reply({ok:true,data}),e=>reply({ok:false,error:e.message}));return true;
});

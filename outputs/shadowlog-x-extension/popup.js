import {isX} from './shared.js';
const $=s=>document.querySelector(s);let tab=null,lastItems='',selected=new Set(),busy=false;
const send=async msg=>{const r=await chrome.runtime.sendMessage(msg);if(!r?.ok)throw Error(r?.error||'接続できません。');return r.data};
async function refresh(){if(busy)return;try{const state=await send({type:'state'}),stat=state.tabs[tab?.id];$('#count').textContent=state.items.length;const key=JSON.stringify(state.items);if(key!==lastItems){const previous=lastItems;lastItems=key;$('#items').replaceChildren();for(const item of state.items){if(!previous&&selected.size<30)selected.add(item.id);const box=document.createElement('div');box.className='item';const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.checked=selected.has(item.id);check.onchange=()=>{if(check.checked)selected.add(item.id);else selected.delete(item.id);$('#transfer').disabled=selected.size===0||selected.size>30};label.append(check,document.createTextNode(item.name));box.append(label);if(item.post){const a=document.createElement('a');a.href=item.post;a.target='_blank';a.rel='noopener';a.textContent='元の投稿 ↗';box.append(a)}$('#items').append(box)}}$('#transfer').disabled=selected.size===0||selected.size>30;
 $('#status').textContent=stat?`${stat.running?'読み取り中（タブを再読込すると停止）':'停止中'} / 確認${stat.checked}画像 / 新規${stat.found}件 / QRなし・失敗${stat.failed}件${stat.error?'\n'+stat.error:''}`:'Xの検索画面で「開始」を押してください。';
 }catch(e){$('#status').textContent=e.message}}
async function action(fn){busy=true;try{await fn()}catch(e){$('#status').textContent=e.message;return}finally{busy=false}await refresh()}
$('#start').onclick=()=>action(async()=>{[tab]=await chrome.tabs.query({active:true,currentWindow:true});if(!isX(tab?.url))throw Error('Xの検索画面または投稿画面で開いてください。');await chrome.scripting.executeScript({target:{tabId:tab.id},files:['vendor/jsQR.js','collector.js']});await chrome.tabs.sendMessage(tab.id,{type:'start'})});
$('#stop').onclick=()=>action(async()=>{if(tab)await chrome.tabs.sendMessage(tab.id,{type:'stop'})});
$('#select-all').onclick=()=>action(async()=>{const state=await send({type:'state'});selected=new Set(state.items.slice(0,30).map(x=>x.id));lastItems='';});
$('#transfer').onclick=()=>action(()=>send({type:'transfer',ids:[...selected]}));
$('#clear').onclick=()=>action(async()=>{await send({type:'clear'});selected.clear();lastItems=''});
[tab]=await chrome.tabs.query({active:true,currentWindow:true});await refresh();const timer=setInterval(refresh,1500);addEventListener('pagehide',()=>clearInterval(timer));

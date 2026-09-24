import {parsePortalURL} from './deck-tools.js';
import {normalizeQRURL} from './qr-import.js';
import {deckSignature} from './deck-compare-core.js';
export function importDiscovered(existing,items){
 if(!Array.isArray(items)||items.length>30)throw Error('一度に30デッキまで取り込めます。');
 const next=structuredClone(existing),errors=[];let added=0,duplicates=0;
 for(const item of items){try{if(!item||typeof item.url!=='string'||item.url.length>5000)throw Error('デッキURLが不正です。');const url=normalizeQRURL(item.url),d=parsePortalURL(url);
  if(next.some(x=>deckSignature(x)===deckSignature(d))){duplicates++;continue}
  if(next.length>=30)throw Error('比較対象が30件に達しました。差分チェッカーで不要な対象を外してください。');
  const post=typeof item.post==='string'&&/^https:\/\/(?:x|twitter)\.com\/[A-Za-z0-9_]+\/status\/\d+$/.test(item.post)?item.post:'';
  next.push({...d,id:crypto.randomUUID(),name:(typeof item.name==='string'&&item.name.trim()?item.name.trim().slice(0,150):d.class+' / QR取込'),sourceURL:url,sourcePost:post,importedAt:new Date().toISOString()});added++;
 }catch(e){errors.push(e.message)}}return {next,added,duplicates,errors};
}
export function decodeTransfer(hash){
 if(!hash.startsWith('#x-import='))return null;
 if(hash.length>100000)throw Error('取り込みデータが大きすぎます。');
 const data=JSON.parse(decodeURIComponent(hash.slice(10)));
 if(!Array.isArray(data)||data.length>30)throw Error('取り込みデータは30件までです。');return data;
}

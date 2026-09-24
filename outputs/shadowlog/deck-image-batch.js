import {parsePortalURL} from './deck-tools.js';
import {deckSignature} from './deck-compare-core.js';
import {decodeQRImage} from './qr-import.js';
// Each image is independent: unreadable images do not discard successful results.
export async function readDeckImages(files,{decode=decodeQRImage,onProgress=()=>{},isCancelled=()=>false}={}){
 if(!files.length||files.length>30)throw Error('画像は1〜30枚で指定してください。');
 const decks=[],failures=[],seen=new Set();let duplicates=0,processed=0;
 for(const file of files){
  if(isCancelled())break;
  try{const url=await decode(file);if(isCancelled())break;const deck=parsePortalURL(url),signature=deckSignature(deck);
   if(seen.has(signature))duplicates++;else{seen.add(signature);decks.push({...deck,name:deck.name||file.name?.replace(/\.[^.]+$/,'').slice(0,150)||deck.class+' デッキ',sourceURL:url})}
  }catch(e){failures.push({name:file.name||'画像',error:e.message})}
  processed++;onProgress({processed,total:files.length,success:decks.length,duplicates,failed:failures.length});
 }
 return {decks,failures,duplicates,processed,cancelled:isCancelled()};
}

import {normalizeOfficial} from './copilot-core.js';
const cache=new Map();
export async function getCards(ids){
  if(!Array.isArray(ids)||!ids.length||ids.length>40||ids.some(id=>!/^\d{8}$/.test(id)))throw Error('カードIDは最大40件です。');
  const result=[],queue=[...new Set(ids)];
  await Promise.all(Array.from({length:Math.min(4,queue.length)},async()=>{while(queue.length){const id=queue.shift(),old=cache.get(id);if(old&&Date.now()-old.at<3600000){result.push(old.card);continue}
    const r=await fetch('https://shadowverse-wb.com/web/CardList/card?card_id='+id,{headers:{Lang:'ja'},signal:AbortSignal.timeout(15000)});
    if(!r.ok)throw Error('公式サイトに接続できません。保存済みシートはオフラインで使えます。');
    const card=normalizeOfficial(await r.json(),id);cache.set(id,{at:Date.now(),card});result.push(card);
  }}));return result;
}

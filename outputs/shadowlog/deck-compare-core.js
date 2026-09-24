export const deckSignature=d=>d.class+'|'+JSON.stringify([...d.cards].sort((a,b)=>a.name.localeCompare(b.name)));
export function validateComparison(value){
 if(!Array.isArray(value)||value.length>30)throw Error('比較データの形式が不正です。');
 const ids=new Set();for(const d of value){if(!d||typeof d.id!=='string'||!d.id||ids.has(d.id)||typeof d.name!=='string'||d.name.length>200||!['エルフ','ロイヤル','ウィッチ','ドラゴン','ナイトメア','ビショップ','ネメシス'].includes(d.class)||!Array.isArray(d.cards)||d.cards.some(c=>!c||typeof c.name!=='string'||!c.name||c.name.length>1000||!Number.isInteger(c.count)||c.count<1||c.count>3)||new Set(d.cards.map(c=>c.name)).size!==d.cards.length||d.cards.reduce((n,c)=>n+c.count,0)!==40)throw Error('比較データは40枚のデッキで指定してください。');ids.add(d.id)}return value;
}
export function compareDecks(decks){
 validateComparison(decks);const n=decks.length;
 if(!n)return {n:0,common:0,rows:[]};
 const names=[...new Set(decks.flatMap(d=>d.cards.map(c=>c.name)))];
 const rows=names.map(name=>{const counts=decks.map(d=>d.cards.find(c=>c.name===name)?.count||0),adopted=counts.filter(Boolean).length,min=Math.min(...counts),max=Math.max(...counts);return {name,counts,adopted,min,max,rate:100*adopted/n,average:counts.reduce((a,b)=>a+b,0)/n}}).sort((a,b)=>b.adopted-a.adopted||b.min-a.min||b.average-a.average||a.name.localeCompare(b.name));
 return {n,rows,common:rows.reduce((n,r)=>n+r.min,0)};
}
export function deckDifference(a,b){
 const rows=compareDecks([{...a,id:"base"},{...b,id:"target"}]).rows.map(r=>({name:r.name,from:r.counts[0],to:r.counts[1],delta:r.counts[1]-r.counts[0]})).filter(r=>r.delta!==0);
 return {rows,removed:rows.reduce((n,r)=>n+Math.max(0,-r.delta),0),added:rows.reduce((n,r)=>n+Math.max(0,r.delta),0)};
}


import {CLASSES} from './core.js';
import {CARD_CATALOG} from './card-catalog.js';

export const normalizeCardName = value => value.normalize('NFKC').toLowerCase().replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60)).replace(/\s/g,'');
export const cardClass = id => ['ニュートラル',...CLASSES][Number(String(id)[3])] || '';
export function changeCardCount(cards,name,delta){
  if(typeof name!=='string'||!name.trim()||!Number.isInteger(delta))throw Error('カードを選択してください。');
  name=name.trim();
  const next=cards.map(c=>({...c})),index=next.findIndex(c=>c.name===name);
  const before=index<0?0:next[index].count,count=before+delta;
  if(count<0||count>3)throw Error('同じカードは3枚までです。');
  if(next.reduce((n,c)=>n+c.count,0)+delta>40)throw Error('40枚になっています。差し替えるカードを先に減らしてください。');
  if(index>=0){if(count)next[index].count=count;else next.splice(index,1)}
  else if(count)next.push({name,count});
  return next;
}

export function parsePortalURL(input,catalog=CARD_CATALOG){
  let url;try{url=new URL(input.trim())}catch{throw Error('Deck Portalのデッキ詳細URLを貼り付けてください。')}
  if(url.protocol!=='https:'||url.hostname!=='shadowverse-wb.com'||url.pathname!=='/ja/deck/detail/')throw Error('公式のデッキ詳細URL（https://shadowverse-wb.com/ja/deck/detail/?hash=…）に対応しています。');
  const parts=(url.searchParams.get('hash')||'').split('.');
  if(parts.length!==42||!/^\d+$/.test(parts[0])||!/[1-7]/.test(parts[1])||parts[1].length!==1)throw Error('40枚のカード情報を含む共有URLではありません。短いデッキコードは対象外です。');
  const alphabet='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_',byId=new Map(catalog.map(c=>[c.id,c]));
  let cards=[];
  for(const token of parts.slice(2)){
    if(!/^[0-9A-Za-z_-]{4}$/.test(token))throw Error('URL内のカード情報を読み取れませんでした。');
    const id=String([...token].reduce((n,c)=>n*64+alphabet.indexOf(c),0)),card=byId.get(id);
    if(!card)throw Error(`未収録のカード（ID ${id}）が含まれます。候補にないカードはテキストで追加してください。`);
    if(cardClass(id)!=='ニュートラル'&&cardClass(id)!==CLASSES[Number(parts[1])-1])throw Error('URLのクラスとカードが一致しません。');
    cards=changeCardCount(cards,card.name,1);
  }
  return {cards,class:CLASSES[Number(parts[1])-1],name:(url.searchParams.get('name')||'').slice(0,80)};
}

// Common copied lists: name 3, name ×3, 3x name, name + count on next line.
export function parsePastedList(text,knownNames=CARD_CATALOG.map(c=>c.name)){
  const known=new Map(knownNames.map(n=>[normalizeCardName(n),n]));
  const lines=text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);let cards=[];
  if(!lines.length)throw Error('カードリストを貼り付けてください。');
  for(let i=0;i<lines.length;i++){
    let name=lines[i],count=1;
    const suffix=name.match(/^(.+?)\s*[x×＊*]\s*(\d+)\s*(?:枚)?$/i)||name.match(/^(.+?)\s+(\d+)\s*(?:枚)?$/);
    const prefix=name.match(/^(\d+)\s*[x×＊*]\s*(.+)$/i);
    if(suffix){name=suffix[1].trim();count=Number(suffix[2])}
    else if(prefix){name=prefix[2].trim();count=Number(prefix[1])}
    else if(i+1<lines.length&&/^[x×]?\s*\d+\s*(?:枚)?$/.test(lines[i+1])){count=Number(lines[++i].replace(/[^0-9]/g,''))}
    else if(!known.has(normalizeCardName(name)))throw Error(`「${name.slice(0,40)}」を認識できません。「カード名 3」の形式で指定してください。`);
    if(!name||count<1||count>3)throw Error('各カードは1〜3枚で指定してください。');
    name=known.get(normalizeCardName(name))||name;
    cards=changeCardCount(cards,name,count);
  }
  return cards;
}

export function searchCards(catalog,query,className='',onlySaved=false){
  const terms=normalizeCardName(query).split(/[、,]/).filter(Boolean);
  return catalog.filter(c=>(!onlySaved||c.saved)&&(!className||!c.class||c.class==='ニュートラル'||c.class===className)&&terms.every(t=>normalizeCardName(c.name).includes(t)));
}

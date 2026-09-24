export const TAGS=['疾走','AOE','確定除去','回復','超進化','守護'];
export const cleanText=s=>String(s||'').replace(/<hr\s*\/?\s*>/gi,'\n').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').trim();
export function portalIds(input){
  let u;try{u=new URL(input.trim())}catch{throw Error('公式デッキ詳細URLを貼り付けてください。')}
  if(u.origin!=='https://shadowverse-wb.com'||u.pathname!=='/ja/deck/detail/')throw Error('公式Deck Portalのデッキ詳細URLに対応しています。');
  const p=(u.searchParams.get('hash')||'').split('.'),abc='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';
  if(p.length!==42||!/^\d+$/.test(p[0])||! /^[1-7]$/.test(p[1])||p.slice(2).some(t=>! /^[\w-]{4}$/.test(t)))throw Error('40枚を含む共有URLが必要です。短いデッキコードは使えません。');
  const ids=p.slice(2).map(t=>String([...t].reduce((n,c)=>n*64+abc.indexOf(c),0)));
  if(ids.some(id=>! /^\d{8}$/.test(id)))throw Error('カードIDが不正です。');
  return [...new Set(ids)];
}
export function tagCandidates(text){return TAGS.filter(t=>({疾走:/【疾走】/,AOE:/(?:相手|お互い)の場のフォロワーすべて[\s\S]{0,50}(?:ダメージ|破壊|消滅)/,確定除去:/(?:相手|お互い)[^。\n]*(?:破壊|消滅)/,回復:/回復/,超進化:/超進化/,守護:/【守護】/}[t]).test(text));}
export function normalizeOfficial(payload,id){
  const all=payload?.data?.card_details,c=all?.[id]?.common;
  if(!c||String(c.card_id)!==String(id)||typeof c.name!=='string'||!Number.isInteger(c.cost))throw Error('公式カード情報を取得できませんでした。');
  const effect=cleanText(c.skill_text),evo=cleanText(all[id].evo?.skill_text);
  const related=Object.entries(all).filter(([k])=>k!==String(id)).slice(0,40).map(([k,v])=>({id:k,name:v.common.name,cost:v.common.cost,effect:cleanText(v.common.skill_text)}));
  for(const [key,v] of Object.entries(payload.data.specific_effect_card_info||{})){related.push({id:key,name:(payload.data.specific_effect_type_names?.[v.specific_effect_type]||'追加能力')+' / '+key,cost:v.cost||0,effect:cleanText(v.skill_text)})}
  return {id:String(id),name:c.name,cost:c.cost,attack:c.atk||0,effect,evo:evo===effect?'':evo,related,fetchedAt:new Date().toISOString()};
}
export function annotate(meta){
  const text=[meta.effect,meta.evo,...(meta.related||[]).map(r=>r.effect)].join('\n'),tags=tagCandidates(text);
  // Only unambiguous standalone storm and unconditional spell damage are numeric defaults.
  const plainStorm=/^【疾走】$/.test(meta.effect.trim());
  const direct=meta.effect.match(/^相手のリーダーに(\d+)ダメージ。$/);
  const heal=meta.effect.match(/^自分のリーダーを(\d+)回復。$/);
  return {tags,cost:meta.cost,damage:plainStorm?meta.attack:direct?Number(direct[1]):null,heal:heal?Number(heal[1]):null,priority:tags.includes('疾走')?4:tags.length?3:1,note:''};
}
export const remaining=(card,used)=>Math.max(0,card.count-(used[card.name]||0));
export function changeUsed(sheet,name,delta){
  const c=sheet.cards.find(c=>c.name===name);if(!c||!Number.isInteger(delta))throw Error('カードが見つかりません。');
  const next=(sheet.used[name]||0)+delta;if(next<0||next>c.count)return false;
  sheet.used[name]=next;return true;
}
export function ppMaximum(cards,used,annotations,pp,field='damage'){
  const dp=Array(pp+1).fill(0);let unknown=0;
  for(const c of cards){const a=annotations[c.name],n=remaining(c,used);if(!n)continue;if(a[field]===null){unknown+=n;continue}
    for(let i=0;i<n;i++)for(let p=pp;p>=a.cost;p--)dp[p]=Math.max(dp[p],dp[p-a.cost]+a[field]);
  }
  return {value:dp[pp],unknown};
}
export function visibleCards(sheet,pp,range='near',tag=''){
  return sheet.cards.filter(c=>{const a=sheet.annotations[c.name];return (!tag||a.tags.includes(tag))&&(range==='all'||range==='playable'&&a.cost<=pp||range==='near'&&a.cost>=pp&&a.cost<=pp+1)}).sort((a,b)=>sheet.annotations[a.name].cost-sheet.annotations[b.name].cost||sheet.annotations[b.name].priority-sheet.annotations[a.name].priority||a.name.localeCompare(b.name));
}
export function validateCopilot(p){
  const fail=()=>{throw Error('副操縦士データの形式が不正です。')},str=x=>typeof x==='string'&&x.length<=20000,int=(x,a,b)=>Number.isInteger(x)&&x>=a&&x<=b,obj=x=>x&&typeof x==='object'&&!Array.isArray(x);
  if(!obj(p)||!Array.isArray(p.sheets)||p.sheets.length>200||!str(p.active))fail();const ids=new Set();
  for(const s of p.sheets){if(!obj(s)||!str(s.id)||!s.id||ids.has(s.id)||!str(s.name)||!str(s.class)||!str(s.url)||!str(s.ownURL)||!str(s.ownName)||!int(s.pp,0,20)||!Array.isArray(s.cards)||s.cards.reduce((n,c)=>n+c.count,0)!==40||new Set(s.cards.map(c=>c.name)).size!==s.cards.length||!obj(s.used)||!obj(s.annotations)||!obj(s.meta)||!obj(s.notes))fail();ids.add(s.id);
    portalIds(s.url);if(s.ownURL)portalIds(s.ownURL);
    if(!Array.isArray(s.ownCards)||s.ownCards.some(c=>!obj(c)||!str(c.name)||!int(c.count,1,3))||(s.ownCards.length&&s.ownCards.reduce((n,c)=>n+c.count,0)!==40))fail();
    for(const key of ['keep','conditional','plan','memo'])if(!str(s.notes[key]))fail();
    for(const c of s.cards){const a=s.annotations[c.name],m=s.meta[c.name];if(!str(c.name)||!int(c.count,1,3)||!int(s.used[c.name]??0,0,c.count)||!obj(a)||!int(a.cost,0,99)||!int(a.priority,1,5)||!Array.isArray(a.tags)||a.tags.some(t=>!TAGS.includes(t))||!str(a.note)||!obj(m)||!/^\d{8}$/.test(m.id)||!str(m.effect)||!str(m.evo)||!str(m.fetchedAt)||!Array.isArray(m.related)||m.related.some(r=>!obj(r)||!str(r.name)||!str(r.effect))||!['damage','heal'].every(k=>a[k]===null||int(a[k],0,999)))fail();}
  }if(p.active&&!ids.has(p.active))fail();return p;
}

import test from 'node:test';
import assert from 'node:assert/strict';
import {handleCards} from './api/cards.js';

test('Vercel API returns card data through the shared card service contract',async()=>{
  const requested=[];
  const res=await handleCards(new Request('https://shadowlog.example/api/cards?ids=12345678,87654321'),async ids=>{
    requested.push(...ids);
    return ids.map(id=>({id,name:`card-${id}`}));
  });
  assert.equal(res.status,200);
  assert.deepEqual(requested,['12345678','87654321']);
  const body=await res.json();
  assert.deepEqual(body.cards.map(card=>card.id),requested);
  assert.match(res.headers.get('Content-Type'),/^application\/json/);
});

test('Vercel API rejects unsupported methods and invalid card IDs',async()=>{
  const methodRes=await handleCards(new Request('https://shadowlog.example/api/cards',{method:'POST'}));
  assert.equal(methodRes.status,405);
  assert.equal(methodRes.headers.get('Allow'),'GET');

  const idRes=await handleCards(new Request('https://shadowlog.example/api/cards?ids=invalid'));
  assert.equal(idRes.status,400);
  assert.equal((await idRes.json()).error,'カードIDが不正です。');
});

test('Vercel API hides upstream failures behind the existing user message',async()=>{
  const res=await handleCards(new Request('https://shadowlog.example/api/cards?ids=12345678'),async()=>{throw Error('private upstream detail');});
  assert.equal(res.status,502);
  const body=await res.json();
  assert.match(body.error,/公式カード情報を取得できませんでした/);
  assert.doesNotMatch(body.error,/private upstream detail/);
});

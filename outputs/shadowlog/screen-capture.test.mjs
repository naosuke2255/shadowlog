import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import zlib from 'node:zlib';
import {mountDiscovery,stopDiscovery} from './deck-discovery.js';import {empty,validate} from './core.js';
test('画面読み取り: 実QR画素→40枚自動保存・停止で映像トラック解放',async()=>{
 const old={document:globalThis.document,navigator:Object.getOwnPropertyDescriptor(globalThis,'navigator'),jsQR:globalThis.jsQR,setTimeout:globalThis.setTimeout,clearTimeout:globalThis.clearTimeout};
 const fixture=JSON.parse(fs.readFileSync(new URL('./test-fixtures/official-qr.json',import.meta.url))),pixels=new Uint8ClampedArray(zlib.inflateSync(Buffer.from(fixture.rgba,'base64'))),qr={};vm.runInNewContext(fs.readFileSync(new URL('./vendor/jsQR.js',import.meta.url),'utf8'),qr);
 let stopped=0,db=empty(),closed=false;const nodes=new Map(),node=()=>({textContent:'',hidden:false,disabled:false,children:[],prepend(p){this.children.unshift(p)},remove(){},get lastChild(){return this.children.at(-1)}});
 const root={set innerHTML(v){},querySelector(s){if(!nodes.has(s))nodes.set(s,node());return nodes.get(s)}};
 const video=root.querySelector('#capture-preview');Object.assign(video,{readyState:2,videoWidth:320,videoHeight:320,play:async()=>{}});
 const track={stop(){stopped++},addEventListener(){}};const stream={getTracks:()=>[track],getVideoTracks:()=>[track]};
 try{globalThis.document={createElement:tag=>tag==='canvas'?{getContext:()=>({drawImage(){},getImageData:()=>({data:pixels,width:320,height:320})})}:node()};Object.defineProperty(globalThis,'navigator',{configurable:true,value:{mediaDevices:{getDisplayMedia:async()=>stream}}});globalThis.jsQR=qr.jsQR;globalThis.setTimeout=()=>1;globalThis.clearTimeout=()=>{};
 mountDiscovery(root,{getDB:()=>db,change:fn=>{const next=structuredClone(db);fn(next);db=validate(next)},toast:()=>{}});await root.querySelector('#capture-start').onclick();await Promise.resolve();assert.equal(db.comparison.length,1);assert.equal(db.comparison[0].cards.reduce((n,c)=>n+c.count,0),40);await root.querySelector('#capture-once').onclick();assert.equal(db.comparison.length,1);root.querySelector('#capture-stop').onclick();assert.ok(stopped>0);assert.equal(video.srcObject,null);assert.equal(root.querySelector('#capture-stop').disabled,true);
 }finally{stopDiscovery();globalThis.document=old.document;Object.defineProperty(globalThis,'navigator',old.navigator);globalThis.jsQR=old.jsQR;globalThis.setTimeout=old.setTimeout;globalThis.clearTimeout=old.clearTimeout}
});

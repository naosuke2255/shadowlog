import test from 'node:test';
import assert from 'node:assert/strict';
import {demo,validate,summary,mulligan,merge} from './core.js';
test('簡易記録: 未記録を平均・マリガンから除外し勝率には含める',()=>{const db=demo(),m={...structuredClone(db.matches[0]),id:'mini-test',quick:true,turn:null,hand:[],win:true};const old=mulligan(db.matches);db.matches.push(m);validate(db);assert.deepEqual(mulligan(db.matches),old);const s=summary([m,{...m,id:'b',turn:10,win:false}]);assert.equal(s.all.n,2);assert.equal(s.all.p,50);assert.equal(s.avg,10);assert.equal(s.turnN,1);assert.equal(summary([m]).avg,null);assert.equal(merge(db,JSON.parse(JSON.stringify(db))).matches.length,121);});
test('簡易記録でも不正なターン・初手を拒否する',()=>{for(const fields of [{turn:0},{turn:100},{turn:1.5},{hand:[{card:'偽',keep:true,redraw:''}]}]){const db=demo();db.matches.push({...db.matches[0],id:'mini',quick:true,turn:null,hand:[],...fields});assert.throws(()=>validate(db));}});

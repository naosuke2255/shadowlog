import {writeFile} from 'node:fs/promises';
import {demo} from './core.js';
await writeFile(new URL('./demo-120.json',import.meta.url),JSON.stringify(demo(),null,2));
console.log('demo-120.json: 120試合を書き出しました');

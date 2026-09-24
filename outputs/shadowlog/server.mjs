import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {getCards} from './card-service.mjs';
const root=fileURLToPath(new URL('.',import.meta.url));
http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/api/cards'){
    res.setHeader('Content-Type','application/json; charset=utf-8');
    if(req.method!=='GET'){res.writeHead(405);res.end(JSON.stringify({error:'GET only'}));return}
    try{const ids=(url.searchParams.get('ids')||'').split(',');if(ids.length>40||ids.some(id=>!/^\d{8}$/.test(id))){res.writeHead(400);res.end(JSON.stringify({error:'カードIDが不正です。'}));return}res.end(JSON.stringify({cards:await getCards(ids)}))}catch{res.writeHead(502);res.end(JSON.stringify({error:'公式カード情報を取得できませんでした。接続を確認して再試行してください。保存済みシートはオフラインで使えます。'}))}return;
  }
  try{const name=decodeURIComponent(url.pathname),file=path.resolve(root,'.'+(name==='/'?'/index.html':name));if(!file.startsWith(root)||!['.html','.css','.js'].includes(path.extname(file))){res.writeHead(404);res.end();return}res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript'})[path.extname(file)]);res.end(await readFile(file))}catch{res.writeHead(404);res.end('Not found')}
}).listen(4173,'127.0.0.1',()=>console.log('Shadowlog: http://127.0.0.1:4173'));

import {getCards} from '../card-service.mjs';

const INVALID_IDS='カードIDが不正です。';
const FETCH_ERROR='公式カード情報を取得できませんでした。接続を確認して再試行してください。保存済みシートはオフラインで使えます。';

function send(status,body,headers={}){
  return new Response(JSON.stringify(body),{
    status,
    headers:{'Content-Type':'application/json; charset=utf-8',...headers}
  });
}

export async function handleCards(request,loadCards=getCards){
  if(request.method!=='GET')return send(405,{error:'GET only'},{Allow:'GET'});

  const raw=new URL(request.url).searchParams.get('ids')??'';
  const ids=raw.split(',');
  if(ids.length>40||ids.some(id=>!/^\d{8}$/.test(id)))return send(400,{error:INVALID_IDS});

  try{
    return send(200,{cards:await loadCards(ids)});
  }catch{
    return send(502,{error:FETCH_ERROR});
  }
}

export default {fetch:request=>handleCards(request)};

// Candidate names researched 2026-09-19. Historical/Unlimited types are included;
// this is a recording vocabulary, not a ranking or format legality list.
// https://game8.jp/shadowverse-beyond/704614
// https://game8.jp/shadowverse-beyond/714891
// https://gamewith.jp/shadowverse-wb/497197
export const DECK_TYPES={
 'エルフ':['コンボエルフ','進化エルフ','テンポエルフ','リノエルフ','薔薇エルフ'],
 'ロイヤル':['連携ロイヤル','海賊ロイヤル','エンハンスロイヤル','ミッドレンジロイヤル'],
 'ウィッチ':['魔手ウィッチ','実験体ウィッチ','スペルウィッチ','秘術ウィッチ','セフィーウィッチ'],
 'ドラゴン':['ランプドラゴン','フェイスドラゴン'],
 'ナイトメア':['ミッドレンジナイトメア','ラストワードナイトメア','アグロナイトメア','コントロールナイトメア','ミルティオナイトメア'],
 'ビショップ':['進化ビショップ','アミュレットビショップ','クレストビショップ','守護ビショップ','クキシロビショップ','コントロールビショップ'],
 'ネメシス':['AFネメシス','破壊ネメシス','進化ネメシス','人形ネメシス','OTK人形ネメシス','ハイランダーネメシス']
};
export function deckTypeNames(db,c){return [...new Set([...(DECK_TYPES[c]||[]),...(db.archetypes?.[c]||[]),...db.matches.filter(m=>m.opponent===c&&m.opponentStyle).map(m=>m.opponentStyle)])];}

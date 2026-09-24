# SHADOWLOG

Shadowverse: Worlds Beyond の個人用・非公式対戦分析アプリです。日本語・ダークテーマで、データは利用するブラウザーの localStorage に保存します。

## 起動

Node.js 24 以降を用意し、次を実行します。追加パッケージのインストールは不要です。

```sh
cd outputs/shadowlog
node server.mjs
```

ブラウザーで http://127.0.0.1:4173/ を開いてください。Windowsでは `outputs/shadowlog/start.cmd` でも起動できます。使用中はサーバーを起動したままにしてください。

## 機能

- 対戦記録・ミニモード・キープカードの記録
- 勝率、先後、対面とデッキタイプ、マリガン、デッキバージョンの分析
- 40枚のデッキ登録、公式共有URL・QR画像の取り込み、デッキ差分比較
- 対面攻略メモ、対戦中の残りカード管理
- X画面のQR読取とChrome／Edge向け収集拡張
- JSONバックアップ・復元、対戦CSV出力

詳細は [アプリREADME](outputs/shadowlog/README.md)、[拡張README](outputs/shadowlog-x-extension/README.md) を参照してください。

## データ保存

対戦記録はGitHubに送信しません。同じブラウザー・同じURLで利用し、「データ・バックアップ」から定期的にJSONを保存してください。GitHubへのソース保存は対戦データのバックアップにはなりません。同梱の `demo-120.json` は架空の検証データです。

## テスト

Node.js 24以降で `outputs/shadowlog` に移動し、`npm test` を実行します。

## 第三者コンテンツ

本アプリは非公式です。カード名などのゲーム関連情報の権利は各権利者に帰属します。QR読取に同梱するjsQRのライセンスは各 `vendor/jsQR.LICENSE` を参照してください。

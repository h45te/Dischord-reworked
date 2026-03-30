# Dischord-Reworked

## 説明

Raclette氏制作のDischordのforkです。以下の変更がされています
- ES2024, discord.js(v14), @discordjs/voiceへの対応
- TOKENの参照先を.envに変更

## 動作要件

- Node.js

- FFmpeg (PATH通し必須)

## 使い方

### 導入

1. `.env.example`をコピーし`.env`を作成

1. `TOKEN`にBotのトークンを記述

1. ターミナルで以下を実行

    1. `npm install`

    1. `npm run build`
    
    1. `npm start`

1. ピコカキコ、楽しいよ!

### Botの使い方

`dc!help`を送信することでヘルプが表示されます。

## License

フォーク元は CC0-1.0 License の基で公開されたリポジトリをベースにしています。  
本フォークは MIT License の基で公開されています。  
[MIT](https://mit-license.org)  
[CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/deed)
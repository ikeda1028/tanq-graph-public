# TANQ Project Tool

TANQ Project Toolは、探究プロジェクトを進めるための外部作業アプリです。

TANQ Graphは証跡・ポートフォリオ・認証基盤として使い、このツールは問い、仮説、ステークホルダー、マイルストーン、資料、フィードバックを作る作業場として分離します。

## 役割分担

- TANQ Project Tool: プロジェクトを進める、資料を作る、先生・上司・チームからフィードバックを受ける。
- TANQ Graph: その結果を`tanq_projects`、`tanq_activity_logs`、`tanq_materials`、`tanq_feedback`へ保存し、TANQ Passport / Proofolio / Proofolio Encoreへ接続する。

## Firestore接続

`firebase-config.js`にFirebase Web configを入れると、TANQ Graphと同じFirestoreに保存します。

使うコレクション:

- `tanq_question_seeds`
- `tanq_projects`
- `tanq_activity_logs`
- `tanq_materials`
- `tanq_feedback`

## Google Maps接続

Kids版の「見せる」でGoogleマップに記録する場合は、`google-maps-config.js`の`apiKey`にGoogle Maps PlatformのAPIキーを入れます。

最初に有効化するAPI:

- Maps Embed API

推奨するキー制限:

- API制限: Maps Embed APIのみ
- HTTPリファラー制限: `https://ikeda1028.github.io/*`、`http://localhost/*`、`http://127.0.0.1/*`

APIキーが空でも、通常のGoogleマップ埋め込みURLにフォールバックします。

## 外部探究ツール接続

最初の実装では、ツールごとに3段階で扱います。

- API接続候補: Google Classroom、Google Drive / Docs、Teams Education、Canvas、Moodle、Miro / FigJam、Notion。
- URL・エクスポート取り込み: ロイロノート、Classi、Padlet、Seesaw / Toddle。
- 手動登録: その他の探究ツール、学校独自システム、紙資料の転記。

取り込んだ内容は、TANQ Project Tool内では問い、作業ログ、資料、フィードバックとして扱い、TANQ Graphへは`Question`、`Project`、`Activity`、`Material`、`Feedback`の形式で渡します。

## 問いからプロジェクトへ

プロジェクト化する前の段階として、純粋な問いを`Question Seed`として保存します。

- まだ仮説や解決策を決めない。
- きっかけ、領域、気になる理由を残す。
- 育った問いだけをプロジェクトへ昇格する。
- TANQ Graphには、問いが生まれた履歴として`tanq_question_seeds`と`tanq_activity_logs`へ保存する。

## ローカル確認

`index.html`をブラウザで開けば動きます。Firebase Rulesが未設定の場合も、ブラウザ内の`localStorage`に保存されます。

# TANQ Project Tool

TANQ Project Toolは、探究プロジェクトを進めるための外部作業アプリです。

TANQ Graphは証跡・ポートフォリオ・認証基盤として使い、このツールは問い、仮説、ステークホルダー、マイルストーン、資料、フィードバックを作る作業場として分離します。

入口はTANQ Graph本体だけに限定しません。Toolからゲスト利用を開始し、記録を残したいタイミングでTANQ IDを作成・既存IDに接続し、あとからTANQ Graphへ統合できます。

## 役割分担

- TANQ Project Tool: プロジェクトを進める、資料を作る、先生・上司・チームからフィードバックを受ける。
- TANQ Pass Kids Tool: 低年齢向けに、写真、音声、場所、地図から「ふしぎ」を記録する。
- TANQ Process Tool: PPM(Project Process Management)として、工程、役割、次の一手、実行ログを独立して管理する。
- TANQ Graph: その結果を`tanq_projects`、`tanq_activity_logs`、`tanq_materials`、`tanq_feedback`へ保存し、TANQ Passport / Proofolio / Proofolio Encoreへ接続する。

KidsはProject Tool内のタブではなく、独立した`kids-tool/`で開きます。ログインプロフィールで12歳以下の年齢が登録された場合は、TANQ Pass Kids Toolへ自動的に振り分けます。

Kids ToolにはAIコーチを置きます。APIキーはHTMLに入れず、必要に応じてサーバー側の`/api/kids-coach`のようなAI APIエンドポイントを登録します。エンドポイント未設定時は、写真名、問い、場所、次の一手から内蔵AIコーチが問いかけを生成します。

AIコーチは`coach-admin/`で管理します。Kids向けのMite Coach、中高生向けのQuest Mentor、社会人向けのValue Architect、Proofolio Encore向けのEncore Navigatorを分け、キャラクター、構造的問い、生成的問い、安全境界、API接続先を調整します。

ProcessはProject Tool内のタブではなく、独立したコンテンツとして`process-tool/`で開きます。同じ保存領域を読むため、Project Toolで作ったプロジェクトを引き継いだまま工程だけを扱えます。

## Firestore接続

`firebase-config.js`にFirebase Web configを入れると、TANQ Graphと同じFirestoreに保存します。

使うコレクション:

- `tanq_people`
- `tanq_ai_consultations`
- `tanq_question_seeds`
- `tanq_projects`
- `tanq_activity_logs`
- `tanq_materials`
- `tanq_feedback`
- `tanq_innovation_seeds`
- `tanq_formation_candidates`

ChatGPTログは、全文ログではなくAI相談ログとして保存します。TANQ IDがある場合は`tanq_id`に、未登録の場合は`guest_session_id`に紐づけ、あとでTANQ IDを作成した時に同じログを本人IDへ移行します。

## TANQ Innovation Engine

Innovation Engineは、問い、活動ログ、資料、フィードバック、AI相談ログを束ねて`Innovation Seed`を生成します。

- 探究ログから、社会性・市場性・実現性・教育性・研究性をスコア化する。
- AI相談ログをL1の相談資産から、資料化・フィードバック・外部レビューへ信頼レベル変換する。
- PPM、牧山式インテリジェンス、Proofolio、TANQ Graphなどの役割を使ってチーム形成候補を出す。
- 事業組成候補として、地域PPP実証、インテリジェンス調査、探究プログラム化のルートを提示する。

生成したSeedは`tanq_innovation_seeds`へ、チーム形成候補は`tanq_formation_candidates`へ保存します。

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

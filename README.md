# TANQ Graph Public Demo

TANQ Graphは、探究プロジェクト、資格・証明、プロジェクト資料、AI要約、外部ツール出力を接続するポートフォリオグラフのプロトタイプです。

この公開デモでは、4つのインターフェイスが同じTANQ Graph Coreを共有します。

- TANQ Pass Kids: 幼児・小学生向け
- TANQ Passport: 中高生向け
- Proofolio: 社会人向け
- Proofolio Encore: 45歳以降の役割・価値の再設計向け

## 試せること

- `project-tool/`で、TANQ Project ToolのKids向け写真・問い・音声入力・Googleマップ記録のプロトタイプを試せます。
- 探究GO、PPM、牧山インテリジェンス、人的資本価値測定、DAO貢献評価、Google Drive、資格ツールなどの接続候補を選択できます。
- 探究プロジェクトの作成・アーカイブができます。
- ツールデータ、ローカルファイル、外部リンク、貼り付け本文からプロジェクト資料を追加できます。
- 年齢とプロフィールに応じてUIを切り替えられます。
- 最初の入口で、ポートフォリオ利用者と登録団体を切り分けられます。
- Firebase / Firestoreへ自動接続し、登録データを保存・照合できます。
- デモ用のProject API Bundleを生成できます。
- デモ用APIキーと登録団体ログインコードを発行できます。

## 公開デモとしての安全性

このフォルダは、静的なGitHub Pagesデモとして公開できる構成です。

- 実APIキーは不要です。
- バックエンドサーバーは不要です。
- 実Google Drive OAuth接続は行いません。
- Firebase設定がない場合、データはブラウザ内の`localStorage`に保存されます。
- Firebase設定がある場合、ログイン、プロジェクト、資料、証明、APIキーのメタデータをFirestoreにも保存します。
- デモAPIキーはUI検証用です。
- Firebase configを`firebase-config.js`に入れると、どの端末からアクセスしても同じFirestoreを使います。

本番ではAPIキーを平文保存しないでください。保存するのはハッシュ化した秘密情報だけにし、OAuthまたはSSO、スコープ権限、アクセスログ、公開デモデータと個人ポートフォリオデータの分離が必要です。

## Firebase

Firebase ConsoleでWebアプリを登録し、表示される`firebaseConfig`を`firebase-config.js`に設定してください。公開ページはこのファイルを読み込み、全端末で同じFirestoreへ自動接続します。

Firestoreには次のコレクションを使います。

- `tanq_people`
- `tanq_organizations`
- `tanq_projects`
- `tanq_activity_logs`
- `tanq_materials`
- `tanq_feedback`
- `tanq_credentials`
- `tanq_api_keys`

蓄積方針:

- `tanq_people` / `tanq_organizations`: 最小限のID、ログインコード、UI振り分け、登録状態。
- `tanq_projects`: 探究テーマ、問い、対象UI、アーカイブ状態、外部出力先。
- `tanq_activity_logs`: 探究GO、PPM、DAO評価などから入る活動・意思決定・評価ログ。
- `tanq_materials`: URL、ローカルファイルのメタデータ、貼り付けたGoogle Docs本文など資料として扱う証跡。
- `tanq_feedback`: 先生、上司、同僚、外部レビューなどの評価・査読ログ。
- `tanq_credentials`: 資格、単位、Open Badge、VC/Web3証明などの証明データ。
- `tanq_api_keys`: APIキーの名前、用途、スコープ、マスク値。キー全文はFirestoreに保存しません。

デモ用Firestore Rules:

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /tanq_people/{docId} {
      allow read, write: if true;
    }

    match /tanq_organizations/{docId} {
      allow read, write: if true;
    }

    match /tanq_projects/{docId} {
      allow read, write: if true;
    }

    match /tanq_activity_logs/{docId} {
      allow read, write: if true;
    }

    match /tanq_materials/{docId} {
      allow read, write: if true;
    }

    match /tanq_feedback/{docId} {
      allow read, write: if true;
    }

    match /tanq_credentials/{docId} {
      allow read, write: if true;
    }

    match /tanq_api_keys/{docId} {
      allow read, write: if true;
    }
  }
}
```

公開デモ用の最小実装なので、本番ではFirebase Authentication、App Check、Firestore Security Rules、管理者承認フローを追加してください。

## GitHub Pages

公開手順:

1. GitHubで`tanq-graph-public`などのリポジトリを作成します。
2. このフォルダの中身をアップロードします。
3. GitHubの`Settings > Pages`を開きます。
4. Sourceをmainブランチのrootに設定します。
5. 発行されたGitHub Pages URLを開きます。

公開URL:

- TANQ Graph: `https://ikeda1028.github.io/tanq-graph-public/`
- TANQ Project Tool: `https://ikeda1028.github.io/tanq-graph-public/project-tool/`

Google Maps PlatformのAPIキーを使う場合は、API制限を`Maps Embed API`、ウェブサイト制限を`https://ikeda1028.github.io/*`に設定してください。

## ローカル確認

`index.html`をブラウザで直接開くか、任意の静的ファイルサーバーでこのフォルダを配信してください。

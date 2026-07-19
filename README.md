# TANQ Graph Public Demo

TANQ Graphは、探究プロジェクト、資格・証明、プロジェクト資料、AI要約、外部ツール出力を接続するポートフォリオグラフのプロトタイプです。

この公開デモでは、4つのインターフェイスが同じTANQ Graph Coreを共有します。

- TANQ Pass Kids: 幼児・小学生向け
- TANQ Passport: 中高生向け
- Proofolio: 社会人向け
- Proofolio Encore: 45歳以降の役割・価値の再設計向け

## 試せること

- 探究GO、PPM、牧山インテリジェンス、人的資本価値測定、DAO貢献評価、Google Drive、資格ツールなどの接続候補を選択できます。
- 探究プロジェクトの作成・アーカイブができます。
- ツールデータ、ローカルファイル、外部リンク、貼り付け本文からプロジェクト資料を追加できます。
- 年齢とプロフィールに応じてUIを切り替えられます。
- 最初の入口で、ポートフォリオ利用者と登録団体を切り分けられます。
- Firebase configを貼り付けると、デモDBに加えてFirestoreへ登録データを保存・照合できます。
- デモ用のProject API Bundleを生成できます。
- デモ用APIキーと登録団体ログインコードを発行できます。

## 公開デモとしての安全性

このフォルダは、静的なGitHub Pagesデモとして公開できる構成です。

- 実APIキーは不要です。
- バックエンドサーバーは不要です。
- 実Google Drive OAuth接続は行いません。
- データはブラウザ内の`localStorage`にだけ保存されます。
- デモAPIキーはUI検証用です。
- Firebase configを`firebase-config.js`に入れると、どの端末からアクセスしても同じFirestoreを使います。

本番ではAPIキーを平文保存しないでください。保存するのはハッシュ化した秘密情報だけにし、OAuthまたはSSO、スコープ権限、アクセスログ、公開デモデータと個人ポートフォリオデータの分離が必要です。

## Firebase

Firebase ConsoleでWebアプリを登録し、表示される`firebaseConfig`を`firebase-config.js`に設定してください。入口画面に貼り付ける方法も使えますが、その場合はそのブラウザだけの接続になります。

Firestoreには次のコレクションを使います。

- `tanq_people`
- `tanq_organizations`

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

## ローカル確認

`index.html`をブラウザで直接開くか、任意の静的ファイルサーバーでこのフォルダを配信してください。

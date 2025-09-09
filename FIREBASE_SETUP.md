# Firebase 設定手順

## 1. Firebase プロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 「プロジェクトを作成」をクリック
3. プロジェクト名を入力（例：book-replay-app）
4. Google Analytics は任意で有効化
5. プロジェクトを作成

## 2. Firestore データベースの設定

1. プロジェクトダッシュボードで「Firestore Database」をクリック
2. 「データベースを作成」をクリック
3. セキュリティルールを選択：
   - **テストモード**（開発用）：誰でも読み書き可能
   - **本番モード**（推奨）：認証が必要
4. ロケーションを選択（asia-northeast1 推奨）

## 3. Web アプリの設定

1. プロジェクトダッシュボードで「</>」アイコンをクリック
2. アプリのニックネームを入力（例：book-replay-web）
3. 「Firebase SDK の設定」で「設定」をクリック
4. 設定オブジェクトをコピー

## 4. 設定ファイルの更新

`src/firebase.js` ファイルの設定を更新：

```javascript
const firebaseConfig = {
  apiKey: "あなたのAPIキー",
  authDomain: "あなたのプロジェクト.firebaseapp.com",
  projectId: "あなたのプロジェクトID",
  storageBucket: "あなたのプロジェクト.appspot.com",
  messagingSenderId: "あなたのSenderID",
  appId: "あなたのAppID",
};
```

## 5. セキュリティルールの設定（本番用）

Firestore の「ルール」タブで以下を設定：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /books/{document} {
      allow read, write: if true; // テスト用（誰でもアクセス可能）
      // 本番用は認証が必要：
      // allow read, write: if request.auth != null;
    }
  }
}
```

## 6. アプリの起動

```bash
npm run dev
```

## トラブルシューティング

### エラー: "Firebase: No Firebase App '[DEFAULT]' has been created"

- `firebase.js` の設定が正しくない
- 設定オブジェクトを再確認

### エラー: "Missing or insufficient permissions"

- Firestore のセキュリティルールを確認
- テストモードに設定されているか確認

### データが表示されない

- ブラウザの開発者ツールでコンソールエラーを確認
- ネットワーク接続を確認

## 次のステップ

- 認証機能の追加
- ユーザー別データ管理
- データのバックアップ設定

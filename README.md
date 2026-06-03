# Markdown Viewer for Drive

Google ドライブ上の `.md` ファイルを**整形表示**する Google Workspace アドオン（Apps Script 製）。

- **サイドパネル**（CardService）: 軽量な生テキストプレビュー + 「全画面で整形表示」ボタン
- **全画面ビューア**（HtmlService + marked.js + DOMPurify）: GitHub 風に整形された Markdown 表示
- OAuth スコープは `drive.file` のみ（**CASA 年次審査を回避**）

> 📘 **構築手順・ハマりポイント全集・Marketplace 公開フロー**は [`docs/SETUP-GUIDE.md`](docs/SETUP-GUIDE.md) に実態ベースでまとめてある。
> 同種のアドオンを作る際は必ずこちらを参照（403 ループ / 標準 GCP 切替 / urlFetchWhitelist / WEBAPP_URL の罠を網羅）。

## MVP の目的

Drive で `.md` を選ぶ → サイドパネルにプレビュー → 「全画面で表示」で整形描画。
最初の検証ポイント（R1）: **`drive.file` 単独で `onItemsSelectedTrigger` が発火するか**を実機確認する。

## ファイル構成

```
gdrive-md-viewer/
├── src/
│   ├── appsscript.json   # マニフェスト（スコープ・アドオントリガー）
│   ├── Config.gs         # 定数
│   ├── FileService.gs    # Drive ファイル読み取り
│   ├── CardBuilder.gs    # サイドパネル UI（CardService）
│   ├── DriveTrigger.gs   # トリガーハンドラ（onDriveItemsSelected ほか）
│   ├── Code.gs           # Web アプリ（全画面ビューア doGet）
│   ├── Viewer.html       # 全画面ビューア本体
│   └── Styles.html       # GitHub 風 CSS
├── .claspignore
├── .clasp.json           # clasp create で生成（rootDir を src に設定）
└── README.md
```

## セットアップ（ローカル開発: clasp）

前提: clasp 3.x インストール済み（`clasp -v` で確認）、Node >= 22。

1. **ログイン（手元のブラウザ認証が必要）**

   ```
   clasp login
   ```

2. **スタンドアロンプロジェクト作成**

   ```
   clasp create --title "Markdown Viewer for Drive" --type standalone --rootDir src
   ```

   生成された `.clasp.json` の `rootDir` が `src` を指していることを確認。

3. **コードをアップロード**

   ```
   clasp push
   ```

4. **アドオンのテストデプロイ**

   - `clasp open-script` でエディタを開く
   - 「デプロイ」→「テストデプロイ」→ アドオンとしてインストール
   - Drive を開き、`.md` ファイルを選択してサイドパネルが出るか確認（R1 検証）

## 注意

- `.clasprc.json`（認証トークン）は**絶対にコミットしない**（`.gitignore` 済み）。
- 全画面ビューアは marked.js / DOMPurify を jsDelivr CDN から読み込む。

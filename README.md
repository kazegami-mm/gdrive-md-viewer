# Markdown Viewer for Drive

Google ドライブ上の `.md` ファイルを**整形表示**する Google Workspace アドオン（Apps Script 製）。

- **サイドパネル**（CardService）: Markdown を疑似整形したプレビュー + 「全画面で整形表示」ボタン
- **全画面ビューア**（HtmlService + marked.js + DOMPurify）: GitHub 風に整形された Markdown 表示
- **全画面エディタ**（EasyMDE / MIT）: 表示 / 編集 / 分割の 3 モード、ショートカット（Ctrl+B/I/H/K/L、Ctrl+S 保存）、Drive へ上書き保存
- OAuth スコープは `drive.file` ほか非機密のみ（**CASA 年次審査を回避**。`drive.file` は読み書き両対応なので保存も追加スコープ不要）

> 📘 **構築手順・ハマりポイント全集・Marketplace 公開フロー**は [`docs/SETUP-GUIDE.md`](docs/SETUP-GUIDE.md) に実態ベースでまとめてある。
> 同種のアドオンを作る際は必ずこちらを参照（403 ループ / 標準 GCP 切替 / urlFetchWhitelist / WEBAPP_URL の罠を網羅）。

### 公開関連ドキュメント（docs/）

| ファイル | 用途 |
|----------|------|
| [`docs/SETUP-GUIDE.md`](docs/SETUP-GUIDE.md) | 構築手順・ハマりポイント全集 |
| [`docs/PUBLISH-CHECKLIST.md`](docs/PUBLISH-CHECKLIST.md) | 全世界一般公開のチェックリスト（OAuth 本番化〜審査提出） |
| [`docs/PRIVACY-POLICY.md`](docs/PRIVACY-POLICY.md) | プライバシーポリシー草案（日英）。公開 URL 化が必要 |
| [`docs/TERMS-OF-SERVICE.md`](docs/TERMS-OF-SERVICE.md) | 利用規約草案（日英）。公開 URL 化が必要 |
| [`docs/MARKETPLACE-LISTING.md`](docs/MARKETPLACE-LISTING.md) | ストア掲載文・アイコン/スクショ仕様 |
| [`docs/SCREENSHOT-GUIDE.md`](docs/SCREENSHOT-GUIDE.md) | スクリーンショット撮影手順（5 シーン・整形・命名） |
| [`docs/BROWSER-CLAUDE-TEST-PROMPT.md`](docs/BROWSER-CLAUDE-TEST-PROMPT.md) | ブラウザ操作 Claude に実機テストを代行させるプロンプト（T1〜T10） |
| [`docs/BROWSER-CLAUDE-SCREENSHOT-PROMPT.md`](docs/BROWSER-CLAUDE-SCREENSHOT-PROMPT.md) | ブラウザ操作 Claude にスクショ撮影を代行させるプロンプト（5 シーン） |

> 🔒 **データ保護**: 保存時に競合検出（楽観ロック）・保存後 md5 検証・編集権限/MIME 検証を行い、
> 既存ファイルを黙って壊さない設計。CDN 障害時はプレーン textarea にフォールバックして編集・保存を維持。

## MVP の目的

Drive で `.md` を選ぶ → サイドパネルにプレビュー → 「全画面で表示」で整形描画。
最初の検証ポイント（R1）: **`drive.file` 単独で `onItemsSelectedTrigger` が発火するか**を実機確認する。

## ファイル構成

```
gdrive-md-viewer/
├── src/
│   ├── appsscript.json   # マニフェスト（スコープ・アドオントリガー）
│   ├── Config.gs         # 定数
│   ├── FileService.gs    # Drive ファイル読み取り / 書き込み（保存）
│   ├── CardBuilder.gs    # サイドパネル UI（CardService）
│   ├── MarkdownToCard.gs # Markdown -> CardService ウィジェット（疑似整形）
│   ├── DriveTrigger.gs   # トリガーハンドラ（onDriveItemsSelected ほか）
│   ├── Code.gs           # Web アプリ（全画面ビューア / エディタ doGet）
│   ├── Viewer.html       # 全画面ビューア / エディタ本体（EasyMDE）
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

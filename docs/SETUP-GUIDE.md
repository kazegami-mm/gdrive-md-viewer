# Markdown Viewer for Drive — 構築手順書 兼 振り返り備忘録

> 2026-06-03 に MVP を完動させた**実態ベース**の手順書。
> Google Workspace アドオン（Apps Script 製）を「個人アカウントでローカル開発（clasp）→ 実機検証」する一連の流れと、当日ハマった全ての壁を記録する。
> 公式ドキュメント順ではなく「**実際にやったらこの順で詰まった**」という実践順で並べてある。

---

## 0. このアドオンの設計（全体像）

Drive 上の `.md` を**整形表示**するアドオン。2つの表示面を持つ。

| 機能 | 実装 | 動作に必要なもの |
|------|------|-----------------|
| **サイドパネル**（軽量プレビュー） | CardService | アドオンとしてのインストール |
| **全画面ビューア**（marked.js 整形） | HtmlService + marked.js + DOMPurify（jsDelivr CDN） | **ウェブアプリのデプロイ** |

### 設計の肝（CASA 回避）

OAuth スコープを**すべて非機密（non-restricted）に限定**し、年次の CASA セキュリティ監査（有償・高負荷）を回避する。これが最重要のアーキ制約。

```
drive.file                          ... ユーザーが選択/許可したファイルのみ（per-file）
drive.addons.metadata.readonly      ... onItemsSelectedTrigger 発火に必須
script.external_request             ... UrlFetchApp に必須
script.container.ui                 ... 全画面表示に必須
```

`drive` / `drive.readonly` のような**広いスコープを一切使わない**のが設計の前提。
→ そのため**ファイル本文の読み取りに DriveApp / Advanced Drive Service を使えない**（広いスコープを要求する）。
→ 代わりに **UrlFetchApp で Drive API v3 を OAuth トークン直叩き**する（`?alt=media`）。この選択が後述の 403/デプロイ問題の遠因になる。

### ファイル構成

```
src/
├── appsscript.json   # マニフェスト（スコープ / アドオントリガー / urlFetchWhitelist）
├── Config.gs         # 定数（拡張子・サイズ上限）
├── FileService.gs    # Drive API v3 直叩きで .md 本文取得（401/403/404 分岐）
├── CardBuilder.gs    # サイドパネル UI（CardService）+ 全画面ボタン
├── DriveTrigger.gs   # トリガー（onDriveItemsSelected / onRequestFileScope）
├── Code.gs           # ウェブアプリ（全画面ビューア doGet）
├── Viewer.html       # 全画面ビューア本体（marked.parse → DOMPurify.sanitize）
└── Styles.html       # GitHub 風 CSS
```

---

## 1. ローカル開発セットアップ（clasp）

前提: clasp 3.x（`clasp -v`）、Node >= 22。

1. **ログイン（手元のブラウザ認証 = 人間の手動操作。CLI だけでは完結しない）**
   ```
   clasp login
   ```
   ⚠️ **アカウント取り違えに注意**。本プロジェクトは**個人 kai.azegami@gmail.com**。
   会社（gleamorb）アカウントで作ると後で GCP プロジェクトにアクセスできず詰む。
   `clasp show-authorized-user` でログイン中アカウントを必ず確認する。

2. **スタンドアロン作成**
   ```
   clasp create --title "Markdown Viewer for Drive" --type standalone --rootDir src
   ```
   ⚠️ `clasp create` は **appsscript.json を America/New_York のデフォルトで上書きする**。
   作成後にマニフェスト（タイムゾーン・スコープ・addOns）を書き直すこと。

3. **アップロード**
   ```
   clasp push --force
   ```

4. **エディタを開く**
   ```
   clasp open-script
   ```
   （ブラウザが自動で開かないことがある。URL が出るのでそれを開く）

---

## 2. ハマりポイント全集（当日詰まった順）

> ここが本備忘録の中核。同じアドオンを作るとほぼ同じ順で踏む。

### 壁① `drive.file` 単独では選択トリガーが発火しない
- **症状**: `.md` を選んでもサイドパネルが反応しない。「必要な権限: drive.addons.metadata.readonly」。
- **対処**: `drive.addons.metadata.readonly` を oauthScopes に追加（非機密＝CASA 維持）。

### 壁② 「アクセスを許可」ボタンが無反応
- **症状**: ボタンを押しても何も起きない。
- **真因**: Editor アドオン用 API（`newEditorFileScopeActionResponseBuilder().requestFileScopeForActiveDocument()`）を使っていた。
- **対処**: Drive アドオン用 API へ。
  ```javascript
  CardService.newDriveItemsSelectedActionResponseBuilder()
    .requestFileScope(fileId)   // fileId を setParameters でボタンに持たせて渡す
    .build();
  ```

### 壁③ DriveApp が広いスコープを要求
- **症状**: 「DriveApp.getFileById を呼び出せません。必要な権限: drive.readonly || drive」。
- **真因**: `DriveApp` / `Drive.Files`（Advanced Service）は広いスコープを強制する。CASA 回避と両立しない。
- **対処**: UrlFetchApp + Drive API v3 直叩きに全面変更。`script.external_request` を追加。
  ```
  GET https://www.googleapis.com/drive/v3/files/{id}?fields=name,size,mimeType   # メタ
  GET https://www.googleapis.com/drive/v3/files/{id}?alt=media                   # 本文
  Authorization: Bearer <ScriptApp.getOAuthToken()>
  ```

### 壁④ ★ 403 無限ループ（最大の難所）
- **症状**: 「許可」を押すたびに「アクセス許可が必要です」カードに戻る無限ループ。
- **真因（2段構え）**:
  1. `getSelectedItem_` が `addonHasFileScopePermission === true` に潰していて、
     許可後に `undefined` で返るケースを「未許可」と誤判定（軍師=Codex レビューで指摘）。
     → 生の true/false/undefined をそのまま保持する形に修正。
  2. **本当の真因**: 403 本文が
     `"Google Drive API has not been used in project 162081465186 ... or it is disabled"`。
     = **デフォルト GCP プロジェクトで Drive API が無効**。これを NO_PERMISSION 扱いにしてループしていた。
- **なぜ起きる**: DriveApp / Advanced Service ならデフォルト GCP で Drive API が自動有効になるが、
  **UrlFetchApp 直叩きはその自動有効化の恩恵を受けられない**。
  デフォルト GCP はユーザーから操作できない隠しプロジェクトなので、Cloud Console から API を有効化できない。
- **対処**: → **§3 標準 GCP への切替**（下記）。
- **コード側の防御**: 403/401 本文に
  `'has not been used' / 'is disabled' / 'accessNotConfigured' / 'SERVICE_DISABLED'`
  を含めば `API_DISABLED` を返し、NO_PERMISSION の許可ループに入れない。

### 壁⑤ 404 が返る
- **症状**: GCP 切替後、403 は消えたが「ファイル情報を取得できませんでした (HTTP 404)」。
- **真因**: `drive.file` では**ファイル単位の許可が無いファイルは「存在しない」扱いで 404**。
- **対処**: 404 も NO_PERMISSION 扱いにして許可カードへ誘導。

### 壁⑥ デプロイ時 `urlFetchWhitelist` 必須エラー
- **症状**: ウェブアプリをデプロイしようとすると
  「UrlFetchApp を使用する Google Workspace のアドオンすべてで、明示的な urlFetchWhitelist が必要です」。
- **対処**: マニフェストに叩く URL の**プレフィックス**を登録（末尾 `/` 必須）。
  ```json
  "urlFetchWhitelist": [
    "https://www.googleapis.com/drive/v3/files/"
  ]
  ```

### 壁⑦ 全画面ボタンが「ファイルを開けません」
- **症状**: 全画面ボタンが無効な URL を開く。
- **真因**: `ScriptApp.getService().getUrl()` は**複数デプロイがあると別の（ウェブアプリでない）デプロイの URL を拾う**ことがある。
  実際、正しいウェブアプリ（`AKfycbxNtGph7...`）ではなく古いデプロイ（`AKfycbwU...`）を返していた。
- **対処**: 正しいウェブアプリ `/exec` URL を**スクリプトプロパティ `WEBAPP_URL`** に保存し、コードはそれを最優先で読む。
  getUrl はフォールバックに格下げ。**再デプロイ時はこのプロパティ 1 行だけ更新すればよい**運用。
  ```javascript
  function getViewerBaseUrl_() {
    var prop = PropertiesService.getScriptProperties().getProperty('WEBAPP_URL');
    if (prop) return prop;
    return ScriptApp.getService().getUrl();
  }
  ```

---

## 3. ★ 標準 GCP プロジェクトへの切替（壁④の本対処）

UrlFetchApp 直叩き構成では**必須の工程**。Marketplace 公開時にも結局これが要る。

> 前提（2026 年の罠）: **Cloud Console 利用に 2 段階認証（2SV）が必須**（2026/4/12〜）。
> プロジェクト作成前に「Google Cloud へのアクセスがブロックされました」→「設定に移動」で 2SV を有効化し、60 秒待つ。

1. **標準 GCP プロジェクト作成**
   - https://console.cloud.google.com/projectcreate
   - 例: `markdown-viewer-drive`。作成後**プロジェクト番号（12 桁）**を控える。
   - （本件の実値: 番号 `480634850677` / ID `markdown-viewer-drive-498312`）

2. **Drive API を有効化**
   - https://console.cloud.google.com/apis/library/drive.googleapis.com
   - 作ったプロジェクトを選択した状態で「有効にする」。

3. **OAuth 同意画面を設定**（新 UI = "Google Auth Platform"）
   - 左メニュー **「ブランディング」**: アプリ名 / サポートメール / デベロッパー連絡先メールを入力して保存。
   - 左メニュー **「対象（Audience）」**: 公開ステータス=テスト、**テストユーザーに自分を追加**。
   - ⚠️ **「クライアント（OAuth クライアント ID の作成）」は不要**。Apps Script アドオンはクライアント ID を使わない。間違えて Chrome 拡張等を作らない。

4. **Apps Script に紐づけ**
   - エディタ → ⚙️ プロジェクトの設定 → GCP「プロジェクトを変更」→ **プロジェクト番号**を入力 → 設定。
   - ⚠️ 紐づけ前に OAuth 同意画面が未設定だと赤字で弾かれる（手順 3 が前提）。
   - 成功すると GCP 欄が「デフォルト」→「標準 / `<番号>`」に変わる。
   - ⚠️ **GCP 切替で旧認証は全取り消し** → アドオンの再認証が必要。

---

## 4. ウェブアプリのデプロイ（全画面ビューア用）

サイドパネルはアドオンインストールだけで動くが、**全画面は別途ウェブアプリのデプロイが必要**。

1. エディタ → 「デプロイ」→「新しいデプロイ」
2. 種類 = **ウェブアプリ**
3. 設定:
   - 次のユーザーとして実行: **ウェブアプリにアクセスしているユーザー**
   - アクセスできるユーザー: **自分のみ**（テスト段階。公開時に変更）
4. デプロイ → 認証承認（「確認されていません」警告は 詳細 → 移動）
5. 発行された **ウェブアプリ URL（`/exec`）を控える**。
6. ⚠️ **壁⑦対策**: その正しい `/exec` URL を スクリプトプロパティ `WEBAPP_URL` に登録する。
   - エディタ → ⚙️ 設定 → スクリプトプロパティ → 追加: `WEBAPP_URL` = `https://script.google.com/macros/s/<ウェブアプリのデプロイID>/exec`
   - デプロイ ID は `clasp list-deployments` で確認（`@N - viewer` の行がウェブアプリ）。

---

## 5. 実機検証チェックリスト

- [ ] Drive で `.md` 選択 → サイドパネルにプレビュー（生テキスト）が出る
- [ ] 許可が要る場合「アクセスを許可」→ Google ダイアログ「許可」→ プレビューに進む（ループしない）
- [ ] 「🖥 全画面で整形表示」→ marked.js で見出し・表・コードが GitHub 風に整形表示される
- [ ] 403/404 ループに陥らない（壁④⑤の確認）

---

## 6. Google Workspace Marketplace 公開フロー（今後）

> MVP（テスト段階）では未着手。公開時にやること。

1. **GCP プロジェクト準備（§3 で済）**
   - OAuth 同意画面を**テスト → 本番**へ。一般公開なら User Type = 外部。
   - 非機密スコープのみなので **CASA 監査は不要**（＝本設計の最大の利点）。ただし機密スコープを足したら審査対象になるので**絶対に足さない**。
2. **Google Workspace Marketplace SDK を有効化**
   - GCP コンソールで「Google Workspace Marketplace SDK」を有効化。
3. **アプリ構成（App Configuration）**
   - アプリ名・短い説明・詳細説明・カテゴリ・アイコン（各サイズ）・スクリーンショット・利用規約 / プライバシーポリシー URL を用意。
   - Apps Script の**デプロイ ID（バージョン付きデプロイ）**を紐づける。
4. **ストア掲載情報（Store Listing）**
   - 公開範囲（一般公開 / ドメイン限定）、対応言語、サポート連絡先。
5. **OAuth スコープの申告**
   - 使用スコープ一覧を申告。本件は非機密 4 種のみ。
6. **公開申請 → レビュー**
   - 非機密スコープ構成なら CASA は不要だが、ブランド / アイコン / 説明の整合は審査される。
7. ⚠️ **ウェブアプリのアクセス範囲を見直す**
   - テスト時の「自分のみ」のままだと**他人の全画面ビューアが動かない**。公開時は範囲とエラーハンドリングを再設計する。

---

## 7. 環境メモ（実値）

| 項目 | 値 |
|------|-----|
| アカウント | kai.azegami@gmail.com（個人） |
| Apps Script scriptId | `1U04yK4EOYI6PTq7AQKPTOwYHo_lvKBbxbUYC9nTGF8hvrCLZtGg-D7yo` |
| GCP プロジェクト番号 | `480634850677` |
| GCP プロジェクト ID | `markdown-viewer-drive-498312` |
| ウェブアプリ デプロイ（viewer） | `clasp list-deployments` の `@N - viewer` 行を参照 |
| ローカル | `D:\Dev\Project\gdrive-md-viewer`（clasp, rootDir=src） |

> ⚠️ `.clasprc.json`（認証トークン）は**絶対にコミットしない**（`.gitignore` 済み）。

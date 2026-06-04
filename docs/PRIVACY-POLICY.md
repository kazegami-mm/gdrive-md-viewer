# プライバシーポリシー / Privacy Policy

**対象アプリ**: Markdown Viewer for Drive（Google Workspace アドオン）
**最終更新日**: 2026-06-04

> このドキュメントは GitHub Pages 等で **公開 URL** として配置し、Google Workspace Marketplace
> および OAuth 同意画面の「プライバシーポリシー URL」に登録する。日本語と英語を併記する。

---

## 日本語

### 1. 概要
Markdown Viewer for Drive（以下「本アドオン」）は、Google ドライブ上の Markdown（`.md` ほか）
ファイルを整形表示・編集するための Google Workspace アドオンです。本アドオンは、利用者の
プライバシーを尊重し、必要最小限の情報のみを扱います。

### 2. 取得・利用する情報
本アドオンは、利用者が **明示的に選択または許可したファイル** に対してのみ動作します。

- **ファイル本文・ファイル名**: 選択された Markdown ファイルを表示・編集するために、Google
  ドライブ API 経由で読み取り、編集時には同ファイルへ書き戻します。
- **OAuth スコープ**: 以下の非機密スコープのみを要求します。
  - `drive.file`（利用者が選択／作成したファイルへの読み書き。ドライブ全体へはアクセスしません）
  - `drive.addons.metadata.readonly`（アドオン起動に必要なメタデータ）
  - `script.external_request`（Drive API 呼び出しのための外部通信）
  - `script.container.ui`（アドオン UI 表示）

### 3. 情報の保存
- 本アドオンは、利用者のファイル本文・ファイル名・個人情報を **開発者のサーバーに保存しません**。
- ファイル処理はすべて Google のインフラ（Apps Script 実行環境および Google ドライブ）内で
  完結します。
- 編集中の内容は、保存失敗時のデータ損失を防ぐため、**利用者自身のブラウザの localStorage**
  に一時退避することがあります。これはブラウザ内にのみ保存され、外部送信されません。保存成功時
  またはブラウザのデータ消去で削除されます。

### 4. 第三者への提供・外部サービス
- 本アドオンは、ファイル内容を第三者に提供・販売しません。
- 全画面ビューア／エディタは、表示・編集機能のために以下のオープンソースライブラリを
  **CDN（jsDelivr）** から読み込みます。これにより CDN 提供者が利用者の IP アドレス等の
  技術情報を受け取る場合があります。
  - marked（Markdown パーサ, MIT）
  - DOMPurify（HTML サニタイザ, Apache-2.0/MPL-2.0）
  - EasyMDE（Markdown エディタ, MIT）

### 5. セキュリティ
- 表示する HTML は DOMPurify によりサニタイズし、クロスサイトスクリプティング（XSS）を防止します。
- 外部リンクは `rel="noopener noreferrer"` 付きの新規タブで開きます。
- 通信はすべて HTTPS で行われます。

### 6. 利用者の権利・お問い合わせ
- 本アドオンはサーバーにデータを保持しないため、削除すべき開発者側データはありません。
  アクセス権の取り消しは、Google アカウントの「サードパーティアプリとサービス」設定から
  本アドオンの権限を削除することで可能です。
- ご質問・ご要望は以下までご連絡ください。
  - 連絡先: **（公開前に記入: サポート用メールアドレス）**

### 7. 変更
本ポリシーは予告なく変更されることがあります。重要な変更がある場合は本ページで告知します。

---

## English

### 1. Overview
Markdown Viewer for Drive ("the Add-on") is a Google Workspace Add-on for viewing and editing
Markdown (`.md` and similar) files stored in Google Drive. We respect users' privacy and handle
only the minimum information necessary.

### 2. Information We Access and Use
The Add-on operates **only on files the user explicitly selects or authorizes**.

- **File content and file name**: Read via the Google Drive API to display and edit the selected
  Markdown file, and written back to the same file on save.
- **OAuth scopes** (non-sensitive only):
  - `drive.file` (read/write to files the user selected or created; no access to the entire Drive)
  - `drive.addons.metadata.readonly`
  - `script.external_request`
  - `script.container.ui`

### 3. Data Storage
- The Add-on **does not store** users' file content, file names, or personal data on the
  developer's servers.
- All processing happens within Google's infrastructure (Apps Script runtime and Google Drive).
- To prevent data loss on save failure, in-progress edits may be temporarily cached in the
  **user's own browser localStorage**. This stays in the browser, is never transmitted externally,
  and is removed on successful save or when the browser data is cleared.

### 4. Third Parties and External Services
- The Add-on does not share or sell file content to third parties.
- The full-screen viewer/editor loads the following open-source libraries from a **CDN (jsDelivr)**:
  marked (MIT), DOMPurify (Apache-2.0/MPL-2.0), EasyMDE (MIT). As a result, the CDN provider may
  receive technical information such as the user's IP address.

### 5. Security
- Rendered HTML is sanitized with DOMPurify to prevent XSS. External links open in a new tab with
  `rel="noopener noreferrer"`. All communication uses HTTPS.

### 6. Your Rights and Contact
- Since the Add-on stores no data on servers, there is no developer-side data to delete. You can
  revoke access anytime from your Google Account's "Third-party apps & services" settings.
- Contact: **(fill in before release: support email address)**

### 7. Changes
This policy may change without prior notice. Significant changes will be announced on this page.

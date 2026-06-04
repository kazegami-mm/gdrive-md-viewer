# 全世界一般公開 手順書（Marketplace 公開チェックリスト）

**対象アプリ**: Markdown Viewer for Drive
**最終更新日**: 2026-06-04
**前提**: コードは軍師レビューで `conditional-ship` 水準（データ保護ブロッカーは解消済み）。
残るは本書の **非コード手続き** のみ。

> ⚠️ 個人 `@gmail.com` アカウントでは Marketplace の「限定公開（Private/Unlisted）」は使えない
> （Workspace 組織＝ドメインが必要）。選択肢は **(A) テストユーザー配布（最大 100 名・未確認警告あり）**
> か **(B) 全世界一般公開** の二択。本書は (B) の手順。

---

## フェーズ 0: 公開方針の最終確認

- [ ] スコープが**非機密のみ**であることを再確認（CASA 監査・OAuth verification の重い審査を回避）
  - `appsscript.json` の `oauthScopes`: `drive.file` / `drive.addons.metadata.readonly` /
    `script.external_request` / `script.container.ui`
  - ※ 非機密スコープのみでも **Marketplace のストア審査（app review）と OAuth ブランド審査は必要**。
    機密／制限付きスコープの「セキュリティ評価（CASA）」が不要、という意味。

---

## フェーズ 1: 法務ドキュメントの公開 URL 化

- [ ] `docs/PRIVACY-POLICY.md` を **公開 URL** にする（GitHub Pages 推奨）
- [ ] `docs/TERMS-OF-SERVICE.md` を **公開 URL** にする
- [ ] 両ドキュメントの **（要記入）** 箇所（サポート用メールアドレス）を埋める
- [ ] サポート用メールアドレス／問い合わせ窓口を1つ用意する

> GitHub Pages 化の例: リポジトリ Settings → Pages → Source を `main /docs` に設定すると
> `https://<user>.github.io/<repo>/PRIVACY-POLICY` 等で公開される（Markdown は自動 HTML 化）。

---

## フェーズ 2: アイコン・スクリーンショット

- [x] **アイコン生成（完了）** — SVG ベクター原本（`assets/icon.svg`）から透過 PNG をラスタライズ済み
  - [x] 512×512 透過 PNG（`assets/icon-512.png`、登録用の高解像度原本）
  - [x] 128×128 透過 PNG（`assets/icon-128.png`、Marketplace 用）
  - [x] 32×32 透過 PNG（`assets/icon-32.png`）
  - ※ 真の透過（Format32bppArgb / 背景 alpha=0）。角丸白カード + 青 M(#1a73e8) + 緑下矢印(#34a853) + 目グリフ
  - ※ 修正したい場合は `assets/icon.svg` を編集 → Edge headless で再ラスタライズ（手順は `assets/` 参照）
- [ ] スクリーンショット撮影（`MARKETPLACE-LISTING.md` §5 の 5 シーン）
  - [ ] サイドパネル疑似整形
  - [ ] 全画面ビューア（表示）
  - [ ] 全画面エディタ（分割）
  - [ ] 競合検出モーダル
  - [ ] （任意）狭幅表示

---

## フェーズ 3: OAuth 同意画面の本番化

GCP プロジェクト（標準プロジェクト `480634850677` / markdown-viewer-drive）の
Google Auth Platform で:

- [ ] User Type = **External**
- [ ] 公開ステータスを **「テスト」→「本番環境（In production）」** に切り替え
- [ ] アプリ名・サポートメール・デベロッパー連絡先を記入
- [ ] **プライバシーポリシー URL**（フェーズ 1）を登録
- [ ] **利用規約 URL**（任意だが推奨）を登録
- [ ] 承認済みドメインを登録（ポリシー URL のドメイン）
- [ ] スコープ一覧が `appsscript.json` と **完全一致**することを確認
  - スコープのズレは審査差し戻しの最頻原因
- [ ] ブランディング（ロゴ＝アイコン）を登録

> 非機密スコープのみなので、制限付きスコープで必要な「動画デモ＋詳細セキュリティ審査」は
> 原則不要。ただし OAuth ブランド審査（ロゴ・ドメイン確認）は走る。

---

## フェーズ 4: Marketplace SDK の設定

GCP プロジェクトで **Google Workspace Marketplace SDK** を有効化し、ストア掲載情報を入力:

- [ ] Marketplace SDK を有効化
- [ ] アプリ構成（App Configuration）
  - [ ] Apps Script のデプロイ ID を紐付け（アドオン本体）
  - [ ] Drive アドオンとして公開する設定
  - [ ] スコープを登録（manifest と一致）
- [ ] ストア掲載情報（Store Listing）— `MARKETPLACE-LISTING.md` の文章を流用
  - [ ] アプリ名（日本語／英語）
  - [ ] 短い説明・詳細説明（日本語／英語）
  - [ ] カテゴリ = Productivity
  - [ ] アイコン（128×128）
  - [ ] スクリーンショット
  - [ ] プライバシーポリシー URL / 利用規約 URL / サポート URL
  - [ ] 公開範囲 = **公開（Public）**

---

## フェーズ 5: 審査提出と確認

- [ ] テストユーザーで **未確認アプリ警告が出ない状態**（＝本番化済み）を確認
- [ ] レビュー担当者向けの操作手順（テスト用 .md ファイルの開き方・編集・保存の流れ）を用意
- [ ] Marketplace に **審査提出**
- [ ] 差し戻し対応（よくある指摘: スコープ不一致 / ポリシー URL 不達 / 説明とのスコープ乖離）

---

## フェーズ 6: 公開後

- [ ] 公開 URL（Marketplace リスティング）を記録
- [ ] 初回ユーザーの権限許可フロー（同意画面）を実機で1回通して離脱しないか確認
- [ ] フィードバック窓口（サポートメール）を監視
- [ ] CDN（jsDelivr）障害時にフォールバックが効くか、定期的に確認

---

## 補足: 各 URL / ID（実態値）

| 項目 | 値 |
|------|----|
| Apps Script scriptId | `1U04yK4EOYI6PTq7AQKPTOwYHo_lvKBbxbUYC9nTGF8hvrCLZtGg-D7yo` |
| 標準 GCP プロジェクト番号 | `480634850677`（markdown-viewer-drive-498312） |
| Web アプリ /exec URL | `https://script.google.com/macros/s/AKfycbxNtGph7vhdm9tYBGM07VktASW3Mj0cg6VGJ_0NMDQUUqJ_VagwaR8hbHhkoxHFTS0t/exec` |
| プライバシーポリシー URL | **（フェーズ 1 で確定）** |
| 利用規約 URL | **（フェーズ 1 で確定）** |
| サポートメール | **（フェーズ 1 で確定）** |

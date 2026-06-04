# Marketplace 掲載案（ストア素材ドラフト）

**対象アプリ**: Markdown Viewer for Drive
**最終更新日**: 2026-06-04

Google Workspace Marketplace の掲載情報（ストアリスティング）にそのまま流用できる文章・素材の
ドラフト。**（要記入）** の箇所は公開前に大将軍が確定する。

---

## 1. アプリ名 / Application name

- 日本語: `Markdown ビューア for Drive`
- English: `Markdown Viewer for Drive`

> 30 文字程度まで。Marketplace は言語ごとのローカライズ掲載に対応。

---

## 2. 短い説明 / Short description（〜100 文字）

- 日本語:
  > Google ドライブ上の Markdown(.md) を、サイドパネルと全画面で整形表示・編集できるアドオン。
- English:
  > View and edit Markdown (.md) files in Google Drive — formatted preview in the sidebar and a
  > full-screen editor.

---

## 3. 詳細説明 / Detailed description

### 日本語

```
Markdown ビューア for Drive は、Google ドライブに保存した Markdown（.md）ファイルを、
わざわざダウンロードせずにその場で「読みやすく整形表示」し、さらに「編集して上書き保存」できる
Google Workspace アドオンです。

■ 主な機能
・サイドパネル: .md を選ぶと、見出し・リスト・コード・表を疑似整形した軽量プレビューを表示
・全画面ビューア: marked.js による GitHub 風の整形表示
・全画面エディタ: 表示／編集／分割の 3 モード、ツールバーとショートカット（Ctrl+B/I/H/K/L、
  Ctrl+S 保存）を備えた本格的な Markdown エディタ
・Drive へ直接上書き保存。保存時には他端末・共同編集者の変更を検出する競合チェック付き
・編集内容はブラウザに自動退避。保存に失敗しても内容を失いにくい設計

■ 安心の設計
・要求する権限は「あなたが選んだファイル」だけ（drive.file）。ドライブ全体にはアクセスしません
・ファイルの内容を開発者のサーバーに保存しません
・表示内容は DOMPurify でサニタイズし、安全に表示します

技術ドキュメント、議事録、README、ブログ下書きなど、Markdown で書いたあらゆるメモを
Google ドライブ上でそのまま快適に扱えます。
```

### English

```
Markdown Viewer for Drive lets you read and edit Markdown (.md) files stored in Google Drive
without downloading them — formatted preview in the sidebar plus a full-screen editor with
direct save-back to Drive.

Key features:
- Sidebar: lightweight formatted preview (headings, lists, code, tables)
- Full-screen viewer: GitHub-style rendering via marked.js
- Full-screen editor: view / edit / split modes, toolbar and shortcuts (Ctrl+B/I/H/K/L, Ctrl+S)
- Save back to Drive with conflict detection against changes from other devices/collaborators
- Edits are auto-backed-up in your browser to reduce the risk of losing work on save failure

Privacy by design:
- Requests access only to files you select (drive.file) — never your entire Drive
- Does not store your file content on developer servers
- Rendered content is sanitized with DOMPurify
```

---

## 4. カテゴリ / Category

- 推奨: `Productivity`（生産性）

---

## 5. スクリーンショット（要撮影）

Marketplace は **1280×800 または 640×400** の画像を推奨。最低 1 枚、できれば 3〜5 枚。
以下のシーンを撮影する（実機の Web アプリ URL を開いて取得）:

1. **サイドパネルの疑似整形プレビュー**（Drive で .md を選択した状態）
2. **全画面ビューア（表示モード）** — 見出し・コード・表が整形された状態
3. **全画面エディタ（分割モード）** — 左に編集・右にライブプレビュー
4. **保存の競合検出モーダル**（「ファイルが競合しています」ダイアログ）— 安全性の訴求に有効
5. （任意）狭幅／モバイル表示

> 📸 **詳しい撮影手順は [`SCREENSHOT-GUIDE.md`](SCREENSHOT-GUIDE.md) を参照**。
> 撮影用サンプル `assets/demo-sample.md`（見出し・表・コード・引用を網羅）を Drive にアップして撮る。
> 競合モーダル（シーン 4）の作り方・1280×800 への整形スクリプト・命名規則も同ガイドに記載。
> 撮影物の保存先: `assets/screenshots/`

> アイコンは **生成・配置済み**（下記「6. アイコン」参照）。`assets/icon-128.png` / `assets/icon-32.png` /
> `assets/icon-512.png`（真の透過 PNG）。

---

## 6. アイコン（生成・配置済み）

**SVG ベクター原本からラスタライズして完成済み**。当初 gpt-image（Codex CLI）で生成したが、gpt-image は
アルファチャンネルを出力せず白背景の不透明 PNG になる制約があったため、同デザインを `assets/icon.svg`
としてベクター定義し直し、Edge headless（`--default-background-color=00000000`）で**真の透過 PNG**に
ラスタライズした。

| ファイル | サイズ | 用途 |
|----------|--------|------|
| `assets/icon.svg` | ベクター | 編集用の原本 |
| `assets/icon-512.png` | 512×512 | 登録用高解像度（透過） |
| `assets/icon-128.png` | 128×128 | Marketplace 用（透過） |
| `assets/icon-32.png` | 32×32 | 小サイズ（透過） |

デザイン: 角丸の白カード（ソフトシャドウ付き）の上に、Markdown の「M」(#1a73e8 Google ブルー) +
下向き矢印 (#34a853 グリーン) + 目（ビューア）のグリフ。

**修正方法**: `assets/icon.svg` を編集 → Edge/Chrome headless で再ラスタライズ → 512 から GDI+ で
128/32 を高品質縮小（透過維持）。元プロンプト（参考）:

```
Markdown document motif — a rounded-square white card showing the "M" Markdown mark (#1a73e8)
combined with a downward arrow (#34a853) and an "eye" (view) glyph. Flat, Material-ish, soft
shadow. Background fully transparent (alpha=0). Square, centered, safe margin.
```

---

## 7. リンク類（要記入 / 公開 URL 化が必要）

| 項目 | 値 |
|------|----|
| プライバシーポリシー URL | `docs/PRIVACY-POLICY.md` を GitHub Pages 等で公開 → **（要 URL）** |
| 利用規約 URL | `docs/TERMS-OF-SERVICE.md` を公開 → **（要 URL）** |
| サポート URL / メール | **（要記入）** |
| 公式サイト / GitHub | （任意）リポジトリ URL |

---

## 8. 対応言語

- 日本語 / English（説明文は本書のとおり両言語を用意済み）

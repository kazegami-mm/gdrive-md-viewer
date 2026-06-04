# Markdown Viewer for Drive — デモ

Google ドライブ上の **Markdown** を、ダウンロードせずにその場で整形表示・編集できる Workspace アドオンです。
このファイルはスクリーンショット撮影用のサンプルです。

> 💡 サイドパネルでは軽量プレビュー、全画面では `marked.js` による GitHub 風レンダリングで表示されます。

## 主な機能

- **整形表示** — 見出し・リスト・コード・表・引用を綺麗に描画
- **全画面エディタ** — 表示 / 編集 / 分割の 3 モード
- **Drive へ直接保存** — 競合検出（楽観ロック）付きで安全に上書き
- **自動退避** — 編集内容をブラウザに自動バックアップ

## キーボードショートカット

| ショートカット | 動作 |
|----------------|------|
| `Ctrl + B` | 太字 |
| `Ctrl + I` | 斜体 |
| `Ctrl + H` | 見出し |
| `Ctrl + K` | リンク挿入 |
| `Ctrl + L` | リスト |
| `Ctrl + S` | Drive へ保存 |

## コードブロックも綺麗に

```javascript
// 保存時に競合を検出する楽観ロック
function saveMarkdownContent(fileId, content, expectedRev) {
  const meta = getFileMeta_(fileId);
  if (expectedRev && meta.md5Checksum !== expectedRev.md5) {
    return { ok: false, error: { code: "CONFLICT" } };
  }
  // ... PATCH で Drive に上書き保存
}
```

## 番号付きリスト

1. Drive で `.md` ファイルを選択
2. サイドパネルにプレビューが表示される
3. 「全画面で表示」で整形描画
4. 編集して `Ctrl + S` で保存

## 安心の設計

要求する権限は **あなたが選んだファイルだけ**（`drive.file`）。ドライブ全体にはアクセスしません。
ファイル内容を開発者のサーバーに保存することもありません。

詳しくは [プロジェクトの README](https://github.com/) を参照してください。

---

*Markdown Viewer for Drive — 技術ドキュメント・議事録・README・ブログ下書きに最適です。*

/**
 * 定数・設定をまとめたファイル。
 * MVP では拡張子判定とプレビュー上限のみ。
 */
var CONFIG = {
  // Markdown とみなす拡張子（小文字で比較）
  MD_EXTENSIONS: ['.md', '.markdown', '.mdown', '.mkd'],

  // サイドパネルの簡易プレビューに出す最大文字数（重くなりすぎ防止）
  SIDEBAR_PREVIEW_LIMIT: 4000,

  // 全画面ビューアで読み込む最大バイト数（巨大ファイル保護）
  MAX_FILE_BYTES: 5 * 1024 * 1024 // 5MB
};

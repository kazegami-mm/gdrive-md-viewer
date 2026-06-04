/**
 * Web アプリ（全画面ビューア）のエントリポイント。
 * CardService の「全画面で整形表示」ボタンから ?fileId= 付きで開かれる。
 */

/**
 * GET エントリ。Viewer.html を IFRAME サンドボックスで返す。
 * @param {Object} e クエリパラメータ e.parameter.fileId
 * @return {HtmlOutput}
 */
function doGet(e) {
  var fileId = (e && e.parameter && e.parameter.fileId) ? e.parameter.fileId : '';

  var template = HtmlService.createTemplateFromFile('Viewer');
  template.fileId = fileId;

  return template
    .evaluate()
    .setTitle('Markdown Viewer')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

/**
 * HTML テンプレートから他ファイル（CSS など）を読み込むためのヘルパー。
 * @param {string} filename
 * @return {string}
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * クライアント（Viewer.html）から google.script.run で呼ばれる。
 * 指定 fileId の生 Markdown を返す。描画（marked + sanitize）はクライアント側で行う。
 * @param {string} fileId
 * @return {{ok: boolean, data?: {name: string, content: string}, error?: {code: string, message: string}}}
 */
function getMarkdownForViewer(fileId) {
  return getMarkdownContent(fileId);
}

/**
 * クライアント（Viewer.html）から google.script.run で呼ばれる。
 * 編集後の Markdown 本文を Drive の元ファイルへ上書き保存する。
 * expectedRev は読み込み時に取得したリビジョン情報で、競合検出（楽観ロック）に使う。
 * @param {string} fileId
 * @param {string} content
 * @param {{md5?: string, modifiedTime?: string, version?: string}} [expectedRev]
 * @return {{ok: boolean, rev?: Object, verified?: boolean, error?: {code: string, message: string}}}
 */
function saveMarkdownForViewer(fileId, content, expectedRev) {
  return saveMarkdownContent(fileId, content, expectedRev);
}

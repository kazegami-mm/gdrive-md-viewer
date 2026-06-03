/**
 * CardService によるサイドパネル UI を組み立てる。
 * 注意: CardService は HTML 描画不可。整形済みプレビューは出せないため、
 *       「軽量テキストプレビュー」+「全画面で表示」ボタンを提供する。
 */

/**
 * ホーム画面（ファイル未選択時）のカード。
 * @return {Card}
 */
function buildHomeCard() {
  var section = CardService.newCardSection()
    .addWidget(
      CardService.newTextParagraph().setText(
        'Drive で <b>.md ファイル</b>を選択すると、ここに内容のプレビューが表示されます。'
      )
    )
    .addWidget(
      CardService.newTextParagraph().setText(
        '整形された表示は「全画面で表示」から開けます。'
      )
    );

  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle('Markdown Viewer'))
    .addSection(section)
    .build();
}

/**
 * ファイルへのアクセス権がまだ無い場合に、権限要求ボタンを出すカード。
 * @param {string} fileName 表示用ファイル名（任意）
 * @param {string} fileId 許可対象のファイル ID（requestFileScope に必要）
 * @return {Card}
 */
function buildRequestAccessCard(fileName, fileId, debug) {
  var msg = fileName
    ? '「' + fileName + '」の内容を表示するには、このファイルへのアクセスを許可してください。'
    : '選択したファイルの内容を表示するには、アクセスを許可してください。';

  var action = CardService.newAction().setFunctionName('onRequestFileScope');
  if (fileId) {
    action.setParameters({ fileId: String(fileId) });
  }

  var section = CardService.newCardSection()
    .addWidget(CardService.newTextParagraph().setText(msg))
    .addWidget(
      CardService.newTextButton()
        .setText('アクセスを許可')
        .setOnClickAction(action)
    );

  // 一時デバッグ: 許可後も 403 で戻る場合に原因を画面で確認するため
  if (debug) {
    section.addWidget(
      CardService.newTextParagraph().setText('<font color="#999999"><i>診断: ' + escapeForCard(debug) + '</i></font>')
    );
  }

  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle('アクセス許可が必要です'))
    .addSection(section)
    .build();
}

/**
 * 選択された Markdown ファイルのプレビューカード。
 * @param {string} fileId
 * @param {string} fileName
 * @param {string} content 生の Markdown 本文
 * @return {Card}
 */
function buildPreviewCard(fileId, fileName, content) {
  // サイドパネルでも「整形されて見える」状態にする。
  // CardService は HTML/iframe を描画できないため、Markdown をパースして
  // CardService ウィジェット（限定 HTML）へマッピングする（疑似整形）。
  // 完全な整形は全画面ビューア（marked.js）に委ねる。
  var preview = content;
  var truncated = false;
  if (preview.length > CONFIG.SIDEBAR_PREVIEW_LIMIT) {
    preview = preview.slice(0, CONFIG.SIDEBAR_PREVIEW_LIMIT);
    truncated = true;
  }

  // 全画面ビューアの URL（Web アプリ）を fileId 付きで生成。
  // getService().getUrl() は複数デプロイがあると不正なデプロイを返すことがあるため、
  // スクリプトプロパティ WEBAPP_URL を優先する（再デプロイ時はこの値だけ更新すればよい）。
  var viewerUrl = getViewerBaseUrl_() + '?fileId=' + encodeURIComponent(fileId);

  var headerSection = CardService.newCardSection()
    .addWidget(
      CardService.newTextButton()
        .setText('🖥 全画面で整形表示')
        .setOpenLink(
          CardService.newOpenLink()
            .setUrl(viewerUrl)
            .setOpenAs(CardService.OpenAs.FULL_SIZE)
            .setOnClose(CardService.OnClose.NOTHING)
        )
    );

  var card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle(fileName))
    .addSection(headerSection);

  // Markdown → CardSection 群（疑似整形プレビュー）
  var sections = markdownToSections(preview);
  for (var s = 0; s < sections.length; s++) {
    card.addSection(sections[s]);
  }

  if (truncated) {
    card.addSection(
      CardService.newCardSection().addWidget(
        CardService.newTextParagraph().setText(
          '<font color="#80868b"><i>…（以降は「🖥 全画面で整形表示」で確認してください）</i></font>'
        )
      )
    );
  }

  return card.build();
}

/**
 * 全画面ビューア（ウェブアプリ）のベース URL を返す。
 * スクリプトプロパティ WEBAPP_URL を最優先し、無ければ getService().getUrl() に
 * フォールバックする。複数デプロイ環境では getUrl が不正な URL を返すことがあるため、
 * 正しいウェブアプリ /exec URL を WEBAPP_URL に設定しておく運用とする。
 * @return {string}
 * @private
 */
function getViewerBaseUrl_() {
  var prop = PropertiesService.getScriptProperties().getProperty('WEBAPP_URL');
  if (prop) return prop;
  return ScriptApp.getService().getUrl();
}

/**
 * CardService の TextParagraph は限定 HTML を解釈するため、
 * 生テキストプレビューでタグが化けないよう最小限エスケープする。
 * @param {string} s
 * @return {string}
 */
function escapeForCard(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}

/**
 * Workspace Add-on のトリガーハンドラ群。
 */

/**
 * ホームページトリガー（アドオンを開いた直後）。
 * @param {Object} e イベント
 * @return {Card}
 */
function onHomePage(e) {
  return buildHomeCard();
}

/**
 * Drive でアイテムを選択したときに発火するトリガー。
 * ※ R1 検証ポイント: drive.file スコープ単独でこのトリガーが発火するか実機確認する。
 * @param {Object} e Drive アドオンイベント（e.drive.selectedItems / activeCursorItem）
 * @return {Card}
 */
function onDriveItemsSelected(e) {
  var item = getSelectedItem_(e);
  if (!item) {
    return buildHomeCard();
  }

  // Markdown 以外はホームカード（対象外を静かに無視）
  if (!isMarkdownFile(item.title)) {
    return buildHomeCard();
  }

  // 権限フラグは環境差があり信頼しきれないため、
  // 「未許可が明らか」なときだけ先に許可カードを出し、
  // それ以外は実際に取得を試みて 401/403 が返れば許可カードに切り替える。
  if (item.addonHasFileScopePermission === false) {
    return buildRequestAccessCard(item.title, item.id);
  }

  var result = getMarkdownContent(item.id);
  if (!result.ok) {
    // ファイル単位の drive.file 許可が無い場合のみ許可カードへ誘導。
    // API_DISABLED などその他のエラーはエラーカードに出す（許可ループ防止）。
    if (result.error && result.error.code === 'NO_PERMISSION') {
      return buildRequestAccessCard(item.title, item.id);
    }
    return buildErrorCard_(result.error);
  }
  return buildPreviewCard(item.id, result.data.name, result.data.content);
}

/**
 * 「アクセスを許可」ボタンのコールバック。
 * Drive アドオンでは DriveItemsSelectedActionResponseBuilder.requestFileScope(id)
 * を使い、対象ファイル ID への drive.file 許可ダイアログを表示させる。
 * （Editor アドオン用の requestFileScopeForActiveDocument は Drive では不可）
 * @param {Object} e ボタンに持たせた parameters.fileId を参照
 * @return {DriveItemsSelectedActionResponse}
 */
function onRequestFileScope(e) {
  var fileId = (e && e.parameters && e.parameters.fileId) ? e.parameters.fileId : null;

  // 念のためイベントからも拾えるようにフォールバック
  if (!fileId) {
    var item = getSelectedItem_(e);
    if (item) fileId = item.id;
  }

  var builder = CardService.newDriveItemsSelectedActionResponseBuilder();
  if (fileId) {
    builder.requestFileScope(fileId);
  }
  return builder.build();
}

/**
 * イベントから選択アイテム（id, title, 権限フラグ）を正規化して取り出す。
 * Drive アドオンイベントの形は環境差があるため両系統を見る。
 * @param {Object} e
 * @return {{id: string, title: string, addonHasFileScopePermission: boolean}|null}
 * @private
 */
function getSelectedItem_(e) {
  if (!e || !e.drive) return null;

  var candidates = [];
  if (e.drive.activeCursorItem) {
    candidates.push(e.drive.activeCursorItem);
  }
  if (e.drive.selectedItems && e.drive.selectedItems.length > 0) {
    candidates = candidates.concat(e.drive.selectedItems);
  }

  for (var i = 0; i < candidates.length; i++) {
    var raw = candidates[i];
    if (!raw || !raw.id || !raw.title) continue;
    return {
      id: raw.id,
      title: raw.title,
      // 重要: true/false/undefined を生のまま保持する。
      // === true に潰すと、許可後に undefined で返ったケースを
      // 「未許可」と誤判定して無限ループの原因になる（軍師レビュー指摘）。
      addonHasFileScopePermission: raw.addonHasFileScopePermission
    };
  }
  return null;
}

/**
 * エラー表示用カード。
 * @param {{code: string, message: string}} error
 * @return {Card}
 * @private
 */
function buildErrorCard_(error) {
  var section = CardService.newCardSection()
    .addWidget(CardService.newTextParagraph().setText(error ? error.message : '不明なエラーが発生しました。'));
  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle('エラー'))
    .addSection(section)
    .build();
}

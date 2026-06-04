/**
 * Drive ファイルの読み取りを担うサービス層。
 *
 * drive.file スコープのみで「ユーザーが選択/許可したファイル」本体を読むため、
 * DriveApp（広い drive スコープを要求する）ではなく、
 * UrlFetchApp + Drive API v3 を OAuth トークン付きで直接叩く。
 *   - メタデータ: GET /drive/v3/files/{id}?fields=name,size,mimeType
 *   - 本文:       GET /drive/v3/files/{id}?alt=media
 * これにより drive.file + script.external_request（いずれも非機密＝CASA回避）で完結する。
 */

var DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3/files/';

// 保存・読み込みで取得するファイルメタの fields（競合検出・認可判定に使う）。
// md5Checksum/modifiedTime/version で競合検出、capabilities.canEdit で書込認可、
// mimeType で Google Docs 形式拒否・元 MIME 保持を行う。
var DRIVE_META_FIELDS =
  'id,name,size,mimeType,modifiedTime,version,md5Checksum,capabilities(canEdit)';

/**
 * ファイル名が Markdown 拡張子かどうかを判定する。
 * @param {string} name ファイル名
 * @return {boolean}
 */
function isMarkdownFile(name) {
  if (!name) return false;
  var lower = String(name).toLowerCase();
  return CONFIG.MD_EXTENSIONS.some(function (ext) {
    return lower.slice(-ext.length) === ext;
  });
}

/**
 * レスポンス本文から「Drive API 未有効化」エラーかどうかを判定する。
 * @param {string} body
 * @return {boolean}
 * @private
 */
function isApiDisabledBody_(body) {
  if (!body) return false;
  return body.indexOf('has not been used') !== -1 ||
    body.indexOf('is disabled') !== -1 ||
    body.indexOf('accessNotConfigured') !== -1 ||
    body.indexOf('SERVICE_DISABLED') !== -1;
}

/**
 * 401/403/404 を共通の error オブジェクトへ写像する。
 * @param {number} code HTTP ステータス
 * @param {string} body レスポンス本文
 * @param {string} deniedMsg 権限なし時のメッセージ
 * @return {{code: string, message: string}|null} 該当しなければ null
 * @private
 */
function mapAuthError_(code, body, deniedMsg) {
  if (code === 401 || code === 403) {
    if (isApiDisabledBody_(body)) {
      return { code: 'API_DISABLED', message: 'Drive API が有効化されていません。GCP プロジェクトで Drive API を有効にしてから、もう一度お試しください。' };
    }
    return { code: 'NO_PERMISSION', message: deniedMsg };
  }
  if (code === 404) {
    return { code: 'NO_PERMISSION', message: deniedMsg };
  }
  return null;
}

/**
 * Google ドキュメント形式（ネイティブ Google Apps 形式）かどうか。
 * これらはバイナリ本文 PATCH の対象にしてはならない。
 * @param {string} mimeType
 * @return {boolean}
 * @private
 */
function isGoogleNativeMime_(mimeType) {
  return !!mimeType && mimeType.indexOf('application/vnd.google-apps') === 0;
}

/**
 * ファイルメタを取得する。競合検出・認可判定に必要な fields を含む。
 * @param {string} fileId
 * @return {{ok: boolean, data?: Object, error?: {code: string, message: string}}}
 */
function getFileMeta_(fileId) {
  var metaUrl = DRIVE_API_BASE + encodeURIComponent(fileId) +
    '?fields=' + encodeURIComponent(DRIVE_META_FIELDS) + '&supportsAllDrives=true';
  var res = driveApiFetch_(metaUrl);
  var code = res.getResponseCode();
  if (code !== 200) {
    var err = mapAuthError_(code, res.getContentText(),
      'このファイルへのアクセスが許可されていません。「アクセスを許可」から権限を付与してください。');
    if (err) return { ok: false, error: err };
    return { ok: false, error: { code: 'META_ERROR', message: 'ファイル情報を取得できませんでした (HTTP ' + code + ')。' } };
  }
  return { ok: true, data: JSON.parse(res.getContentText()) };
}

/**
 * Drive API v3 を OAuth トークン付きで叩く共通ヘルパー。
 * @param {string} url
 * @return {HTTPResponse}
 * @private
 */
function driveApiFetch_(url) {
  return UrlFetchApp.fetch(url, {
    method: 'get',
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true
  });
}

/**
 * 指定ファイル ID の Markdown 本文を取得する。
 * @param {string} fileId Drive ファイル ID
 * @return {{ok: boolean, data?: {name: string, content: string}, error?: {code: string, message: string}}}
 */
function getMarkdownContent(fileId) {
  if (!fileId) {
    return { ok: false, error: { code: 'NO_FILE_ID', message: 'ファイル ID がありません。' } };
  }

  try {
    // 1) メタデータ取得（名前・サイズ・競合検出キー）
    var metaResult = getFileMeta_(fileId);
    if (!metaResult.ok) return metaResult;
    var meta = metaResult.data;
    var name = meta.name || '';

    if (isGoogleNativeMime_(meta.mimeType)) {
      return { ok: false, error: { code: 'NOT_MARKDOWN', message: 'Google ドキュメント形式のため開けません: ' + name } };
    }
    if (!isMarkdownFile(name)) {
      return { ok: false, error: { code: 'NOT_MARKDOWN', message: 'Markdown ファイルではありません: ' + name } };
    }

    var size = meta.size ? parseInt(meta.size, 10) : 0;
    if (size && size > CONFIG.MAX_FILE_BYTES) {
      return { ok: false, error: { code: 'TOO_LARGE', message: 'ファイルが大きすぎます（5MB 上限）。' } };
    }

    var canEdit = !!(meta.capabilities && meta.capabilities.canEdit);

    // 2) 本文取得（alt=media）
    var mediaUrl = DRIVE_API_BASE + encodeURIComponent(fileId) + '?alt=media&supportsAllDrives=true';
    var mediaRes = driveApiFetch_(mediaUrl);
    var mediaCode = mediaRes.getResponseCode();

    if (mediaCode !== 200) {
      var mErr = mapAuthError_(mediaCode, mediaRes.getContentText(),
        'このファイルへのアクセスが許可されていません。「アクセスを許可」から権限を付与してください。');
      if (mErr) return { ok: false, error: mErr };
      return { ok: false, error: { code: 'MEDIA_ERROR', message: '本文を取得できませんでした (HTTP ' + mediaCode + ')。' } };
    }

    // UTF-8 として明示的にデコード
    var content = mediaRes.getBlob().getDataAsString('UTF-8');
    return {
      ok: true,
      data: {
        name: name,
        content: content,
        canEdit: canEdit,
        // 競合検出に使う「読み込み時点のリビジョン情報」。クライアントが保持し、
        // 保存時に送り返す。サーバー側で再取得した値と突き合わせる。
        rev: {
          md5: meta.md5Checksum || '',
          modifiedTime: meta.modifiedTime || '',
          version: meta.version || ''
        }
      }
    };

  } catch (e) {
    return {
      ok: false,
      error: {
        code: 'ACCESS_ERROR',
        message: 'ファイルを読み込めませんでした。(' + e.message + ')'
      }
    };
  }
}

// メディアアップロード用エンドポイント（本文の書き戻しは /upload 配下を使う）
var DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3/files/';

/**
 * 指定ファイル ID へ Markdown 本文を上書き保存する（drive.file の範囲で書き込み可）。
 * Drive API v3 のシンプルメディアアップロード（PATCH ?uploadType=media）を使う。
 * drive.file は「ユーザーが選択/許可したファイル」への読み書きを許すため、
 * 追加スコープ無し＝CASA 回避を維持したまま保存できる。
 *
 * 一般公開水準のデータ保護として、保存前に必ず以下を行う:
 *   - メタ再取得 → canEdit / MIME / 拡張子 / Google Docs 形式を検証（不正な書込を拒否）
 *   - 楽観ロック: 読み込み時の expectedRev（md5 / modifiedTime / version）と
 *     現在のリビジョンを突き合わせ、第三者の更新を検出したら CONFLICT で停止
 *   - 保存は元ファイルの mimeType を保持（text/markdown 固定で MIME を壊さない）
 *   - 保存後に md5 を再取得し、書き込んだ内容と一致するか検証
 *
 * @param {string} fileId
 * @param {string} content 保存する Markdown 本文
 * @param {({md5?: string, modifiedTime?: string, version?: string}|null)} expectedRev
 *        読み込み時に getMarkdownContent が返した rev。
 *        - オブジェクトで比較材料あり → 楽観ロックで競合検出
 *        - null（明示）→ 強制上書き。競合検出をスキップ（ユーザーが競合ダイアログで選択した時のみ）
 *        - undefined / {} / 比較材料なし → STALE_REV で拒否（ロック迂回を防ぐ）
 * @return {{ok: boolean, rev?: Object, error?: {code: string, message: string}}}
 */
function saveMarkdownContent(fileId, content, expectedRev) {
  if (!fileId) {
    return { ok: false, error: { code: 'NO_FILE_ID', message: 'ファイル ID がありません。' } };
  }

  // 競合検出の前提チェック。null は「明示的な強制上書き」なので許可する。
  // それ以外で比較材料（md5 / version / modifiedTime）が一つも無い場合は、
  // 楽観ロックを素通りさせず STALE_REV で拒否する（ロック迂回バグ防止）。
  var forceOverwrite = (expectedRev === null);
  if (!forceOverwrite) {
    var hasRevKey = expectedRev &&
      (expectedRev.md5 || expectedRev.version || expectedRev.modifiedTime);
    if (!hasRevKey) {
      return {
        ok: false,
        error: { code: 'STALE_REV', message: 'リビジョン情報が無いため安全に保存できません。ページを再読込してからもう一度お試しください。' }
      };
    }
  }

  try {
    var bytes = Utilities.newBlob(content == null ? '' : String(content), 'text/markdown').getBytes();
    if (bytes.length > CONFIG.MAX_FILE_BYTES) {
      return { ok: false, error: { code: 'TOO_LARGE', message: 'ファイルが大きすぎます（5MB 上限）。' } };
    }

    // 1) 保存前にメタ再取得（認可・種別・競合の検証）
    var metaResult = getFileMeta_(fileId);
    if (!metaResult.ok) {
      // 権限なし/未有効化はそのまま、それ以外は SAVE_ERROR に丸める
      if (metaResult.error && (metaResult.error.code === 'NO_PERMISSION' || metaResult.error.code === 'API_DISABLED')) {
        return metaResult;
      }
      return { ok: false, error: { code: 'SAVE_ERROR', message: '保存前のファイル確認に失敗しました。' } };
    }
    var meta = metaResult.data;

    if (isGoogleNativeMime_(meta.mimeType)) {
      return { ok: false, error: { code: 'NOT_EDITABLE', message: 'Google ドキュメント形式のファイルには保存できません。' } };
    }
    if (!isMarkdownFile(meta.name || '')) {
      return { ok: false, error: { code: 'NOT_EDITABLE', message: 'Markdown ファイルではないため保存できません。' } };
    }
    if (!(meta.capabilities && meta.capabilities.canEdit)) {
      return { ok: false, error: { code: 'NOT_EDITABLE', message: 'このファイルは編集権限がありません（閲覧のみ）。' } };
    }

    // 2) 楽観ロック: 読み込み時のリビジョンと突き合わせ、第三者更新なら停止
    //    forceOverwrite（expectedRev===null）のときだけスキップする。
    if (!forceOverwrite && expectedRev) {
      var changed = false;
      if (expectedRev.md5 && meta.md5Checksum) {
        changed = expectedRev.md5 !== meta.md5Checksum;
      } else if (expectedRev.version && meta.version) {
        changed = String(expectedRev.version) !== String(meta.version);
      } else if (expectedRev.modifiedTime && meta.modifiedTime) {
        changed = expectedRev.modifiedTime !== meta.modifiedTime;
      }
      if (changed) {
        return {
          ok: false,
          error: { code: 'CONFLICT', message: 'このファイルは別の場所で更新されています。上書きすると相手の変更が失われます。' },
          rev: { md5: meta.md5Checksum || '', modifiedTime: meta.modifiedTime || '', version: meta.version || '' }
        };
      }
    }

    // 3) 保存（元 mimeType を保持。markdown 系以外でも壊さない）
    //    空・Google ネイティブ・不正値は contentType に使わず安全な既定へ落とす。
    var saveMime = meta.mimeType;
    if (!saveMime || isGoogleNativeMime_(saveMime) || saveMime.indexOf('/') === -1) {
      saveMime = 'text/markdown';
    }
    var url = DRIVE_UPLOAD_BASE + encodeURIComponent(fileId) +
      '?uploadType=media&supportsAllDrives=true';
    var res = UrlFetchApp.fetch(url, {
      method: 'patch',
      contentType: saveMime + '; charset=UTF-8',
      headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
      payload: bytes,
      muteHttpExceptions: true
    });
    var code = res.getResponseCode();

    if (code !== 200 && code !== 201) {
      var sErr = mapAuthError_(code, res.getContentText(), 'このファイルへの書き込みが許可されていません。');
      if (sErr) return { ok: false, error: sErr };
      return { ok: false, error: { code: 'SAVE_ERROR', message: '保存に失敗しました (HTTP ' + code + ')。' } };
    }

    // 4) 保存後検証: 新しいリビジョンを取り直して返す（クライアントが次回 expectedRev に使う）。
    //    md5 が一致すれば「確実に保存された」と判定でき、ネット切断時の不明状態を減らせる。
    var after = getFileMeta_(fileId);
    var newRev = after.ok
      ? { md5: after.data.md5Checksum || '', modifiedTime: after.data.modifiedTime || '', version: after.data.version || '' }
      : null;

    var localMd5 = computeMd5Hex_(bytes);
    var verified = !!(newRev && newRev.md5 && localMd5 && newRev.md5 === localMd5);

    return { ok: true, rev: newRev, verified: verified };

  } catch (e) {
    return {
      ok: false,
      error: { code: 'SAVE_ERROR', message: '保存できませんでした。(' + e.message + ')' }
    };
  }
}

/**
 * バイト列の MD5 を 16 進文字列で返す（保存後の checksum 照合用）。
 * Drive の md5Checksum と同じ表現に合わせる。
 * @param {Byte[]} bytes
 * @return {string} 小文字 16 進。失敗時は ''
 * @private
 */
function computeMd5Hex_(bytes) {
  try {
    var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, bytes);
    var hex = '';
    for (var i = 0; i < digest.length; i++) {
      var b = (digest[i] + 256) % 256;
      hex += (b < 16 ? '0' : '') + b.toString(16);
    }
    return hex;
  } catch (e) {
    return '';
  }
}

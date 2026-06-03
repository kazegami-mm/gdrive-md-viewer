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
    // 1) メタデータ取得（名前・サイズ）
    var metaUrl = DRIVE_API_BASE + encodeURIComponent(fileId) +
      '?fields=name,size,mimeType&supportsAllDrives=true';
    var metaRes = driveApiFetch_(metaUrl);
    var metaCode = metaRes.getResponseCode();

    if (metaCode === 401 || metaCode === 403) {
      var metaBody = metaRes.getContentText();
      // 403 でも「API 未有効化」と「ファイル権限なし」は別物。
      // API 未有効化を NO_PERMISSION 扱いにすると許可ループに陥るため切り分ける。
      if (metaBody.indexOf('has not been used') !== -1 ||
          metaBody.indexOf('is disabled') !== -1 ||
          metaBody.indexOf('accessNotConfigured') !== -1 ||
          metaBody.indexOf('SERVICE_DISABLED') !== -1) {
        return {
          ok: false,
          error: {
            code: 'API_DISABLED',
            message: 'Drive API が有効化されていません。GCP プロジェクトで Drive API を有効にしてから、もう一度お試しください。'
          }
        };
      }
      return {
        ok: false,
        error: {
          code: 'NO_PERMISSION',
          message: 'このファイルへのアクセスが許可されていません。「アクセスを許可」から権限を付与してください。'
        }
      };
    }
    // 404: drive.file ではファイル単位の許可が無いファイルは「存在しない」扱いで
    // 404 が返ることがある。許可カードへ誘導する。
    if (metaCode === 404) {
      return {
        ok: false,
        error: {
          code: 'NO_PERMISSION',
          message: 'このファイルへのアクセスが許可されていません。「アクセスを許可」から権限を付与してください。'
        }
      };
    }
    if (metaCode !== 200) {
      return { ok: false, error: { code: 'META_ERROR', message: 'ファイル情報を取得できませんでした (HTTP ' + metaCode + ')。' } };
    }

    var meta = JSON.parse(metaRes.getContentText());
    var name = meta.name || '';

    if (!isMarkdownFile(name)) {
      return { ok: false, error: { code: 'NOT_MARKDOWN', message: 'Markdown ファイルではありません: ' + name } };
    }

    var size = meta.size ? parseInt(meta.size, 10) : 0;
    if (size && size > CONFIG.MAX_FILE_BYTES) {
      return { ok: false, error: { code: 'TOO_LARGE', message: 'ファイルが大きすぎます（5MB 上限）。' } };
    }

    // 2) 本文取得（alt=media）
    var mediaUrl = DRIVE_API_BASE + encodeURIComponent(fileId) + '?alt=media&supportsAllDrives=true';
    var mediaRes = driveApiFetch_(mediaUrl);
    var mediaCode = mediaRes.getResponseCode();

    if (mediaCode === 401 || mediaCode === 403) {
      var mediaBody = mediaRes.getContentText();
      if (mediaBody.indexOf('has not been used') !== -1 ||
          mediaBody.indexOf('is disabled') !== -1 ||
          mediaBody.indexOf('accessNotConfigured') !== -1 ||
          mediaBody.indexOf('SERVICE_DISABLED') !== -1) {
        return { ok: false, error: { code: 'API_DISABLED', message: 'Drive API が有効化されていません。GCP プロジェクトで Drive API を有効にしてから、もう一度お試しください。' } };
      }
      return { ok: false, error: { code: 'NO_PERMISSION', message: 'このファイルへのアクセスが許可されていません。「アクセスを許可」から権限を付与してください。' } };
    }
    if (mediaCode === 404) {
      return { ok: false, error: { code: 'NO_PERMISSION', message: 'このファイルへのアクセスが許可されていません。「アクセスを許可」から権限を付与してください。' } };
    }
    if (mediaCode !== 200) {
      return { ok: false, error: { code: 'MEDIA_ERROR', message: '本文を取得できませんでした (HTTP ' + mediaCode + ')。' } };
    }

    // UTF-8 として明示的にデコード
    var content = mediaRes.getBlob().getDataAsString('UTF-8');
    return { ok: true, data: { name: name, content: content } };

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

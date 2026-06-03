/**
 * Markdown を CardService ウィジェット列へ「疑似整形」して変換する。
 *
 * 制約: CardService は HTML/iframe を描画できない。TextParagraph がサポートする
 * 限定タグ（<b> <i> <u> <s> <font color> <a href> <br>）の範囲で「整形されて見える」
 * 状態を作る。サイズ指定・等幅フォントは非対応なので、見出しは絵文字＋太字、
 * コードは color 付き等で代替する。表・画像は表現しきれないため簡略表示にする。
 *
 * 完全な整形は全画面ビューア（marked.js）に委ねる方針は維持する。
 */

/**
 * Markdown 本文をブロック単位でパースし、CardSection 配列を返す。
 * 呼び出し側はこれを Card に addSection していく。
 * @param {string} md 生 Markdown
 * @return {CardSection[]}
 */
function markdownToSections(md) {
  var lines = String(md).replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  var sections = [];
  var current = CardService.newCardSection();
  var widgetCount = 0;

  // セクションが肥大化しすぎないよう、一定ウィジェット数で区切る
  function flushIfNeeded() {
    if (widgetCount >= 90) {
      sections.push(current);
      current = CardService.newCardSection();
      widgetCount = 0;
    }
  }
  function addText(html) {
    current.addWidget(CardService.newTextParagraph().setText(html));
    widgetCount++;
    flushIfNeeded();
  }

  var i = 0;
  while (i < lines.length) {
    var line = lines[i];

    // フェンスドコードブロック ```
    var fence = line.match(/^\s*```/);
    if (fence) {
      var code = [];
      i++;
      while (i < lines.length && !/^\s*```/.test(lines[i])) {
        code.push(lines[i]);
        i++;
      }
      i++; // 閉じフェンスを飛ばす
      // 等幅は出せないので、グレー＋行頭インデント風で「コード塊」を示す
      var codeHtml = code.map(function (c) {
        return '<font color="#5f6368">' + escapeMdText_(c).replace(/ /g, '&nbsp;') + '</font>';
      }).join('<br>');
      addText('<font color="#80868b"><i>‹code›</i></font><br>' + (codeHtml || '<font color="#80868b">(空)</font>'));
      continue;
    }

    // 水平線 --- / *** / ___
    if (/^\s*([-*_])\s*\1\s*\1[\s\1]*$/.test(line)) {
      addText('<font color="#dadce0">──────────────</font>');
      i++;
      continue;
    }

    // 見出し # 〜 ######
    var h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      var level = h[1].length;
      var text = inlineMd_(h[2]);
      var prefix = level <= 1 ? '🔷 ' : (level === 2 ? '🔹 ' : '▪ ');
      // 見出しはサイズを変えられないので、太字＋（H1/H2 は color 強調）で階層感を出す
      var color = level <= 2 ? '#1a73e8' : '#3c4043';
      addText('<font color="' + color + '"><b>' + prefix + text + '</b></font>');
      i++;
      continue;
    }

    // 引用 >
    var quote = line.match(/^\s*>\s?(.*)$/);
    if (quote) {
      addText('<font color="#5f6368"><i>❝ ' + inlineMd_(quote[1]) + '</i></font>');
      i++;
      continue;
    }

    // 箇条書き - / * / +
    var ul = line.match(/^(\s*)[-*+]\s+(.*)$/);
    if (ul) {
      var indent = ul[1].replace(/\t/g, '  ').length;
      var bullet = indent >= 2 ? '&nbsp;&nbsp;◦ ' : '• ';
      addText(bullet + inlineMd_(ul[2]));
      i++;
      continue;
    }

    // 番号付きリスト 1. 2.
    var ol = line.match(/^(\s*)(\d+)[.)]\s+(.*)$/);
    if (ol) {
      var oindent = ol[1].replace(/\t/g, '  ').length;
      var pad = oindent >= 2 ? '&nbsp;&nbsp;' : '';
      addText(pad + '<b>' + ol[2] + '.</b> ' + inlineMd_(ol[3]));
      i++;
      continue;
    }

    // テーブル行（| a | b |）— 罫線行はスキップし、データ行は「a | b」で簡易表示
    if (/^\s*\|.*\|\s*$/.test(line)) {
      if (/^\s*\|[\s:|-]+\|\s*$/.test(line)) { // |---|---| 区切り行
        i++;
        continue;
      }
      var cells = line.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(function (c) {
        return inlineMd_(c.trim());
      });
      addText('<font color="#3c4043">' + cells.join('&nbsp;&nbsp;<font color="#dadce0">|</font>&nbsp;&nbsp;') + '</font>');
      i++;
      continue;
    }

    // 空行 → 段落区切り（連続空行は1つにまとめる）
    if (/^\s*$/.test(line)) {
      i++;
      continue;
    }

    // 通常段落（連続する非空行をまとめる）
    var para = [line];
    i++;
    while (i < lines.length &&
           !/^\s*$/.test(lines[i]) &&
           !/^(#{1,6})\s+/.test(lines[i]) &&
           !/^\s*```/.test(lines[i]) &&
           !/^\s*[-*+]\s+/.test(lines[i]) &&
           !/^\s*\d+[.)]\s+/.test(lines[i]) &&
           !/^\s*>\s?/.test(lines[i]) &&
           !/^\s*\|.*\|\s*$/.test(lines[i])) {
      para.push(lines[i]);
      i++;
    }
    addText(inlineMd_(para.join(' ')));
  }

  if (widgetCount > 0) sections.push(current);
  return sections;
}

/**
 * インライン記法（太字 / 斜体 / インラインコード / リンク）を限定 HTML に変換。
 * @param {string} s
 * @return {string}
 * @private
 */
function inlineMd_(s) {
  // まずエスケープ（タグ化け防止）。その後に許可タグだけ再構成する。
  var t = escapeMdText_(s);

  // インラインコード `code` → 赤系
  t = t.replace(/`([^`]+)`/g, function (m, c) {
    return '<font color="#c5221f">' + c + '</font>';
  });

  // 画像 ![alt](url) → 代替テキストのみ（CardService 段落内に画像は出せない）
  t = t.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g, function (m, alt) {
    return '<font color="#80868b"><i>🖼 ' + (alt || '画像') + '</i></font>';
  });

  // リンク [text](url) → <a>
  // CardService の <a> は http(s):// の絶対 URL のみ許可。
  // アンカー(#...)・相対パス・mailto 等はリンク化せずラベルだけ残す
  // （不正 URL は SafeHtmlFilter で弾かれランタイムエラーになるため）。
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g, function (m, label, url) {
    if (/^https?:\/\//i.test(url)) {
      return '<a href="' + url + '">' + label + '</a>';
    }
    return '<u>' + label + '</u>'; // リンク先は出せないので下線でリンクらしさだけ残す
  });

  // 太字 **text** / __text__
  t = t.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  t = t.replace(/__([^_]+)__/g, '<b>$1</b>');

  // 斜体 *text* / _text_
  t = t.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<i>$2</i>');
  t = t.replace(/(^|[^_])_([^_\s][^_]*)_/g, '$1<i>$2</i>');

  // 打消し ~~text~~
  t = t.replace(/~~([^~]+)~~/g, '<s>$1</s>');

  return t;
}

/**
 * CardService の TextParagraph に渡す前の最小エスケープ。
 * & < > と二重引用符を実体参照化（許可タグはこの後に inlineMd_ が組み立てる）。
 * @param {string} s
 * @return {string}
 * @private
 */
function escapeMdText_(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

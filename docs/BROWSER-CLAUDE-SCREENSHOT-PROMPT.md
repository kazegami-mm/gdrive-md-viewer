# ブラウザ拡張 Claude 用 スクリーンショット撮影プロンプト

**用途**: Claude for Chrome（ブラウザを操作できる Claude 拡張）に貼り付けて、Marketplace 掲載用
スクリーンショット 5 シーンを撮影させるためのプロンプト。拡張版はログイン済みの Chrome 上で動くため、
Google 認証の壁を越えられる。

**事前条件**:
- テスト用 Google アカウントでログイン済みの Chrome
- `demo-sample.md`（ID: `1SzErwN3ihMlNOAemxSPvlF9_KDl8n9c7`）が Drive にアップ済み
- アドオンがテストデプロイ＆インストール済み

> 撮影物は拡張版がダウンロードフォルダ等に保存する。撮影後、大将軍が `assets/screenshots/` に
> 命名規則どおり（`01-sidebar.png` 等）移動する。トリミング/リサイズが必要なら
> `docs/SCREENSHOT-GUIDE.md` の GDI+ スクリプトを使う。

---

## === 以下をコピーして Claude for Chrome に貼る ===

あなたはブラウザを操作できるアシスタントです。Google ドライブ用 Markdown アドオン
「Markdown Viewer for Drive」のストア掲載用スクリーンショットを撮影してください。

### 撮影対象の URL

- 全画面ビューア/エディタ（最新コード版）:
  `https://script.google.com/macros/s/AKfycbwhT5ctHjHTQ4BnKnPaVUReuTizq1G7iIjATOyFVwc/dev?fileId=1SzErwN3ihMlNOAemxSPvlF9_KDl8n9c7`
  （もしこの /dev URL が「アクセスできません」になる場合は、公開版を使う:
  `https://script.google.com/macros/s/AKfycbxNtGph7vhdm9tYBGM07VktASW3Mj0cg6VGJ_0NMDQUUqJ_VagwaR8hbHhkoxHFTS0t/exec?fileId=1SzErwN3ihMlNOAemxSPvlF9_KDl8n9c7`）
- Drive 上のファイル（サイドパネル撮影用）:
  `https://drive.google.com/file/d/1SzErwN3ihMlNOAemxSPvlF9_KDl8n9c7/view`

### 撮影前の注意

- ブラウザのズームは 100% にする。
- 各撮影の前に、画面が完全に読み込まれて整形描画が表示されてから撮る（白い状態で撮らない）。
- スクリーンショットは各シーンごとに撮り、どのシーンを撮ったか報告する。
- 個人情報（他人のファイル名・メールアドレス）が写り込まないよう、Drive 画面では `demo-sample.md`
  まわりだけが写るようにする。

### 撮影する 5 シーン

#### シーン 1: サイドパネルの疑似整形プレビュー
- Drive を開き、`demo-sample.md` をシングルクリックで選択。
- アドオンのサイドパネル（右側）に Markdown が疑似整形表示された状態を撮影。

#### シーン 2: 全画面ビューア（表示モード）
- 上記の全画面ビューア URL を開く。
- 「表示」モードで、見出し・表・コードブロックが整形描画された状態を撮影。
- 表とコードブロックが両方見える位置にスクロールしてから撮ると映える。

#### シーン 3: 全画面エディタ（分割モード）
- 同じ画面で上部の「分割」ボタンを押す。
- 左に Markdown ソース・右にライブプレビューが並んだ状態を撮影。

#### シーン 4: 保存の競合検出モーダル
- 同じ全画面ビューア URL を**2つのタブ**で開く（タブ A、タブ B）。
- タブ B を「編集」にして本文を1文字変更し、Ctrl+S で保存する。
- タブ A に戻り、本文を何か変更して Ctrl+S を押す。
- 「ファイルが競合しています」というモーダルが出たら、その状態を撮影。
- （モーダルが出ない場合は「競合モーダル未再現」と報告する。無理に撮らなくてよい。）

#### シーン 5（任意）: 狭幅表示
- ブラウザのウィンドウ幅を 700px 程度まで狭める。
- レイアウトが縦積みに切り替わった状態を撮影。

### 撮影後に報告してほしいこと

- 撮影できたシーンの一覧（シーン番号と簡単な説明）
- 各スクリーンショットの保存先（ダウンロードフォルダのファイル名など）
- 撮影できなかったシーンとその理由
- 整形描画・モード切替・保存・競合検出について、操作中に気づいた不具合があれば報告

## === コピーここまで ===

---

## 撮影物の後処理（大将軍）

1. 拡張版が保存した画像を `D:\Dev\Project\gdrive-md-viewer\assets\screenshots\` に移動
2. 命名規則: `01-sidebar.png` / `02-viewer.png` / `03-editor-split.png` / `04-conflict.png` / `05-narrow.png`
3. 1280×800 への整形が必要なら `docs/SCREENSHOT-GUIDE.md` の GDI+ スクリプト
4. 「将軍、撮れた画像を screenshots に置いた」と言えば、将軍がサイズ確認・必要なら一括リサイズする

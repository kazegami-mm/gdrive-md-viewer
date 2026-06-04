# スクリーンショット撮影ガイド

**対象アプリ**: Markdown Viewer for Drive
**最終更新日**: 2026-06-04
**目的**: Marketplace 掲載用スクリーンショット 5 枚を、迷わず撮影できるようにする手順書。

> Marketplace 推奨サイズ: **1280×800** または **640×400**（横長 16:10）。最低 1 枚、できれば 3〜5 枚。
> PNG または JPEG。撮影後に下記「6. トリミング/リサイズ」で 1280×800 に整える。

---

## 0. 事前準備（1 回だけ）

1. **デモ用 .md を Drive にアップロード**
   - ファイル: `assets/demo-sample.md`（このリポジトリに同梱。見出し・表・コード・引用・リストを網羅）
   - Google ドライブにそのままアップロード（マイドライブ直下で可）
2. **アドオンがテストデプロイ済みであること**を確認
   - 未デプロイなら `clasp open-script` →「デプロイ」→「テストデプロイ」→ アドオンとしてインストール
3. **Web アプリ URL を控える**
   - `/exec` URL: `https://script.google.com/macros/s/AKfycbxNtGph7vhdm9tYBGM07VktASW3Mj0cg6VGJ_0NMDQUUqJ_VagwaR8hbHhkoxHFTS0t/exec`
   - 全画面ビューアは `…/exec?fileId=<DriveのファイルID>` で直接開ける
   - ファイル ID は Drive で対象ファイルを開いた URL の `…/d/<ここ>/…` 部分
4. **ブラウザのズーム/ウィンドウ**
   - ズーム 100%、ウィンドウは横長に（後で 1280×800 に切るので、それ以上の解像度で撮る）
   - OS の撮影ツール: Windows は `Win + Shift + S`（範囲指定）→ クリップボード → ペイント等で保存

---

## 5 シーンの撮り方

### シーン 1: サイドパネルの疑似整形プレビュー
- Drive を開き、`demo-sample.md` を **シングルクリックで選択**（プレビューパネルが右に出る）
- アドオンのサイドパネルに Markdown が疑似整形表示された状態を撮影
- **訴求点**: ダウンロード不要でその場でプレビューできる

### シーン 2: 全画面ビューア（表示モード）
- ブラウザで `…/exec?fileId=<ID>` を開く（または サイドパネルの「全画面で整形表示」ボタン）
- **表示モード**（デフォルト）で、見出し・表・コードブロックが GitHub 風に整形された状態を撮影
- スクロール位置はコードブロックと表が両方見える辺りが映える

### シーン 3: 全画面エディタ（分割モード）
- 全画面ビューアで **「分割」モード**に切り替え
- 左に Markdown ソース・右にライブプレビューが並んだ状態を撮影
- **訴求点**: 本格的な編集体験

### シーン 4: 保存の競合検出モーダル
- **作り方**: 同じファイルを 2 つのタブ（またはエディタ + Drive 直接編集）で開く
  1. タブ A でエディタを開く
  2. タブ B（または別端末/Drive アプリ）で同じファイルを少し編集して保存
  3. タブ A で何か編集して `Ctrl + S` → **競合検出モーダルが出る**
- 「ファイルが競合しています」ダイアログが表示された瞬間を撮影
- **訴求点**: データを黙って壊さない安全設計（審査でも好印象）

### シーン 5（任意）: 狭幅 / モバイル表示
- ブラウザ幅を 720px 未満に狭める（または DevTools のデバイスモード）
- レイアウトが縦積み（`is-narrow`）に切り替わった状態を撮影

---

## 6. トリミング / リサイズ（1280×800 に整える）

撮影した PNG を 1280×800（または 640×400）に整える。Windows 標準環境のみで完結する方法:

### A. ペイントで手動トリミング
- ペイントで開く →「サイズ変更」または範囲選択 →「トリミング」→ 1280×800 目安で保存

### B. PowerShell（GDI+）で一括リサイズ
撮影済み PNG を 1280×800 のキャンバスに収める（余白は白）スクリプト例:

```powershell
Add-Type -AssemblyName System.Drawing
function To-Listing($src, $dst, $W=1280, $H=800) {
  $img = [System.Drawing.Image]::FromFile($src)
  $bmp = New-Object System.Drawing.Bitmap($W, $H)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.Clear([System.Drawing.Color]::White)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  # アスペクト比維持で内接
  $scale = [Math]::Min($W / $img.Width, $H / $img.Height)
  $nw = [int]($img.Width * $scale); $nh = [int]($img.Height * $scale)
  $x = [int](($W - $nw) / 2); $y = [int](($H - $nh) / 2)
  $g.DrawImage($img, $x, $y, $nw, $nh)
  $bmp.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose(); $img.Dispose()
}
# 例: To-Listing "C:\shots\scene2.png" "D:\Dev\Project\gdrive-md-viewer\assets\screenshots\02-viewer.png"
```

> 推奨: トリミングで余白なく 1280×800 に収まるよう撮るのが一番綺麗。
> B のスクリプトは「サイズが合わない撮影物を規定サイズに収める」保険。

---

## 7. 保存先と命名規則

撮影物は `assets/screenshots/` に以下の名前で保存（Marketplace アップロード時に順序が分かりやすい）:

| ファイル名 | シーン |
|------------|--------|
| `01-sidebar.png` | サイドパネル疑似整形 |
| `02-viewer.png` | 全画面ビューア（表示） |
| `03-editor-split.png` | 全画面エディタ（分割） |
| `04-conflict.png` | 競合検出モーダル |
| `05-narrow.png` | 狭幅表示（任意） |

---

## 8. チェックリスト

- [ ] `demo-sample.md` を Drive にアップロード済み
- [ ] アドオンがテストデプロイ済み
- [ ] シーン 1: サイドパネル
- [ ] シーン 2: 全画面ビューア（表示）
- [ ] シーン 3: 全画面エディタ（分割）
- [ ] シーン 4: 競合検出モーダル
- [ ] （任意）シーン 5: 狭幅表示
- [ ] すべて 1280×800（または 640×400）に整形
- [ ] `assets/screenshots/` に命名規則どおり保存
- [ ] 個人情報（メールアドレス・他人のファイル名等）が写り込んでいないか確認

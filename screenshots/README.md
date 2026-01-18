# スクリーンショット撮影ガイド

このフォルダには、画面項目定義書で使用する各画面のスクリーンショットを格納します。

## 📸 手動撮影の手順

### 1. 開発サーバーを起動

```bash
npm run dev
```

サーバーが起動したら、ブラウザで http://localhost:3000 を開きます。

### 2. 各画面のスクリーンショットを撮影

以下の順番で各画面を開いて、スクリーンショットを撮影してください。

| # | 画面名 | URL | ファイル名 |
|---|--------|-----|-----------|
| 1 | Dashboard | http://localhost:3000/ | `01-dashboard.png` |
| 2 | Daily | http://localhost:3000/daily | `02-daily.png` |
| 3 | Attendance | http://localhost:3000/attendance | `03-attendance.png` |
| 4 | Projects | http://localhost:3000/projects | `04-projects.png` |
| 5 | Calendar | http://localhost:3000/calendar | `05-calendar.png` |
| 6 | Reports | http://localhost:3000/reports | `06-reports.png` |
| 7 | Holidays | http://localhost:3000/holidays | `07-holidays.png` |
| 8 | Routine | http://localhost:3000/routine | `08-routine.png` |
| 9 | EVM | http://localhost:3000/evm | `09-evm.png` |
| 10 | Salary | http://localhost:3000/salary | `10-salary.png` |
| 11 | Sleep | http://localhost:3000/sleep | `11-sleep.png` |
| 12 | Kadmin | http://localhost:3000/kadmin | `12-kadmin.png` |

### 3. 撮影のポイント

- **ブラウザのサイズ**: 1920 x 1080 または 1440 x 900 推奨
- **フルページスクショ**: ページ全体が見えるように撮影
- **データあり状態**: 可能な限りデータが入っている状態で撮影
- **画像形式**: PNG形式で保存

### 4. 保存場所

撮影したスクリーンショットは、このフォルダ（`screenshots/`）に保存してください。

## 🤖 自動撮影（オプション）

開発サーバーが起動している状態で、以下のコマンドを実行すると自動で全画面のスクリーンショットを撮影できます。

```bash
npx tsx scripts/take-screenshots.ts
```

**注意**: 自動撮影を実行する前に、必ず開発サーバーが起動していることを確認してください。

## 📝 撮影後

スクリーンショット撮影後、画面項目定義書（`画面項目定義書.md`）を確認してください。
各画面の「画面イメージ」セクションに、撮影したスクリーンショットが自動的に表示されます。

---

## トラブルシューティング

### 画像が表示されない場合

1. ファイル名が正しいか確認（例: `01-dashboard.png`）
2. ファイルがこのフォルダに保存されているか確認
3. 画像形式がPNGであることを確認

### 自動撮影が失敗する場合

1. 開発サーバーが起動しているか確認: `curl http://localhost:3000`
2. Playwrightが正しくインストールされているか確認: `npx playwright --version`
3. 手動撮影に切り替えることを推奨

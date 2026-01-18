import { chromium } from '@playwright/test';
import { mkdir } from 'fs/promises';
import { join } from 'path';

const SCREENSHOTS_DIR = join(process.cwd(), 'screenshots');
const BASE_URL = 'http://localhost:3050';

// 全画面の定義
const pages = [
  { name: '01-dashboard', path: '/', waitFor: 'text=Dashboard' },
  { name: '02-daily', path: '/daily', delay: 5000 },
  { name: '03-attendance', path: '/attendance', waitFor: 'text=Attendance' },
  { name: '04-projects', path: '/projects', waitFor: 'text=Projects' },
  { name: '05-calendar', path: '/calendar', waitFor: 'text=Calendar' },
  { name: '06-reports', path: '/reports', waitFor: 'text=Reports' },
  { name: '07-holidays', path: '/holidays', waitFor: 'text=Holidays' },
  { name: '08-routine', path: '/routine', waitFor: 'text=Routine Settings' },
  { name: '09-evm', path: '/evm', waitFor: 'text=EVM' },
  { name: '10-salary', path: '/salary', waitFor: 'text=Salary' },
  { name: '11-sleep', path: '/sleep', waitFor: 'text=Sleep' },
  { name: '12-kadmin', path: '/kadmin', waitFor: 'text=Kadmin' },
];

async function takeScreenshots() {
  console.log('🚀 スクリーンショット撮影を開始します...\n');

  // スクリーンショット保存ディレクトリを作成
  await mkdir(SCREENSHOTS_DIR, { recursive: true });

  // ブラウザを起動
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  for (const { name, path, waitFor, delay } of pages) {
    try {
      console.log(`📸 ${name} を撮影中...`);

      // ページにアクセス
      await page.goto(`${BASE_URL}${path}`, {
        waitUntil: 'load',
        timeout: 60000
      });

      // 画面固有の要素が表示されるまで待機
      if (waitFor) {
        await page.waitForSelector(waitFor, { timeout: 10000 });
      }

      // 追加の待機時間（動的コンテンツの読み込み用）
      if (delay) {
        await page.waitForTimeout(delay);
      } else {
        await page.waitForTimeout(1000);
      }

      // スクリーンショットを撮影
      const screenshotPath = join(SCREENSHOTS_DIR, `${name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      console.log(`✅ ${name}.png を保存しました\n`);
    } catch (error) {
      console.error(`❌ ${name} の撮影に失敗しました:`, error);
      console.log('');
    }
  }

  await browser.close();
  console.log('🎉 全てのスクリーンショットの撮影が完了しました！');
  console.log(`📁 保存先: ${SCREENSHOTS_DIR}`);
}

takeScreenshots().catch(console.error);

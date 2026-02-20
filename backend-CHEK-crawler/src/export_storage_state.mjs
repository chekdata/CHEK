import { chromium } from 'playwright';

function usage() {
  console.log('Usage: node src/export_storage_state.mjs <url> <outPath>');
  console.log('Example: node src/export_storage_state.mjs https://weibo.com ./weibo.storage.json');
}

async function main() {
  const [, , url, outPath] = process.argv;
  if (!url || !outPath) {
    usage();
    process.exit(2);
  }

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });

  console.log('Please finish login in the opened browser window.');
  console.log('When you see you are logged in, return to this terminal and press ENTER.');
  await new Promise((resolve) => process.stdin.once('data', resolve));

  await context.storageState({ path: outPath });
  console.log(`Saved storageState to ${outPath}`);

  await browser.close();
}

main().catch((e) => {
  console.error(String(e || ''));
  process.exit(1);
});


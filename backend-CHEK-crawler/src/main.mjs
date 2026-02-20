import cron from 'node-cron';
import { chromium } from 'playwright';
import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';
import { ingestExternalPost } from './platform/ingest.mjs';
import { crawlWeiboComplaints } from './platform/weibo.mjs';
import { crawlXhsComplaints } from './platform/xhs.mjs';

const EnvSchema = z.object({
  CHEK_CONTENT_BASE_URL: z.string().min(1),
  CHEK_INGEST_TOKEN: z.string().min(1),
  CRON: z.string().min(1).default('0 */6 * * *'),
  MAX_ITEMS_PER_RUN: z.coerce.number().int().min(1).max(200).default(40),
  RUN_ONCE: z
    .string()
    .optional()
    .transform((v) => String(v || '').trim().toLowerCase() === 'true'),
  HEADLESS: z
    .string()
    .optional()
    .transform((v) => (String(v || '').trim() ? String(v).trim().toLowerCase() !== 'false' : true)),
  WEIBO_STORAGE_STATE_PATH: z.string().optional().default(''),
  XHS_STORAGE_STATE_PATH: z.string().optional().default(''),
  KEYWORDS: z
    .string()
    .optional()
    .default('潮汕 投诉,汕头 宰客,潮州 避雷,揭阳 被坑,潮汕 旅游 被宰,汕头 旅游 投诉'),
});

function loadEnvFile(fileName) {
  const p = path.join(process.cwd(), fileName);
  if (!fs.existsSync(p)) return;
  const raw = fs.readFileSync(p, 'utf8');
  for (const line of raw.split('\n')) {
    const s = String(line || '').trim();
    if (!s) continue;
    if (s.startsWith('#')) continue;
    const i = s.indexOf('=');
    if (i <= 0) continue;
    const k = s.slice(0, i).trim();
    const v = s.slice(i + 1).trim();
    if (!k) continue;
    if (process.env[k] == null) process.env[k] = v;
  }
}

function readEnv() {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid env: ${msg}`);
  }
  const env = parsed.data;
  const keywords = String(env.KEYWORDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return { ...env, keywords };
}

function nowIso() {
  return new Date().toISOString();
}

async function runOnce(env) {
  const startedAt = Date.now();
  const runId = `${Date.now()}`;
  const log = (obj) => console.log(JSON.stringify({ ts: nowIso(), runId, ...obj }, null, 0));

  log({ level: 'info', msg: 'crawler_run_start', cron: env.CRON, maxItemsPerRun: env.MAX_ITEMS_PER_RUN });

  const browser = await chromium.launch({
    headless: env.HEADLESS,
    args: ['--disable-blink-features=AutomationControlled'],
  });
  try {
    const tasks = [
      crawlWeiboComplaints({
        browser,
        keywords: env.keywords,
        maxItems: Math.floor(env.MAX_ITEMS_PER_RUN / 2),
        storageStatePath: env.WEIBO_STORAGE_STATE_PATH,
        log,
      }),
      crawlXhsComplaints({
        browser,
        keywords: env.keywords,
        maxItems: Math.ceil(env.MAX_ITEMS_PER_RUN / 2),
        storageStatePath: env.XHS_STORAGE_STATE_PATH,
        log,
      }),
    ];

    const results = await Promise.allSettled(tasks);
    const items = [];
    for (const r of results) {
      if (r.status === 'fulfilled') items.push(...r.value);
      else log({ level: 'error', msg: 'crawler_task_failed', error: String(r.reason || '') });
    }

    let ok = 0;
    let skipped = 0;
    let failed = 0;
    for (const item of items.slice(0, env.MAX_ITEMS_PER_RUN)) {
      try {
        const resp = await ingestExternalPost(env.CHEK_CONTENT_BASE_URL, env.CHEK_INGEST_TOKEN, item);
        if (resp?.status === 'ok') ok += 1;
        else if (resp?.status === 'skipped') skipped += 1;
        else failed += 1;
      } catch (e) {
        failed += 1;
        log({
          level: 'error',
          msg: 'ingest_failed',
          sourcePlatform: item.sourcePlatform,
          sourceId: item.sourceId,
          error: String(e || ''),
        });
      }
    }

    log({
      level: 'info',
      msg: 'crawler_run_done',
      fetched: items.length,
      ingestedOk: ok,
      ingestedSkipped: skipped,
      ingestedFailed: failed,
      elapsedMs: Date.now() - startedAt,
    });
  } finally {
    await browser.close();
  }
}

async function main() {
  loadEnvFile('.env.local');
  loadEnvFile('.env');
  const env = readEnv();

  await runOnce(env);

  if (env.RUN_ONCE) return;

  cron.schedule(env.CRON, () => {
    runOnce(env).catch((e) => {
      console.error(JSON.stringify({ ts: nowIso(), level: 'error', msg: 'crawler_run_crash', error: String(e || '') }));
    });
  });

  // Keep process alive (cron uses timers, but be explicit).
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, 60_000));
  }
}

main().catch((e) => {
  console.error(JSON.stringify({ ts: nowIso(), level: 'error', msg: 'crawler_boot_failed', error: String(e || '') }));
  process.exit(1);
});


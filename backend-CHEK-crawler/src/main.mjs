import cron from 'node-cron';
import { chromium } from 'playwright';
import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';
import { ingestExternalPost } from './platform/ingest.mjs';
import { crawlWeiboByKeyword } from './platform/weibo.mjs';
import { crawlXhsByKeyword } from './platform/xhs.mjs';
import { heuristicComplaintScore } from './platform/score.mjs';
import { upsertCrawlerQueries, sampleCrawlerQueries, reportCrawlerQueries } from './platform/query_api.mjs';

const EnvSchema = z.object({
  CHEK_CONTENT_BASE_URL: z.string().min(1),
  CHEK_INGEST_TOKEN: z.string().min(1),
  CRON: z.string().min(1).default('0 */6 * * *'),
  MAX_ITEMS_PER_RUN: z.coerce.number().int().min(1).max(200).default(40),
  QUERY_LIMIT_PER_PLATFORM: z.coerce.number().int().min(1).max(30).default(4),
  USE_QUERY_BANDIT: z
    .string()
    .optional()
    .transform((v) => String(v || '').trim().toLowerCase() !== 'false'),
  AI_SCORE_THRESHOLD: z.coerce.number().min(0).max(1).default(0.55),
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
    const perPlatformMax = Math.max(1, Math.floor(env.MAX_ITEMS_PER_RUN / 2));

    // Ensure seed queries exist in content service for both platforms.
    if (env.USE_QUERY_BANDIT) {
      await Promise.allSettled([
        upsertCrawlerQueries(env.CHEK_CONTENT_BASE_URL, env.CHEK_INGEST_TOKEN, 'WEIBO', env.keywords),
        upsertCrawlerQueries(env.CHEK_CONTENT_BASE_URL, env.CHEK_INGEST_TOKEN, 'XHS', env.keywords),
      ]);
    }

    let weiboQueries = env.keywords;
    let xhsQueries = env.keywords;
    if (env.USE_QUERY_BANDIT) {
      try {
        const q = await sampleCrawlerQueries(
          env.CHEK_CONTENT_BASE_URL,
          env.CHEK_INGEST_TOKEN,
          'WEIBO',
          env.QUERY_LIMIT_PER_PLATFORM
        );
        if (q && q.length > 0) weiboQueries = q;
      } catch (e) {
        log({ level: 'warn', msg: 'query_sample_failed', platform: 'WEIBO', error: String(e || '') });
      }
      try {
        const q = await sampleCrawlerQueries(
          env.CHEK_CONTENT_BASE_URL,
          env.CHEK_INGEST_TOKEN,
          'XHS',
          env.QUERY_LIMIT_PER_PLATFORM
        );
        if (q && q.length > 0) xhsQueries = q;
      } catch (e) {
        log({ level: 'warn', msg: 'query_sample_failed', platform: 'XHS', error: String(e || '') });
      }
    }

    const items = [];
    const rewards = { WEIBO: [], XHS: [] };

    async function runPlatform(platform, queries, crawlFn, storageStatePath) {
      const qList = Array.isArray(queries) ? queries : [];
      const seen = new Set();
      for (const q of qList) {
        if (items.length >= env.MAX_ITEMS_PER_RUN) break;
        const kw = String(q || '').trim();
        if (!kw) continue;
        const fetched = await crawlFn({ browser, keyword: kw, maxItems: perPlatformMax, storageStatePath, log });

        let trials = 0;
        let accepted = 0;
        let acceptedMean = 0;

        for (const it of fetched) {
          if (!it) continue;
          const key = `${it.sourcePlatform}:${it.sourceId}`;
          if (seen.has(key)) continue;
          seen.add(key);
          trials += 1;

          const s = heuristicComplaintScore({ title: it.title, body: it.body });
          const score = Number(s.score || 0);
          const ok = score >= env.AI_SCORE_THRESHOLD;
          if (!ok) continue;

          accepted += 1;
          acceptedMean += score;

          const tags = Array.isArray(it.tags) ? it.tags : [];
          const aiTags = [];
          if (score >= 0.8) aiTags.push('AI高置信');
          else if (score >= 0.65) aiTags.push('AI较可信');
          else aiTags.push('AI筛选');

          items.push({
            ...it,
            tags: Array.from(new Set([...tags, ...aiTags])),
          });
          if (items.length >= env.MAX_ITEMS_PER_RUN) break;
        }

        const reward = trials > 0 ? Math.max(0, Math.min(1, accepted / trials)) : 0;
        const mean = accepted > 0 ? acceptedMean / accepted : 0;
        rewards[platform].push({ query: kw, reward: reward * 0.8 + mean * 0.2, trials: Math.max(1, trials) });
        log({ level: 'info', msg: 'query_done', platform, query: kw, fetched: fetched.length, trials, accepted, reward });
      }
    }

    await Promise.allSettled([
      runPlatform('WEIBO', weiboQueries, crawlWeiboByKeyword, env.WEIBO_STORAGE_STATE_PATH),
      runPlatform('XHS', xhsQueries, crawlXhsByKeyword, env.XHS_STORAGE_STATE_PATH),
    ]);

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

    if (env.USE_QUERY_BANDIT) {
      await Promise.allSettled([
        reportCrawlerQueries(env.CHEK_CONTENT_BASE_URL, env.CHEK_INGEST_TOKEN, 'WEIBO', rewards.WEIBO),
        reportCrawlerQueries(env.CHEK_CONTENT_BASE_URL, env.CHEK_INGEST_TOKEN, 'XHS', rewards.XHS),
      ]);
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


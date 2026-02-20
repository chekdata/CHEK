import { safeText, uniqBy, nowIso, normalizeUrl, clipTextPreserveNewlines } from './util.mjs';

function buildSearchUrl(keyword) {
  const k = encodeURIComponent(String(keyword || '').trim());
  return `https://www.xiaohongshu.com/search_result?keyword=${k}&type=51`;
}

function toExploreUrl(href) {
  const h = String(href || '').trim();
  if (!h) return '';
  if (h.startsWith('http://') || h.startsWith('https://')) return h;
  if (h.startsWith('/')) return `https://www.xiaohongshu.com${h}`;
  return `https://www.xiaohongshu.com/${h}`;
}

function extractNoteIdFromUrl(url) {
  const u = String(url || '');
  const m = u.match(/\/explore\/([a-f0-9]{16,32})/i);
  return m ? m[1] : '';
}

async function collectSearchResults(page, keyword, maxLinks, log) {
  const url = buildSearchUrl(keyword);
  const respPromise = page.waitForResponse(
    (r) => r.url().includes('/api/sns/web/v1/search/notes') && r.request().method() === 'POST',
    { timeout: 20_000 }
  );

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(1200);

  let j = null;
  try {
    const resp = await respPromise;
    j = await resp.json();
  } catch {
    j = null;
  }

  const items = Array.isArray(j?.data?.items) ? j.data.items : [];
  const normalized = items
    .map((it) => {
      const id = String(it?.id || '').trim();
      const token = String(it?.xsec_token || '').trim();
      const title = String(it?.note_card?.display_title || it?.note_card?.title || '').trim();
      if (!id || !token) return null;
      const noteUrl = `https://www.xiaohongshu.com/explore/${id}?xsec_token=${encodeURIComponent(
        token
      )}&xsec_source=pc_search`;
      return { url: noteUrl, hint: safeText(title, 80) };
    })
    .filter(Boolean);

  const uniq = uniqBy(normalized, (x) => x.url);
  if (uniq.length === 0) {
    const title = await page.title().catch(() => '');
    log({ level: 'warn', msg: 'xhs_search_empty', keyword, url, pageTitle: title });
  }
  return uniq.slice(0, maxLinks);
}

async function extractNoteDetail(page, url, hint) {
  const noteId = extractNoteIdFromUrl(url);

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(1000);

  let rawTitle = '';
  let rawText = '';
  const initialState = await page.evaluate(() => window.__INITIAL_STATE__ || null).catch(() => null);
  if (initialState) {
    const ex = extractXhsFromJson(initialState, noteId);
    rawTitle = ex?.title || '';
    rawText = ex?.text || '';
  }

  if (!rawTitle || !rawText) {
    const fallback = await page.evaluate(() => {
      const title =
        (document.querySelector('h1')?.textContent || '').trim() ||
        (document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '').trim() ||
        '';
      const desc =
        (document.querySelector('meta[name="description"]')?.getAttribute('content') || '').trim() ||
        (document.querySelector('meta[property="og:description"]')?.getAttribute('content') || '').trim() ||
        '';
      const bodyText =
        (document.querySelector('article')?.textContent || '').trim() ||
        (document.querySelector('[data-note-detail]')?.textContent || '').trim() ||
        '';
      return { title, desc, bodyText };
    });
    rawTitle = rawTitle || fallback.title || hint || '';
    rawText = rawText || fallback.desc || fallback.bodyText || hint || '';
  }

  if (rawText && !rawTitle) rawTitle = safeText(rawText.split('\n')[0], 120);
  const title = safeText(rawTitle || hint || '外部投诉帖', 120);
  const main = clipTextPreserveNewlines(rawText, 3600);
  const footer = `\n\n- 来源：小红书\n- 原文链接：${normalizeUrl(url)}\n- 抓取时间：${nowIso()}\n`;
  const body = (main + footer).slice(0, 3990);
  return { title, body };
}

function stripHtml(s) {
  return String(s || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function flattenToText(v, depth = 0) {
  if (depth > 6) return '';
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) return v.map((x) => flattenToText(x, depth + 1)).filter(Boolean).join('\n');
  if (typeof v === 'object') {
    return (
      flattenToText(v.text, depth + 1) ||
      flattenToText(v.content, depth + 1) ||
      flattenToText(v.desc, depth + 1) ||
      flattenToText(v.description, depth + 1) ||
      flattenToText(v.note, depth + 1) ||
      ''
    );
  }
  return '';
}

function findNoteCardDeep(root, noteId) {
  const target = String(noteId || '').trim();
  if (!target) return null;
  const q = [root];
  const seen = new Set();
  while (q.length) {
    const cur = q.shift();
    if (!cur || typeof cur !== 'object') continue;
    if (seen.has(cur)) continue;
    seen.add(cur);

    const nid = cur.note_id || cur.noteId || cur.id || cur.noteID;
    if (nid != null && String(nid) === target) return cur;

    if (Array.isArray(cur)) {
      for (const it of cur) q.push(it);
      continue;
    }
    for (const k of Object.keys(cur)) q.push(cur[k]);
  }
  return null;
}

function extractXhsFromJson(json, noteId) {
  const card =
    findNoteCardDeep(json, noteId) ||
    json?.data?.note ||
    json?.data?.note_card ||
    json?.data?.items?.[0]?.note_card ||
    json?.data?.items?.[0]?.note ||
    json?.data?.item?.note_card ||
    json?.data?.item?.note ||
    null;
  const title =
    safeText(
      card?.title ||
        card?.display_title ||
        card?.note_title ||
        card?.share_info?.title ||
        card?.note_card?.display_title ||
        '',
      120
    ) || '';

  const raw =
    flattenToText(card?.desc) ||
    flattenToText(card?.description) ||
    flattenToText(card?.content) ||
    flattenToText(card?.share_info?.content) ||
    flattenToText(card?.note_card?.desc) ||
    flattenToText(card?.note_card?.content) ||
    '';
  const text = stripHtml(raw);
  return { title, text };
}

export async function crawlXhsComplaints({ browser, keywords, maxItems, storageStatePath, log }) {
  if (!storageStatePath) {
    log({ level: 'warn', msg: 'xhs_skip_missing_storage_state' });
    return [];
  }
  const context = await browser.newContext({
    storageState: storageStatePath,
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    viewport: { width: 1365, height: 900 },
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  });
  await context.addInitScript(() => {
    try {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    } catch {}
    try {
      // eslint-disable-next-line no-undef
      window.chrome = window.chrome || { runtime: {} };
    } catch {}
  });
  const page = await context.newPage();
  const out = [];
  try {
    for (const kw of keywords) {
      if (out.length >= maxItems) break;
      const links = await collectSearchResults(page, kw, Math.max(6, maxItems), log);
      for (const l of links) {
        if (out.length >= maxItems) break;
        const sourceUrl = toExploreUrl(l.url);
        const sourceId = extractNoteIdFromUrl(sourceUrl);
        if (!sourceId) continue;
        const detail = await extractNoteDetail(page, sourceUrl, l.hint);
        out.push({
          sourcePlatform: 'XHS',
          sourceId,
          sourceUrl,
          title: detail.title,
          body: detail.body,
          tags: ['投诉', '避坑', '外部来源', '小红书'],
          authorUserOneId: '投诉雷达',
        });
      }
    }
  } finally {
    await page.close().catch(() => {});
    await context.close().catch(() => {});
  }
  return uniqBy(out, (x) => `${x.sourcePlatform}:${x.sourceId}`).slice(0, maxItems);
}


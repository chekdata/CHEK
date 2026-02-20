import { safeText, uniqBy, nowIso, normalizeUrl, clipTextPreserveNewlines } from './util.mjs';

function buildSearchUrl(keyword) {
  const k = encodeURIComponent(String(keyword || '').trim());
  return `https://s.weibo.com/weibo?q=${k}`;
}

function toAbsoluteWeiboUrl(href) {
  const h = String(href || '').trim();
  if (!h) return '';
  if (h.startsWith('http://') || h.startsWith('https://')) return h;
  if (h.startsWith('//')) return `https:${h}`;
  if (h.startsWith('/')) return `https://weibo.com${h}`;
  return `https://weibo.com/${h}`;
}

function extractWeiboMid(url) {
  const u = String(url || '');
  const m1 = u.match(/\/detail\/([A-Za-z0-9]+)/);
  if (m1) return m1[1];
  const m2 = u.match(/weibo\.com\/\d+\/([A-Za-z0-9]+)/);
  if (m2) return m2[1];
  return '';
}

async function collectSearchResults(page, keyword, maxLinks, log) {
  const url = buildSearchUrl(keyword);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(1600);

  const current = page.url();
  if (current.includes('passport.weibo.com/visitor')) {
    log({ level: 'warn', msg: 'weibo_redirect_visitor', keyword, url: current });
    return [];
  }

  const links = await page.evaluate(() => {
    const out = [];
    const anchors = Array.from(document.querySelectorAll('a[href]'));
    for (const a of anchors) {
      const href = a.getAttribute('href') || '';
      if (!href) continue;
      if (href.includes('passport.weibo.com')) continue;
      if (href.includes('s.weibo.com')) continue;
      if (!href.includes('weibo.com')) continue;
      const text = (a.textContent || '').trim();
      out.push({ href, text });
    }
    return out;
  });

  const normalized = links
    .map((x) => ({
      url: toAbsoluteWeiboUrl(x.href),
      hint: safeText(x.text, 80),
    }))
    .filter((x) => x.url.includes('weibo.com'));

  const uniq = uniqBy(normalized, (x) => x.url);
  if (uniq.length === 0) {
    const title = await page.title().catch(() => '');
    log({ level: 'warn', msg: 'weibo_search_empty', keyword, url, pageTitle: title });
  }
  return uniq.slice(0, maxLinks);
}

async function extractDetail(page, url, hint) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(600);

  const mid = extractWeiboMid(url);
  let rawText = '';

  if (mid) {
    const ajax = await page.evaluate(async (id) => {
      try {
        const r = await fetch(`https://weibo.com/ajax/statuses/show?id=${encodeURIComponent(id)}`, {
          credentials: 'include',
        });
        const text = await r.text();
        return { status: r.status, text };
      } catch (e) {
        return { status: 0, text: String(e || '') };
      }
    }, mid);

    if (ajax && ajax.status === 200) {
      try {
        const j = JSON.parse(String(ajax.text || ''));
        const d = j?.data || {};
        rawText = String(d?.text_raw || '') || stripHtml(String(d?.text || ''));
      } catch {
        rawText = '';
      }
    }
  }

  let rawTitle = '';
  if (rawText) rawTitle = safeText(rawText.split('\n')[0], 120);
  if (!rawTitle || !rawText) {
    const fallback = await page.evaluate(() => {
      const title =
        (document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '').trim() ||
        (document.title || '').trim();
      const desc =
        (document.querySelector('meta[name="description"]')?.getAttribute('content') || '').trim() ||
        (document.querySelector('meta[property="og:description"]')?.getAttribute('content') || '').trim();
      const bodyText =
        (document.querySelector('article')?.textContent || '').trim() ||
        (document.querySelector('.detail_wbtext_4CRf9')?.textContent || '').trim() ||
        (document.querySelector('[node-type="feed_list_content"]')?.textContent || '').trim() ||
        '';
      return { title, desc, bodyText };
    });
    rawTitle = rawTitle || fallback.title || hint || '';
    rawText = rawText || fallback.desc || fallback.bodyText || hint || '';
  }

  if (rawText) {
    const t = String(rawTitle || '').trim();
    if (!t || t.includes('微博正文') || t.endsWith('- 微博') || t.endsWith(' - 微博')) {
      rawTitle = safeText(rawText, 120);
    }
  }

  const title = safeText(rawTitle || hint || '外部投诉帖', 120);
  const main = clipTextPreserveNewlines(rawText, 3600);
  const footer = `\n\n- 来源：微博\n- 原文链接：${normalizeUrl(url)}\n- 抓取时间：${nowIso()}\n`;
  const body = (main + footer).slice(0, 3990);
  return { title, body };
}

function stripHtml(s) {
  return String(s || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

export async function crawlWeiboComplaints({ browser, keywords, maxItems, storageStatePath, log }) {
  if (!storageStatePath) {
    log({ level: 'warn', msg: 'weibo_skip_missing_storage_state' });
    return [];
  }
  const context = await browser.newContext({ storageState: storageStatePath });
  const page = await context.newPage();
  const out = [];
  try {
    for (const kw of keywords) {
      if (out.length >= maxItems) break;
      const links = await collectSearchResults(page, kw, Math.max(6, maxItems), log);
      for (const l of links) {
        if (out.length >= maxItems) break;
        const sourceUrl = toAbsoluteWeiboUrl(l.url);
        const sourceId = extractWeiboMid(sourceUrl);
        if (!sourceId) continue;
        const detail = await extractDetail(page, sourceUrl, l.hint);
        out.push({
          sourcePlatform: 'WEIBO',
          sourceId,
          sourceUrl,
          title: detail.title,
          body: detail.body,
          tags: ['投诉', '避坑', '外部来源', '微博'],
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


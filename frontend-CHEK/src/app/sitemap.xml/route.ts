import { serverGet } from '@/lib/server-api';
import { getSiteUrl } from '@/lib/site';
import type { PostDTO, TagDTO, WikiEntryDTO } from '@/lib/api-types';

function xmlEscape(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

async function paginate<T extends { [k: string]: any }>(path: string, idKey: string) {
  const out: T[] = [];
  let cursor: number | null = null;
  for (let i = 0; i < 20; i++) {
    const url: string = `${path}${path.includes('?') ? '&' : '?'}limit=200${cursor ? `&cursor=${cursor}` : ''}`;
    const page = (await serverGet<T[]>(url, { revalidateSeconds: 300 })) || [];
    if (page.length === 0) break;
    out.push(...page);
    const last = page[page.length - 1];
    const next = Number(last?.[idKey]);
    if (!Number.isFinite(next) || next <= 0) break;
    cursor = next;
  }
  return out;
}

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const site = getSiteUrl(request);
  const [wiki, posts, tags] = await Promise.all([
    paginate<WikiEntryDTO>('/api/chek-content/v1/public/ssg/wiki', 'entryId'),
    paginate<PostDTO>('/api/chek-content/v1/public/ssg/posts', 'postId'),
    paginate<TagDTO>('/api/chek-content/v1/public/ssg/tags', 'tagId'),
  ]);

  const urls: Array<{ loc: string; lastmod?: string }> = [];
  urls.push({ loc: `${site}/wiki` });
  urls.push({ loc: `${site}/letter` });

  for (const e of wiki) {
    if (!e?.isPublic || !e?.isIndexable) continue;
    if (!e?.slug) continue;
    urls.push({
      loc: `${site}/wiki/${encodeURIComponent(e.slug)}`,
      lastmod: e.updatedAt || e.publishedAt || e.createdAt || undefined,
    });
  }
  for (const p of posts) {
    if (!p?.isPublic || !p?.isIndexable) continue;
    urls.push({
      loc: `${site}/p/${p.postId}`,
      lastmod: p.updatedAt || p.createdAt || undefined,
    });
  }
  for (const t of tags) {
    if (!t?.name) continue;
    urls.push({
      loc: `${site}/tag/${encodeURIComponent(t.name)}`,
      lastmod: t.createdAt || undefined,
    });
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map((u) => {
        const loc = xmlEscape(u.loc);
        const lastmod = u.lastmod ? `<lastmod>${xmlEscape(new Date(u.lastmod).toISOString())}</lastmod>` : '';
        return `  <url><loc>${loc}</loc>${lastmod}</url>`;
      })
      .join('\n') +
    `\n</urlset>\n`;

  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}

import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { serverGet } from '@/lib/server-api';
import type { PostDTO, WikiEntryDTO } from '@/lib/api-types';
import {
  absoluteUrl,
  extractFirstImageUrlFromMarkdown,
  isBadShareImageUrl,
  makeDescription,
  makePageMetadata,
  normalizeMetaUrl,
} from '@/lib/seo';
import { MarkdownBody } from '@/components/MarkdownBody';
import { PostCard } from '@/components/PostCard';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug || '');
  const entry = await serverGet<WikiEntryDTO>(`/api/chek-content/v1/wiki/entries/bySlug/${encodeURIComponent(slug)}`, {
    revalidateSeconds: 120,
  });
  if (!entry) {
    return makePageMetadata({
      title: '有知 - CHEK',
      description: '有知：潮汕旅行百科与要点整理。',
      path: '/wiki',
      ogType: 'website',
      noindex: true,
    });
  }

  const noindex = !entry.isPublic || !entry.isIndexable;
  const description = makeDescription(entry.summary || entry.body || '', 160);
  const rawImg = extractFirstImageUrlFromMarkdown(entry.body || '');
  const shareImageUrl = (() => {
    const u = normalizeMetaUrl(rawImg);
    if (!u || isBadShareImageUrl(u)) return '';
    return u;
  })();

  return makePageMetadata({
    title: `${entry.title} - 有知 | CHEK`,
    description,
    path: `/wiki/${encodeURIComponent(entry.slug)}`,
    ogType: 'article',
    noindex,
    keywords: entry.tags || undefined,
    publishedTime: entry.publishedAt || entry.createdAt,
    modifiedTime: entry.updatedAt || entry.publishedAt || entry.createdAt,
    imageUrl: shareImageUrl || undefined,
    imageAlt: entry.title,
    shareTitle: `${entry.title} | 有知 · 潮客 CHEK`,
  });
}

export default async function WikiDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug || '');

  const entry = await serverGet<WikiEntryDTO>(
    `/api/chek-content/v1/wiki/entries/bySlug/${encodeURIComponent(slug)}`,
    { revalidateSeconds: 120 }
  );
  if (!entry) notFound();
  if (!entry.isPublic) notFound();

  const tag = entry.tags && entry.tags.length > 0 ? entry.tags[0] : '';
  const qs = tag ? `?tags=${encodeURIComponent(tag)}&limit=10` : '?limit=10';
  const relatedPosts =
    (await serverGet<PostDTO[]>(`/api/chek-content/v1/posts${qs}`, { revalidateSeconds: 60 })) || [];

  const canonical = absoluteUrl(`/wiki/${encodeURIComponent(entry.slug)}`);
  const description = makeDescription(entry.summary || entry.body || '', 160);
  const rawImg = extractFirstImageUrlFromMarkdown(entry.body || '');
  const shareImageUrl = (() => {
    const u = normalizeMetaUrl(rawImg);
    if (!u || isBadShareImageUrl(u)) return '';
    return u;
  })();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
        url: canonical,
        headline: entry.title,
        description,
        image: shareImageUrl || undefined,
        datePublished: entry.publishedAt || entry.createdAt || undefined,
        dateModified: entry.updatedAt || entry.publishedAt || entry.createdAt || undefined,
        author: { '@type': 'Organization', name: 'CHEK' },
        publisher: { '@type': 'Organization', name: 'CHEK' },
        inLanguage: 'zh-CN',
        keywords: entry.tags && entry.tags.length > 0 ? entry.tags.join(', ') : undefined,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '有知', item: absoluteUrl('/wiki') },
          { '@type': 'ListItem', position: 2, name: entry.title, item: canonical },
        ],
      },
    ],
  };

  return (
    <div className="chek-shell" style={{ paddingBottom: 24 }}>
      <header className="chek-header">
        <div className="chek-title-row">
          <h1 className="chek-title">{entry.title}</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href={`/wiki/${encodeURIComponent(entry.slug)}/edit`} className="chek-chip">
              参与编辑
            </Link>
            <Link href="/wiki" className="chek-chip gray">
              返回
            </Link>
          </div>
        </div>
      </header>

      <main className="chek-section" style={{ display: 'grid', gap: 12 }}>
        <article className="chek-card" style={{ padding: 16 }}>
          <header style={{ display: 'grid', gap: 8 }}>
            {entry.tags && entry.tags.length > 0 ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {entry.tags.map((t) => (
                  <Link key={t} href={`/tag/${encodeURIComponent(t)}`} className="chek-chip" style={{ padding: '6px 10px' }}>
                    #{t}
                  </Link>
                ))}
              </div>
            ) : null}

            <div className="chek-card" style={{ padding: 12, borderRadius: 18 }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>可引用块</div>
              <div className="chek-muted" style={{ lineHeight: 1.7 }}>
                要点：{entry.summary || '（还在补充）'}
                <br />
                更新时间：{entry.updatedAt ? new Date(entry.updatedAt).toLocaleString() : '—'}
              </div>
            </div>
          </header>

          <section style={{ marginTop: 12 }}>
            <MarkdownBody body={entry.body || ''} />
          </section>
        </article>

        <section className="chek-card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ fontWeight: 900 }}>相关相辅</div>
            <Link href={tag ? `/post/new?tag=${encodeURIComponent(tag)}` : '/post/new'} className="chek-chip">
              来相辅问问大家
            </Link>
          </div>

          <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
            {relatedPosts.length > 0 ? (
              relatedPosts.map((p) => <PostCard key={p.postId} post={p} />)
            ) : (
              <div className="chek-muted" style={{ lineHeight: 1.7 }}>
                暂时没有相关相辅。欢迎你先发一条，我们一起把信息补齐。
              </div>
            )}
          </div>
        </section>
      </main>

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}

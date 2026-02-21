import Link from 'next/link';
import type { Metadata } from 'next';
import { serverGet } from '@/lib/server-api';
import type { PostDTO, WikiEntryDTO } from '@/lib/api-types';
import { absoluteUrl, makePageMetadata } from '@/lib/seo';
import { WikiCard } from '@/components/WikiCard';
import { TagFollowButton } from '@/app/tag/[tag]/TagFollowButton';
import { TagPostsClient } from '@/app/tag/[tag]/TagPostsClient';

export const revalidate = 120;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag: rawTag } = await params;
  const tag = decodeURIComponent(rawTag || '').trim();
  const safeTag = tag || '标签';

  return makePageMetadata({
    title: `#${safeTag} - 标签 | CHEK`,
    description: `查看 #${safeTag} 下的有知词条与相辅帖子。`,
    path: `/tag/${encodeURIComponent(safeTag)}`,
    ogType: 'website',
    keywords: [safeTag, '潮汕', 'CHEK'],
    shareTitle: `#${safeTag} | 标签 · 潮客 CHEK`,
  });
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag: rawTag } = await params;
  const tag = decodeURIComponent(rawTag || '').trim();
  const safeTag = tag || '标签';

  const canonical = absoluteUrl(`/tag/${encodeURIComponent(safeTag)}`);

  const wiki =
    (await serverGet<WikiEntryDTO[]>(
      `/api/chek-content/v1/wiki/entries?tags=${encodeURIComponent(safeTag)}&limit=10`,
      { revalidateSeconds: 120 }
    )) || [];

  const posts =
    (await serverGet<PostDTO[]>(
      `/api/chek-content/v1/posts?tags=${encodeURIComponent(safeTag)}&limit=20`,
      { revalidateSeconds: 60 }
    )) || [];

  const indexableWiki = wiki.filter((e) => e?.isPublic && e?.isIndexable && !!String(e?.slug || '').trim());
  const indexablePosts = posts.filter((p) => p?.isPublic && p?.isIndexable && Number.isFinite(p?.postId));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
        url: canonical,
        name: `#${safeTag}`,
        description: `查看 #${safeTag} 下的有知词条与相辅帖子。`,
        inLanguage: 'zh-CN',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '相辅', item: absoluteUrl('/feed') },
          { '@type': 'ListItem', position: 2, name: `#${safeTag}`, item: canonical },
        ],
      },
      {
        '@type': 'ItemList',
        name: `#${safeTag} · 有知`,
        itemListElement: indexableWiki.map((e, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: e.title,
          item: absoluteUrl(`/wiki/${encodeURIComponent(e.slug)}`),
        })),
      },
      {
        '@type': 'ItemList',
        name: `#${safeTag} · 相辅`,
        itemListElement: indexablePosts.map((p, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: (p.title || '').trim() || '相辅',
          item: absoluteUrl(`/p/${p.postId}`),
        })),
      },
    ],
  };

  return (
    <div className="chek-shell" style={{ paddingBottom: 24 }}>
      <header className="chek-header">
        <div className="chek-title-row">
          <h1 className="chek-title">#{safeTag}</h1>
          <Link href="/feed" className="chek-chip gray">
            返回
          </Link>
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
          <TagFollowButton tag={safeTag} />
          <Link href={`/post/new?tag=${encodeURIComponent(safeTag)}`} className="chek-chip">
            + 来相辅
          </Link>
        </div>
      </header>

      <main className="chek-section" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 12 }}>
        <section className="chek-card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>有知</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 10 }}>
            {wiki.length > 0 ? (
              wiki.map((e) => <WikiCard key={e.entryId} entry={e} />)
            ) : (
              <div className="chek-muted" style={{ lineHeight: 1.7 }}>
                这个标签下暂时还没有有知词条。给你添麻烦了，先抱歉。
              </div>
            )}
          </div>
        </section>

        <section className="chek-card" style={{ padding: 16 }}>
          <TagPostsClient tag={safeTag} initialPosts={posts} />
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

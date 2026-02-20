import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { serverGet } from '@/lib/server-api';
import type { GetMediaResponse, PostDTO, PostMediaDTO } from '@/lib/api-types';
import { absoluteUrl, isBadShareImageUrl, makeDescription, makePageMetadata, normalizeMetaUrl } from '@/lib/seo';
import { MarkdownBody } from '@/components/MarkdownBody';
import { MediaGallery } from '@/components/MediaGallery';
import { CommentsSection } from '@/components/CommentsSection';
import { formatUserOneIdForDisplay } from '@/lib/user-display';
import { ShareIconButton } from '@/components/ShareIconButton';
import { PostAuthorRow } from '@/components/PostAuthorRow';

async function pickFirstImageUrlFromMedia(media: PostMediaDTO[] | null | undefined): Promise<string> {
  const list = Array.isArray(media) ? media : [];
  for (const m of list) {
    const id = Number(m?.mediaObjectId);
    if (!Number.isFinite(id) || id <= 0) continue;
    const dto = await serverGet<GetMediaResponse>(`/api/chek-media/v1/media/${id}`, { revalidateSeconds: 300 });
    const contentType = String(dto?.contentType || '').toLowerCase();
    if (!contentType.startsWith('image/')) continue;
    const url = normalizeMetaUrl(dto?.getUrl);
    if (!url || isBadShareImageUrl(url)) continue;
    return url;
  }
  return '';
}

function formatSourceLabel(platform?: string | null): string {
  const p = String(platform || '').trim().toUpperCase();
  if (!p) return '';
  if (p === 'WEIBO') return '微博';
  if (p === 'XHS' || p === 'XIAOHONGSHU') return '小红书';
  return p;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ postId: string }>;
}): Promise<Metadata> {
  const { postId } = await params;
  const id = Number(postId);
  if (!Number.isFinite(id) || id <= 0) {
    return makePageMetadata({
      title: '相辅 - CHEK',
      description: '相辅：分享潮汕旅行经验、避坑与评论。',
      path: '/feed',
      ogType: 'website',
      noindex: true,
    });
  }

  const post = await serverGet<PostDTO>(`/api/chek-content/v1/posts/${id}`, { revalidateSeconds: 30 });
  if (!post) {
    return makePageMetadata({
      title: '相辅 - CHEK',
      description: '相辅：分享潮汕旅行经验、避坑与评论。',
      path: '/feed',
      ogType: 'website',
      noindex: true,
    });
  }

  const title = post.title?.trim() || '相辅';
  const shareTitle = post.title?.trim() || '相辅';
  const noindex = !post.isPublic || !post.isIndexable;
  const shareImageUrl = await pickFirstImageUrlFromMedia(post.media);
  const shareDescBase = makeDescription(post.body || '', 160);
  const shareDescription = post.locationName ? `${post.locationName} · ${shareDescBase}` : shareDescBase;

  return makePageMetadata({
    title: `${title} - 相辅 | CHEK`,
    description: shareDescBase,
    path: `/p/${post.postId}`,
    ogType: 'article',
    noindex,
    keywords: post.tags || undefined,
    publishedTime: post.createdAt,
    modifiedTime: post.updatedAt || post.createdAt,
    imageUrl: shareImageUrl || undefined,
    imageAlt: shareTitle,
    shareTitle: `${shareTitle} | 潮客 CHEK`,
    shareDescription,
  });
}

export default async function PostDetailPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  const id = Number(postId);
  if (!Number.isFinite(id) || id <= 0) notFound();

  const post = await serverGet<PostDTO>(`/api/chek-content/v1/posts/${id}`, { revalidateSeconds: 30 });
  if (!post) notFound();
  if (!post.isPublic) notFound();

  const sourceUrl = String(post.sourceUrl || '').trim();
  const sourceLabel = formatSourceLabel(post.sourcePlatform);
  const rawTitle = post.title?.trim() || '';
  const title = rawTitle || '相辅';
  const uiTitle = rawTitle || '无标题';
  const canonical = absoluteUrl(`/p/${post.postId}`);
  const description = makeDescription(post.body || '', 160);
  const hasGeo = Number.isFinite(post.lat) && Number.isFinite(post.lng);
  const authorName = formatUserOneIdForDisplay(post.authorUserOneId, '游客');
  const shareImageUrl = await pickFirstImageUrlFromMedia(post.media);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'DiscussionForumPosting',
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
        url: canonical,
        headline: title,
        description,
        image: shareImageUrl || undefined,
        datePublished: post.createdAt || undefined,
        dateModified: post.updatedAt || post.createdAt || undefined,
        author: { '@type': 'Person', name: authorName },
        publisher: { '@type': 'Organization', name: 'CHEK' },
        inLanguage: 'zh-CN',
        keywords: post.tags && post.tags.length > 0 ? post.tags.join(', ') : undefined,
        interactionStatistic: {
          '@type': 'InteractionCounter',
          interactionType: { '@type': 'CommentAction' },
          userInteractionCount: Number(post.commentCount || 0),
        },
        ...(post.locationName
          ? {
              contentLocation: {
                '@type': 'Place',
                name: post.locationName,
                ...(hasGeo ? { geo: { '@type': 'GeoCoordinates', latitude: post.lat, longitude: post.lng } } : null),
              },
            }
          : null),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '相辅', item: absoluteUrl('/feed') },
          { '@type': 'ListItem', position: 2, name: title, item: canonical },
        ],
      },
    ],
  };

  return (
    <div className="chek-shell" style={{ paddingBottom: 24 }}>
      <header
        className="chek-header"
        style={{
          background: 'linear-gradient(180deg, rgba(242,244,248,0.9) 0%, rgba(242,244,248,0) 100%)',
          border: 'none',
          boxShadow: 'none',
          borderRadius: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link
            href="/feed"
            className="chek-card"
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.55)',
            }}
            aria-label="返回"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>

          <div style={{ fontWeight: 900 }}>相辅</div>

          <ShareIconButton
            url={canonical}
            title={title}
            className="chek-card"
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.55)',
              cursor: 'pointer',
            }}
            ariaLabel="分享"
          />
        </div>
      </header>

      <main className="chek-section" style={{ paddingTop: 12 }}>
        <article className="chek-card" style={{ padding: 18, borderRadius: 28 }}>
          <header style={{ display: 'grid', gap: 12 }}>
            <PostAuthorRow
              authorUserOneId={post.authorUserOneId}
              createdAt={post.createdAt}
              locationName={post.locationName}
              nextPath={`/p/${post.postId}`}
            />

            <h1 style={{ margin: 0, fontWeight: 900, fontSize: 20, lineHeight: 1.25 }}>{uiTitle}</h1>

            {post.tags && post.tags.length > 0 ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {post.tags.map((t) => (
                  <Link
                    key={t}
                    href={`/tag/${encodeURIComponent(t)}`}
                    className="chek-chip"
                    style={{ padding: '6px 10px' }}
                  >
                    #{t}
                  </Link>
                ))}
              </div>
            ) : null}

            {sourceUrl ? (
              <div style={{ fontSize: 12, fontWeight: 800 }}>
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="chek-muted"
                  style={{ textDecoration: 'none' }}
                >
                  来源{sourceLabel ? `：${sourceLabel}` : ''}（点击跳转）
                </a>
              </div>
            ) : null}
          </header>

          <MediaGallery media={post.media} />

          <section style={{ marginTop: 12 }}>
            <MarkdownBody body={post.body} />
          </section>

          <CommentsSection postId={post.postId} />
        </article>
      </main>

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}

import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { serverGet } from '@/lib/server-api';
import type { PostDTO } from '@/lib/api-types';
import { MarkdownBody } from '@/components/MarkdownBody';
import { MediaGallery } from '@/components/MediaGallery';
import { CommentsSection } from '@/components/CommentsSection';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ postId: string }>;
}): Promise<Metadata> {
  const { postId } = await params;
  const id = Number(postId);
  if (!Number.isFinite(id) || id <= 0) return { title: '相辅 - CHEK' };
  const post = await serverGet<PostDTO>(`/api/chek-content/v1/posts/${id}`, { revalidateSeconds: 30 });
  if (!post) return { title: '相辅 - CHEK' };
  const title = post.title?.trim() || '相辅';
  return {
    title: `${title} - 相辅 | CHEK`,
    description: (post.body || '').slice(0, 120),
  };
}

export default async function PostDetailPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  const id = Number(postId);
  if (!Number.isFinite(id) || id <= 0) notFound();

  const post = await serverGet<PostDTO>(`/api/chek-content/v1/posts/${id}`, { revalidateSeconds: 30 });
  if (!post) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title?.trim() || '相辅',
    datePublished: post.createdAt || undefined,
    dateModified: post.updatedAt || undefined,
    author: { '@type': 'Person', name: post.authorUserOneId },
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

          <button
            type="button"
            className="chek-card"
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.55)',
              cursor: 'not-allowed',
            }}
            aria-label="更多（占位）"
            disabled
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="1" />
              <circle cx="19" cy="12" r="1" />
              <circle cx="5" cy="12" r="1" />
            </svg>
          </button>
        </div>
      </header>

      <main className="chek-section" style={{ paddingTop: 12 }}>
        <article className="chek-card" style={{ padding: 18, borderRadius: 28 }}>
          <header style={{ display: 'grid', gap: 12 }}>
            <div className="chek-author-row" style={{ margin: 0 }}>
              <div className="chek-avatar" aria-hidden style={{ width: 40, height: 40 }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="chek-author-name">{post.authorUserOneId || '游客'}</div>
                <div className="chek-author-meta">
                  {post.createdAt ? new Date(post.createdAt).toLocaleString() : '—'}
                  {post.locationName ? ` · ${post.locationName}` : ''}
                </div>
              </div>
              <button
                type="button"
                className="chek-chip gray"
                style={{ border: 'none', cursor: 'not-allowed', height: 32 }}
                disabled
              >
                关注
              </button>
            </div>

            <div style={{ fontWeight: 900, fontSize: 20, lineHeight: 1.25 }}>
              {post.title?.trim() || '无标题'}
            </div>

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

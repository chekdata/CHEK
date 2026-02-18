import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { serverGet } from '@/lib/server-api';
import type { PostDTO } from '@/lib/api-types';
import { MarkdownBody } from '@/components/MarkdownBody';
import { MediaGallery } from '@/components/MediaGallery';
import { CommentsSection } from '@/components/CommentsSection';

export async function generateMetadata({ params }: { params: { postId: string } }): Promise<Metadata> {
  const id = Number(params.postId);
  if (!Number.isFinite(id) || id <= 0) return { title: '相辅 - CHEK' };
  const post = await serverGet<PostDTO>(`/api/chek-content/v1/posts/${id}`, { revalidateSeconds: 30 });
  if (!post) return { title: '相辅 - CHEK' };
  const title = post.title?.trim() || '相辅';
  return {
    title: `${title} - 相辅 | CHEK`,
    description: (post.body || '').slice(0, 120),
  };
}

export default async function PostDetailPage({ params }: { params: { postId: string } }) {
  const id = Number(params.postId);
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
      <header className="chek-header">
        <div className="chek-title-row">
          <h1 className="chek-title">相辅详情</h1>
          <Link href="/feed" className="chek-chip gray">
            返回
          </Link>
        </div>
      </header>

      <main className="chek-section">
        <article className="chek-card" style={{ padding: 16 }}>
          <header style={{ display: 'grid', gap: 6 }}>
            <div style={{ fontWeight: 900, fontSize: 18, lineHeight: 1.3 }}>
              {post.title?.trim() || '无标题'}
            </div>
            <div className="chek-muted" style={{ fontSize: 12, fontWeight: 800 }}>
              {post.authorUserOneId} ·{' '}
              {post.createdAt ? new Date(post.createdAt).toLocaleString() : '—'}
              {post.locationName ? ` · ${post.locationName}` : ''}
            </div>
            {post.tags && post.tags.length > 0 ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                {post.tags.map((t) => (
                  <Link key={t} href={`/tag/${encodeURIComponent(t)}`} className="chek-chip" style={{ padding: '6px 10px' }}>
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


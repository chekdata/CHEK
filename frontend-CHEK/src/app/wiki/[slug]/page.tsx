import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { serverGet } from '@/lib/server-api';
import type { PostDTO, WikiEntryDTO } from '@/lib/api-types';
import { MarkdownBody } from '@/components/MarkdownBody';
import { PostCard } from '@/components/PostCard';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const slug = decodeURIComponent(params.slug || '');
  const entry = await serverGet<WikiEntryDTO>(`/api/chek-content/v1/wiki/entries/bySlug/${encodeURIComponent(slug)}`, {
    revalidateSeconds: 120,
  });
  if (!entry) return { title: '有知 - CHEK' };
  return {
    title: `${entry.title} - 有知 | CHEK`,
    description: entry.summary || (entry.body || '').slice(0, 120),
  };
}

export default async function WikiDetailPage({ params }: { params: { slug: string } }) {
  const slug = decodeURIComponent(params.slug || '');

  const entry = await serverGet<WikiEntryDTO>(
    `/api/chek-content/v1/wiki/entries/bySlug/${encodeURIComponent(slug)}`,
    { revalidateSeconds: 120 }
  );
  if (!entry) notFound();

  const tag = entry.tags && entry.tags.length > 0 ? entry.tags[0] : '';
  const qs = tag ? `?tags=${encodeURIComponent(tag)}&limit=10` : '?limit=10';
  const relatedPosts =
    (await serverGet<PostDTO[]>(`/api/chek-content/v1/posts${qs}`, { revalidateSeconds: 60 })) || [];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: entry.title,
    datePublished: entry.publishedAt || entry.createdAt || undefined,
    dateModified: entry.updatedAt || undefined,
    author: { '@type': 'Organization', name: 'CHEK' },
  };

  return (
    <div className="chek-shell" style={{ paddingBottom: 24 }}>
      <header className="chek-header">
        <div className="chek-title-row">
          <h1 className="chek-title">有知详情</h1>
          <Link href="/wiki" className="chek-chip gray">
            返回
          </Link>
        </div>
      </header>

      <main className="chek-section" style={{ display: 'grid', gap: 12 }}>
        <article className="chek-card" style={{ padding: 16 }}>
          <header style={{ display: 'grid', gap: 8 }}>
            <div style={{ fontWeight: 900, fontSize: 20, lineHeight: 1.3 }}>{entry.title}</div>
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


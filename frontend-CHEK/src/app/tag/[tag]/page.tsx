import Link from 'next/link';
import { serverGet } from '@/lib/server-api';
import type { PostDTO, WikiEntryDTO } from '@/lib/api-types';
import { WikiCard } from '@/components/WikiCard';
import { PostCard } from '@/components/PostCard';

export const revalidate = 120;

export default async function TagPage({ params }: { params: { tag: string } }) {
  const tag = decodeURIComponent(params.tag || '').trim();
  const safeTag = tag || '标签';

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
          <button className="chek-chip gray" style={{ border: 'none' }} disabled>
            关注（占位）
          </button>
          <Link href={`/post/new?tag=${encodeURIComponent(safeTag)}`} className="chek-chip">
            + 来相辅
          </Link>
        </div>
      </header>

      <main className="chek-section" style={{ display: 'grid', gap: 12 }}>
        <section className="chek-card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>有知</div>
          <div style={{ display: 'grid', gap: 10 }}>
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
          <div style={{ fontWeight: 900, marginBottom: 10 }}>相辅</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {posts.length > 0 ? (
              posts.map((p) => <PostCard key={p.postId} post={p} />)
            ) : (
              <div className="chek-muted" style={{ lineHeight: 1.7 }}>
                这个标签下暂时还没有相辅。欢迎你先发一条，我们一起把信息补齐。
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}


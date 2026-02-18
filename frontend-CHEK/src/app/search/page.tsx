import Link from 'next/link';
import { serverGet } from '@/lib/server-api';
import type { PostDTO, WikiEntryDTO } from '@/lib/api-types';
import { PostCard } from '@/components/PostCard';
import { WikiCard } from '@/components/WikiCard';

export const revalidate = 0;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const qRaw = sp.query;
  const query = Array.isArray(qRaw) ? qRaw[0] : qRaw || '';
  const q = query.trim();

  const wiki =
    q
      ? (await serverGet<WikiEntryDTO[]>(
          `/api/chek-content/v1/wiki/entries?query=${encodeURIComponent(q)}&limit=10`,
          { revalidateSeconds: 0 }
        )) || []
      : [];

  const posts =
    q
      ? (await serverGet<PostDTO[]>(
          `/api/chek-content/v1/posts?query=${encodeURIComponent(q)}&limit=10`,
          { revalidateSeconds: 0 }
        )) || []
      : [];

  return (
    <div className="chek-shell" style={{ paddingBottom: 24 }}>
      <header className="chek-header">
        <div className="chek-title-row">
          <h1 className="chek-title">搜索</h1>
          <Link href="/feed" className="chek-chip gray">
            返回
          </Link>
        </div>

        <form action="/search" method="GET" style={{ marginTop: 12, display: 'flex', gap: 10 }}>
          <input
            name="query"
            defaultValue={q}
            placeholder="搜：牌坊街 / 英歌舞 / 避坑 / 早餐…"
            style={{
              flex: 1,
              borderRadius: 999,
              border: '1px solid rgba(0,0,0,0.08)',
              padding: '12px 14px',
              outline: 'none',
              background: 'rgba(255,255,255,0.85)',
            }}
          />
          <button className="chek-chip" style={{ border: 'none', cursor: 'pointer' }} type="submit">
            搜
          </button>
        </form>
      </header>

      <main className="chek-section" style={{ display: 'grid', gap: 12 }}>
        {!q ? (
          <div className="chek-card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>欢迎你来潮汕</div>
            <div className="chek-muted" style={{ lineHeight: 1.7 }}>
              先搜搜看有没有现成答案；如果没有，直接发相辅问大家也行。
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
              <Link href="/post/new" className="chek-chip">
                去发相辅
              </Link>
              <Link href="/wiki" className="chek-chip gray">
                去有知
              </Link>
            </div>
          </div>
        ) : (
          <>
            <section className="chek-card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 900, marginBottom: 10 }}>有知</div>
              <div style={{ display: 'grid', gap: 10 }}>
                {wiki.length > 0 ? (
                  wiki.map((e) => <WikiCard key={e.entryId} entry={e} />)
                ) : (
                  <div className="chek-muted" style={{ lineHeight: 1.7 }}>
                    暂时没搜到有知结果，给你添麻烦了，先抱歉。
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
                    暂时没搜到相辅结果。要不你来发一条，我们一起把路走顺。
                    <div style={{ marginTop: 10 }}>
                      <Link href={`/post/new`} className="chek-chip">
                        + 来相辅
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

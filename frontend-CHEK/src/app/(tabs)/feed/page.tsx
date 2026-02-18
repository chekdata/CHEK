import Link from 'next/link';
import Image from 'next/image';
import { serverGet } from '@/lib/server-api';
import { PostDTO } from '@/lib/api-types';
import { PostCard } from '@/components/PostCard';
import cat from '@assets/IP/空状态-通用.png';
import { WelcomeModal } from '@/components/WelcomeModal';

export const revalidate = 30;

const DEFAULT_TAGS = ['避坑', '吃啥', '住哪', '怎么玩', '交通', '亲子', '雨天', '性价比'];

export default async function FeedPage() {
  const posts =
    (await serverGet<PostDTO[]>('/api/chek-content/v1/posts?limit=20', { revalidateSeconds: 30 })) ||
    [];

  return (
    <>
      <WelcomeModal />
      <header className="chek-header">
        <div className="chek-title-row">
          <h1 className="chek-title">相辅</h1>
          <Link
            href="/search"
            className="chek-chip gray"
            style={{ padding: '8px 12px', height: 32, display: 'inline-flex', alignItems: 'center' }}
          >
            去搜搜
          </Link>
        </div>

        <div className="chek-search">
          <Link
            href="/search"
            className="chek-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 14px',
              borderRadius: 999,
              border: '1px solid rgba(0,0,0,0.08)',
              background: 'rgba(255,255,255,0.85)',
              flex: 1,
            }}
          >
            <span className="chek-muted">搜：牌坊街 / 英歌舞 / 避坑 / 好吃的…</span>
          </Link>
        </div>
      </header>

      <section className="chek-section" style={{ paddingTop: 12, paddingBottom: 0 }}>
        <Link
          href="/letter"
          className="chek-card"
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            padding: 14,
            borderRadius: 22,
            background:
              'linear-gradient(135deg, rgba(51,136,255,0.12), rgba(70,235,213,0.10), rgba(211,119,205,0.08))',
          }}
        >
          <Image src={cat} alt="" width={44} height={44} style={{ borderRadius: 14 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 900 }}>致旅客的一封信</div>
            <div className="chek-muted" style={{ fontSize: 13, lineHeight: 1.5 }}>
              欢迎你来潮汕。路上辛苦了；如果遇到不愉快的事，先说声对不起。
            </div>
          </div>
          <div className="chek-chip gray" style={{ height: 30 }}>
            打开
          </div>
        </Link>
      </section>

      <div className="chek-chip-row" aria-label="标签">
        {DEFAULT_TAGS.map((t) => (
          <Link key={t} href={`/tag/${encodeURIComponent(t)}`} className="chek-chip">
            #{t}
          </Link>
        ))}
      </div>

      <main className="chek-section" style={{ display: 'grid', gap: 12 }}>
        {posts.length > 0 ? (
          posts.map((p) => <PostCard key={p.postId} post={p} />)
        ) : (
          <div className="chek-card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>还没有相辅</div>
            <div className="chek-muted" style={{ lineHeight: 1.7 }}>
              欢迎你来潮汕，路上辛苦了。现在相辅还空着，给你添麻烦了，先说声抱歉。
              <br />
              你可以先去有知看看，或者来发第一条相辅。
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
              <Link href="/wiki" className="chek-chip gray">
                去有知
              </Link>
              <Link href="/post/new" className="chek-chip">
                + 来相辅
              </Link>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

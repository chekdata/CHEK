import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { serverGet } from '@/lib/server-api';
import { PostDTO } from '@/lib/api-types';
import { makePageMetadata } from '@/lib/seo';
import { PostCard } from '@/components/PostCard';
import cat from '@assets/IP/空状态-通用.png';
import emptyNoPosts from '@assets/IP/没有帖子.png';
import { WelcomeModal } from '@/components/WelcomeModal';

export const revalidate = 30;
export const metadata: Metadata = makePageMetadata({
  title: '相辅 - CHEK',
  description: '相辅：分享潮汕旅行经验、避坑与评论。',
  path: '/feed',
  ogType: 'website',
  noindex: true,
  keywords: ['潮汕', '避坑', '旅行', '相辅', 'CHEK'],
});

const HEADER_CHIPS: Array<{ label: string; href: string; active?: boolean }> = [
  { label: '# 全部', href: '/feed', active: true },
  { label: '# 避坑', href: '/tag/%E9%81%BF%E5%9D%91' },
  { label: '# 吃啥 (Chi Zho)', href: '/tag/%E5%90%83%E5%95%A5' },
  { label: '# 住哪', href: '/tag/%E4%BD%8F%E5%93%AA' },
  { label: '# 交通', href: '/tag/%E4%BA%A4%E9%80%9A' },
  { label: '# 劳热', href: '/timeline' },
];

export default async function FeedPage() {
  const posts =
    (await serverGet<PostDTO[]>('/api/chek-content/v1/posts?limit=20', { revalidateSeconds: 30 })) ||
    [];

  return (
    <>
      <WelcomeModal />
      <header
        className="chek-header"
        style={{ padding: `calc(env(safe-area-inset-top) + 10px) 0 0` }}
      >
        <div className="chek-top-row">
          <div className="chek-page-title">相辅</div>

          <Link href="/search" className="chek-search-bar" aria-label="搜索">
            <svg
              className="chek-icon-sm"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span>搜：牌坊街 / 避坑 / 牛肉丸...</span>
          </Link>

          <Link href="/search" className="chek-filter-btn" aria-label="筛选">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" />
              <line x1="9" y1="8" x2="15" y2="8" />
              <line x1="17" y1="16" x2="23" y2="16" />
            </svg>
          </Link>
        </div>

        <div className="chek-chips-scroll" aria-label="标签筛选">
          {HEADER_CHIPS.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className={`chek-chip-pill${c.active ? ' active' : ''}`}
            >
              {c.label}
            </Link>
          ))}
        </div>
      </header>

      <main className="chek-feed-list">
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

        {posts.length > 0 ? (
          posts.map((p) => <PostCard key={p.postId} post={p} />)
        ) : (
          <div className="chek-card" style={{ padding: 18, borderRadius: 28, textAlign: 'center' }}>
            <Image src={emptyNoPosts} alt="" width={160} height={160} priority />
            <div style={{ fontWeight: 900, marginTop: 8 }}>还没有相辅</div>
            <div className="chek-muted" style={{ lineHeight: 1.7, marginTop: 8 }}>
              欢迎你来潮汕，路上辛苦了。现在相辅还空着，给你添麻烦了，先说声抱歉。
              <br />
              你可以先去有知看看，或者来发第一条相辅。
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 10, justifyContent: 'center' }}>
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

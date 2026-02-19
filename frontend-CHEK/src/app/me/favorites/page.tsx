import Link from 'next/link';
import type { Metadata } from 'next';
import { makePageMetadata } from '@/lib/seo';

export const metadata: Metadata = makePageMetadata({
  title: '我的收藏 - CHEK',
  description: '我的收藏（占位）。',
  path: '/me/favorites',
  ogType: 'website',
  noindex: true,
  keywords: ['收藏', 'CHEK'],
});

export default function FavoritesPage() {
  return (
    <div className="chek-shell" style={{ paddingBottom: 24 }}>
      <header className="chek-header">
        <div className="chek-title-row">
          <h1 className="chek-title">我的收藏</h1>
          <Link href="/me" className="chek-chip gray">
            返回
          </Link>
        </div>
      </header>

      <main className="chek-section">
        <div className="chek-card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>先占位</div>
          <div className="chek-muted" style={{ lineHeight: 1.7 }}>
            收藏功能可以做，但 MVP 先把“有知 + 相辅（发帖+评论）”跑顺。
            <br />
            给你添麻烦了，先抱歉。
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
            <Link href="/wiki" className="chek-chip gray">
              去有知
            </Link>
            <Link href="/feed" className="chek-chip gray">
              去相辅
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

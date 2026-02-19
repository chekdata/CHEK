import Link from 'next/link';
import type { Metadata } from 'next';
import { makePageMetadata } from '@/lib/seo';
import FavoritesClient from '@/app/me/favorites/FavoritesClient';

export const metadata: Metadata = makePageMetadata({
  title: '我的收藏 - CHEK',
  description: '我的收藏：你在相辅里收藏过的内容。',
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
        <FavoritesClient />
      </main>
    </div>
  );
}

import Link from 'next/link';
import type { Metadata } from 'next';
import { makePageMetadata } from '@/lib/seo';

export const metadata: Metadata = makePageMetadata({
  title: '辣辣嗦 - CHEK',
  description: '辣辣嗦：把内容落到地图上，帮你更直观地看“在哪儿、怎么走”。（建设中）',
  path: '/map',
  ogType: 'website',
  noindex: true,
  keywords: ['地图', '潮汕', 'CHEK'],
});

export default function MapPage() {
  return (
    <div className="chek-shell" style={{ paddingBottom: 24 }}>
      <header className="chek-header">
        <div className="chek-title-row">
          <h1 className="chek-title">辣辣嗦</h1>
          <Link href="/wiki" className="chek-chip gray">
            返回
          </Link>
        </div>
      </header>

      <main className="chek-section">
        <div className="chek-card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>建设中</div>
          <div className="chek-muted" style={{ lineHeight: 1.7 }}>
            辣辣嗦会把内容落到地图上，帮你更直观地看“在哪儿、怎么走”。
            <br />
            现在先把有知和相辅做扎实，给你添麻烦了，先抱歉。
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

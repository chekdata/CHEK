import { Suspense } from 'react';
import type { Metadata } from 'next';
import CreatePostClient from './CreatePostClient';
import { makePageMetadata } from '@/lib/seo';

export const metadata: Metadata = makePageMetadata({
  title: '发相辅 - CHEK',
  description: '发一条相辅，把经历讲出来，帮后来的人少走弯路。',
  path: '/post/new',
  ogType: 'website',
  noindex: true,
  keywords: ['发帖', '相辅', '潮汕', 'CHEK'],
});

export default function CreatePostPage() {
  return (
    <Suspense
      fallback={
        <div className="chek-shell" style={{ paddingBottom: 24 }}>
          <main className="chek-section">
            <div className="chek-card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 900, marginBottom: 8 }}>加载中…</div>
              <div className="chek-muted">给你添麻烦了，稍等一下。</div>
            </div>
          </main>
        </div>
      }
    >
      <CreatePostClient />
    </Suspense>
  );
}

import { Suspense } from 'react';
import type { Metadata } from 'next';
import CreatePostClient from './CreatePostClient';
import { makePageMetadata } from '@/lib/seo';
import { PageLoading } from '@/components/PageLoading';

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
      fallback={<PageLoading title="发相辅准备中" hint="编辑器和上传能力正在加载，请稍等一下。" rows={2} />}
    >
      <CreatePostClient />
    </Suspense>
  );
}

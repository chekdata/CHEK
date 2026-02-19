import type { Metadata } from 'next';
import { makePageMetadata } from '@/lib/seo';

export const metadata: Metadata = makePageMetadata({
  title: '我的相辅 - CHEK',
  description: '查看我发过的相辅。',
  path: '/me/posts',
  ogType: 'website',
  noindex: true,
  keywords: ['我的相辅', 'CHEK'],
});

export default function MyPostsLayout({ children }: { children: React.ReactNode }) {
  return children;
}


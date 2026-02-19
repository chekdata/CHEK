import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { makePageMetadata } from '@/lib/seo';

export const metadata: Metadata = makePageMetadata({
  title: '潮客 CHEK',
  description: '有知（百科）+ 相辅（帖子与评论）。欢迎你来潮汕，路上辛苦了。',
  path: '/',
  ogType: 'website',
  noindex: true,
});

export default function Home() {
  redirect('/feed');
}

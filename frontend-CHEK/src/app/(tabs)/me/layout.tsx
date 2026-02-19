import type { Metadata } from 'next';
import { makePageMetadata } from '@/lib/seo';

export const metadata: Metadata = makePageMetadata({
  title: '胶己 - CHEK',
  description: '登录与个人信息。',
  path: '/me',
  ogType: 'website',
  noindex: true,
  keywords: ['我的', '登录', 'CHEK'],
});

export default function MeLayout({ children }: { children: React.ReactNode }) {
  return children;
}


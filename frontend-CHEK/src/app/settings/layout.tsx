import type { Metadata } from 'next';
import { makePageMetadata } from '@/lib/seo';

export const metadata: Metadata = makePageMetadata({
  title: '设置 - CHEK',
  description: '账号与安全、通用设置。',
  path: '/settings',
  ogType: 'website',
  noindex: true,
  keywords: ['设置', 'CHEK'],
});

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}


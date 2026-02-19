import type { Metadata } from 'next';
import { makePageMetadata } from '@/lib/seo';

export const metadata: Metadata = makePageMetadata({
  title: '绑定手机号 - CHEK',
  description: '绑定手机号（登录补全）。',
  path: '/auth/bind-phone',
  ogType: 'website',
  noindex: true,
  keywords: ['绑定手机号', 'CHEK'],
});

export default function BindPhoneLayout({ children }: { children: React.ReactNode }) {
  return children;
}


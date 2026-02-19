import type { Metadata } from 'next';
import { absoluteUrl, DEFAULT_DESCRIPTION, safeMetadataBase, SITE_NAME } from '@/lib/seo';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: safeMetadataBase(),
  title: SITE_NAME,
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    url: absoluteUrl('/'),
    images: [{ url: absoluteUrl('/og.png'), alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    images: [absoluteUrl('/og.png')],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="chek-bg-orbs" aria-hidden>
          <div className="chek-orb blue" />
          <div className="chek-orb cyan" />
          <div className="chek-orb pink" />
        </div>
        {children}
      </body>
    </html>
  );
}

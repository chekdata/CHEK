import type { Metadata, Viewport } from 'next';
import { absoluteUrl, DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE_PATH, safeMetadataBase, SITE_NAME } from '@/lib/seo';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#F2F4F8',
  colorScheme: 'light',
};

export const metadata: Metadata = {
  metadataBase: safeMetadataBase(),
  title: SITE_NAME,
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ['潮汕', '旅行', '避坑', '百科', '相辅', 'CHEK'],
  formatDetection: { telephone: false, address: false, email: false },
  appleWebApp: { capable: true, statusBarStyle: 'default', title: SITE_NAME },
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
    images: [{ url: absoluteUrl(DEFAULT_OG_IMAGE_PATH), alt: SITE_NAME, width: 1200, height: 630, type: 'image/png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    images: [absoluteUrl(DEFAULT_OG_IMAGE_PATH)],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const canonicalHome = absoluteUrl('/');
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: canonicalHome,
    logo: absoluteUrl('/icon.png'),
    sameAs: ['https://github.com/chekdata/CHEK'],
  };
  const webSiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: canonicalHome,
    inLanguage: 'zh-CN',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${absoluteUrl('/search')}?query={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <html lang="zh-CN">
      <head>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
        />
      </head>
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

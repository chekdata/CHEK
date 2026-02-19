import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import logo from '@assets/LOGO.png';
import cat from '@assets/IP/空状态-通用.png';
import { makePageMetadata } from '@/lib/seo';

export const metadata: Metadata = makePageMetadata({
  title: '潮客 CHEK',
  description: '一起把潮汕讲清楚。欢迎你来潮汕，路上辛苦了。',
  path: '/splash',
  ogType: 'website',
  noindex: true,
  keywords: ['潮汕', '旅行', 'CHEK'],
});

export default function SplashPage() {
  return (
    <div className="chek-shell" style={{ paddingBottom: 24 }}>
      <main className="chek-section" style={{ paddingTop: 48, textAlign: 'center' }}>
        <div
          className="chek-card"
          style={{
            padding: 18,
            borderRadius: 28,
            display: 'grid',
            gap: 14,
            justifyItems: 'center',
          }}
        >
          <Image src={cat} alt="CHEK 吉祥物" width={140} height={140} priority />
          <Image src={logo} alt="潮客 CHEK" width={160} height={54} priority />
          <div className="chek-muted" style={{ lineHeight: 1.7 }}>
            一起把潮汕讲清楚。
            <br />
            欢迎你来潮汕，路上辛苦了。
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <Link href="/feed" className="chek-chip">
              先逛相辅
            </Link>
            <Link href="/wiki" className="chek-chip gray">
              去有知
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

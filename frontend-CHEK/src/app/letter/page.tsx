import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import cat from '@assets/IP/空状态-通用.png';
import { absoluteUrl, makePageMetadata } from '@/lib/seo';

export const metadata: Metadata = makePageMetadata({
  title: '致旅客的一封信 - CHEK',
  description: '欢迎你来潮汕。路上辛苦了。如果遇到不愉快的事，先说声对不起，给你添麻烦了。',
  path: '/letter',
  ogType: 'website',
  keywords: ['潮汕', '旅行', '避坑', 'CHEK'],
});

export default function LetterPage() {
  const canonical = absoluteUrl('/letter');
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': canonical,
        url: canonical,
        name: '致旅客的一封信',
        description: '欢迎你来潮汕。路上辛苦了。如果遇到不愉快的事，先说声对不起，给你添麻烦了。',
        inLanguage: 'zh-CN',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '相辅', item: absoluteUrl('/feed') },
          { '@type': 'ListItem', position: 2, name: '致旅客的一封信', item: canonical },
        ],
      },
    ],
  };

  return (
    <div className="chek-shell" style={{ paddingBottom: 24 }}>
      <header className="chek-header">
        <div className="chek-title-row">
          <h1 className="chek-title">致旅客的一封信</h1>
          <Link href="/feed" className="chek-chip gray" aria-label="返回相辅">
            返回
          </Link>
        </div>
      </header>

      <main className="chek-section" style={{ paddingBottom: 90 }}>
        <article className="chek-card" style={{ padding: 18, borderRadius: 28 }}>
          <header style={{ textAlign: 'center', marginBottom: 18 }}>
            <Image src={cat} alt="CHEK 吉祥物" width={120} height={120} priority />
            <div style={{ fontWeight: 900, fontSize: 18, marginTop: 10 }}>亲爱的朋友：你好。</div>
          </header>

          <section style={{ display: 'grid', gap: 12, lineHeight: 1.9, color: 'rgba(16,16,20,0.78)' }}>
            <p style={{ margin: 0 }}>
              如果你是带着期待来的，却遇到了不愉快的事，请允许我们先认真地说一句——
              <span style={{ fontWeight: 900, color: 'rgba(16,16,20,0.92)' }}>对不起，给你添麻烦了。</span>
            </p>
            <p style={{ margin: 0 }}>
              旅行本该是轻松的，不该让人一路提心吊胆。你愿意把经历讲出来，本身就是在帮后来的人少走弯路。
            </p>
            <p style={{ margin: 0 }}>
              我们不是商家，也不是管理者，只是一群想把事情慢慢做对的普通
              <span style={{ fontWeight: 900, color: 'rgba(16,16,20,0.92)' }}>“胶己人”</span>
              。不做口号，多做实事：把信息讲清楚、把路讲明白、把需要的人照顾到位，让远道而来的你感到宾至如归。
            </p>

            <div className="chek-card" style={{ padding: 14, borderRadius: 18, background: 'rgba(255,255,255,0.65)' }}>
              <div style={{ fontWeight: 900, color: 'var(--chek-primary)', marginBottom: 6 }}>我们愿意认真做三件事</div>
              <ol style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 8 }}>
                <li>
                  把信息讲清楚：哪些地方容易踩雷、哪些价格更合理，尽量整理成有知，让人一眼能查到。
                </li>
                <li>
                  陪你面对不愉快：遇到争议时，告诉你要保留什么、记录什么、能向哪里反映，至少不让你一个人着急。
                </li>
                <li>
                  守住人情味：更多本地人其实愿意认真待客，只是他们不一定会被看见；我们尽量把这些暖意留住。
                </li>
              </ol>
            </div>

            <p style={{ margin: 0 }}>
              远路来潮汕，辛苦了。多谢你来，多谢你讲实情。
              <br />
              愿你在这里，仍能遇到温暖的人、踏实的味道、值得记住的片刻。
            </p>

            <div style={{ textAlign: 'right', marginTop: 8 }}>
              <div style={{ fontWeight: 900, color: 'rgba(16,16,20,0.92)' }}>潮客 CHEK 胶己人</div>
              <div className="chek-muted" style={{ fontSize: 12, fontStyle: 'italic' }}>
                （慢慢做事，毋好失礼）
              </div>
            </div>
          </section>
        </article>
      </main>

      <div
        style={{
          position: 'fixed',
          left: '50%',
          bottom: `calc(env(safe-area-inset-bottom) + 18px)`,
          transform: 'translateX(-50%)',
          width: 'min(420px, 100%)',
          padding: '0 16px',
          zIndex: 40,
          pointerEvents: 'none',
        }}
      >
        <Link
          href="/post/new?tag=%E9%81%BF%E5%9D%91"
          className="chek-chip"
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: 52,
            borderRadius: 999,
            background: 'linear-gradient(135deg, rgba(16,16,20,0.92), rgba(68,68,68,0.92))',
            color: 'white',
            border: 'none',
            boxShadow: '0 12px 30px rgba(0,0,0,0.14)',
            pointerEvents: 'auto',
          }}
        >
          告诉我你遇到了什么（去发相辅）
        </Link>
      </div>

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}

import Link from 'next/link';
import type { Metadata } from 'next';
import { makePageMetadata } from '@/lib/seo';

export const metadata: Metadata = makePageMetadata({
  title: '协议与免责声明 - CHEK',
  description: '协议与免责声明：信息来源、隐私与安全、社区氛围。',
  path: '/legal',
  ogType: 'website',
  noindex: true,
  keywords: ['免责声明', '协议', 'CHEK'],
});

export default function LegalPage() {
  return (
    <div className="chek-shell" style={{ paddingBottom: 24 }}>
      <header className="chek-header">
        <div className="chek-title-row">
          <h1 className="chek-title">协议与免责声明</h1>
          <Link href="/me" className="chek-chip gray">
            返回
          </Link>
        </div>
      </header>

      <main className="chek-section">
        <article className="chek-card" style={{ padding: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>我们想说清楚</h2>
          <p className="chek-muted" style={{ lineHeight: 1.8 }}>
            欢迎你来潮汕，路上辛苦了。CHEK 的目标是把信息讲清楚、把人照顾到位。
          </p>

          <h3 style={{ marginTop: 18, fontSize: 16 }}>信息来源</h3>
          <p className="chek-muted" style={{ lineHeight: 1.8 }}>
            有知/相辅的内容主要来自用户分享与共同整理，我们会尽量标注更新时间与依据，但不保证完全准确。
            出行/消费请以现场与官方信息为准。
          </p>

          <h3 style={{ marginTop: 18, fontSize: 16 }}>隐私与安全</h3>
          <p className="chek-muted" style={{ lineHeight: 1.8 }}>
            请不要在相辅里发布身份证号、银行卡、完整住址等敏感信息。遇到诈骗或紧急情况，请优先联系官方渠道与警方。
          </p>

          <h3 style={{ marginTop: 18, fontSize: 16 }}>社区氛围</h3>
          <p className="chek-muted" style={{ lineHeight: 1.8 }}>
            胶己人讲话直，但心是热的。希望大家多给建议、少上火；有问题先把人照顾好。
          </p>
        </article>
      </main>
    </div>
  );
}

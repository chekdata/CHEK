import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import cat from '@assets/IP/空状态-通用.png';
import { absoluteUrl, makePageMetadata } from '@/lib/seo';

export const metadata: Metadata = makePageMetadata({
  title: '写给胶己人：潮汕的体面，要靠大家一起撑起来 - CHEK',
  description: '写给胶己人的一封信：欢迎一起共建有知和相辅，也去小红书微博抖音协助答疑，守住潮汕口碑与体面。',
  path: '/letter/locals',
  ogType: 'article',
  keywords: ['潮汕', '胶己人', '有知', '相辅', 'CHEK'],
});

export default function LetterLocalsPage() {
  const canonical = absoluteUrl('/letter/locals');
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': canonical,
        url: canonical,
        name: '写给胶己人：潮汕的体面，要靠大家一起撑起来',
        description: '写给胶己人的一封信：欢迎一起共建有知和相辅，也去小红书微博抖音协助答疑，守住潮汕口碑与体面。',
        inLanguage: 'zh-CN',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '相辅', item: absoluteUrl('/feed') },
          { '@type': 'ListItem', position: 2, name: '写给胶己人的一封信', item: canonical },
        ],
      },
    ],
  };

  return (
    <div className="chek-shell" style={{ paddingBottom: 24 }}>
      <header className="chek-header">
        <div className="chek-title-row">
          <h1 className="chek-title">写给胶己人的一封信</h1>
          <Link href="/feed" className="chek-chip gray" aria-label="返回相辅">
            返回
          </Link>
        </div>
      </header>

      <main className="chek-section" style={{ paddingBottom: 90 }}>
        <article className="chek-card" style={{ padding: 18, borderRadius: 28 }}>
          <header style={{ textAlign: 'center', marginBottom: 18 }}>
            <Image src={cat} alt="CHEK 吉祥物" width={120} height={120} priority />
            <div style={{ fontWeight: 900, fontSize: 18, marginTop: 10 }}>
              写给胶己人：潮汕的体面，要靠大家一起撑起来
            </div>
          </header>

          <section style={{ display: 'grid', gap: 12, lineHeight: 1.9, color: 'rgba(16,16,20,0.78)' }}>
            <p style={{ margin: 0 }}>
              各位胶己人：
              <br />
              这阵子，来潮汕的人多了。街上热闹了，家乡被看见了。
            </p>
            <p style={{ margin: 0 }}>
              但我们也听到了一些声音：有人觉得游客多了不方便，有人觉得过年资源被“挤占”，也有人只想着“旺季多赚一点”。
              这些情绪，不难理解。可我们还是想轻轻讲一句心里话——
            </p>
            <p style={{ margin: 0, fontWeight: 900, color: 'rgba(16,16,20,0.92)' }}>
              游客不是来分走什么，是远道而来，把信任交到潮汕。
            </p>

            <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.08)', margin: '4px 0' }} />

            <p style={{ margin: 0 }}>
              潮汕是我们的家乡。它真正珍贵的，从来不是一时的热闹，而是长久累出来的口碑与体面。
              名声不是天上掉下来的，是
              <strong style={{ color: 'rgba(16,16,20,0.92)' }}>一代代胶己人做人做事撑出来的</strong>。
            </p>

            <div className="chek-card" style={{ padding: 14, borderRadius: 18, background: 'rgba(255,255,255,0.65)' }}>
              <p style={{ margin: 0 }}>
                我们发起「潮客 CHEK」，从一开始就很清楚：
                <br />👉 这是一个纯公益、开源、自发搭起来的项目
                <br />👉 时间很短，但大家的心很齐
                <br />👉 不为流量，只为把事慢慢做对
              </p>
              <p style={{ margin: '10px 0 0 0' }}>
                因为我们相信——城市的温度，从来不是等出来的，是
                <strong style={{ color: 'rgba(16,16,20,0.92)' }}>大家一起守出来的</strong>。
              </p>
            </div>

            <h2 style={{ margin: '2px 0 0 0', fontSize: 18, color: 'rgba(16,16,20,0.92)' }}>🌊 大家可以一起做的事</h2>

            <div className="chek-card" style={{ padding: 14, borderRadius: 18, background: 'rgba(255,255,255,0.65)' }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>① 共建「有知（Wiki）」</div>
              <p style={{ margin: 0 }}>
                把熟悉的经验写下来：哪些地方值得去、哪些消费要留意、哪些习俗容易被误解、哪些本地常识外地朋友并不知道。
                不是为了炫耀，是为了让人少一点不安，多一点安心。
              </p>
            </div>

            <div className="chek-card" style={{ padding: 14, borderRadius: 18, background: 'rgba(255,255,255,0.65)' }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>② 多回一句「相辅（帖子）」</div>
              <p style={{ margin: 0 }}>
                游客发问时，能解释就耐心解释，能提醒就温和提醒。多一点理解，少一点不耐烦。
                很多“不理解”，只是因为他们不是在这里长大的。
              </p>
            </div>

            <div className="chek-card" style={{ padding: 14, borderRadius: 18, background: 'rgba(255,255,255,0.65)' }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>③ 在力所能及处，帮一把</div>
              <p style={{ margin: 0 }}>
                🛏 有条件，可自愿提供临时借宿
                <br />🚗 顺路方便，可帮忙接送或指路
                <br />🙋 景点/节庆期间，参与志愿服务
                <br />☎ 遇到求助，帮忙提供可靠信息
                <br />
                不必勉强，量力而为。但只要多一个人愿意伸手，游客感受到的，就是整座城市的温度。
              </p>
            </div>

            <div className="chek-card" style={{ padding: 14, borderRadius: 18, background: 'rgba(255,255,255,0.65)' }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>④ 做潮汕体面的守护者</div>
              <p style={{ margin: 0 }}>
                不纵容宰客、欺客，不鼓励短期逐利，帮助游客理解合理价格与规矩。
                <br />
                赚钱可以，但别把口碑换掉。
              </p>
            </div>

            <div className="chek-card" style={{ padding: 14, borderRadius: 18, background: 'rgba(255,255,255,0.65)' }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>⑤ 用专业能力支持家乡</div>
              <p style={{ margin: 0 }}>
                如果你有开发 / 设计 / 产品 / 内容治理能力，欢迎直接参与 CHEK 共建：
              </p>
              <a
                href="https://github.com/chekdata/CHEK"
                target="_blank"
                rel="noreferrer"
                style={{ display: 'inline-block', marginTop: 8, fontWeight: 800 }}
              >
                https://github.com/chekdata/CHEK
              </a>
              <p style={{ margin: '8px 0 0 0' }}>
                这是一个真正属于胶己人的公益开源项目。不分身份，只看愿不愿意一起把事情做好。
              </p>
            </div>

            <div className="chek-card" style={{ padding: 14, borderRadius: 18, background: 'rgba(255,255,255,0.65)' }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>⑥ 去社交平台做“潮汕答疑志愿者”</div>
              <p style={{ margin: 0 }}>
                在小红书 / 微博 / 抖音看到游客提问时，主动补一句真实经验：
                <br />- 交通怎么走更稳
                <br />- 价格区间大概多少
                <br />- 哪些时间段容易拥挤
                <br />- 哪些传闻不准确
                <br />
                别争吵，给事实、给链接、给路线，帮外地朋友少走弯路。
              </p>
            </div>

            <div className="chek-card" style={{ padding: 14, borderRadius: 18, background: 'rgba(255,255,255,0.65)' }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>⑦ 发现谣言/黑稿，做“澄清接力”</div>
              <p style={{ margin: 0 }}>
                遇到夸张剪辑或错误信息，先核实再澄清：
                <br />- 引用官方公告或可靠来源
                <br />- 给出更完整的现场情况
                <br />- 提醒大家不要以偏概全
                <br />
                我们不带节奏，只把事实讲清楚。
              </p>
            </div>

            <div className="chek-card" style={{ padding: 14, borderRadius: 18, background: 'rgba(255,255,255,0.65)' }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>⑧ 做“本地价格透明员”</div>
              <p style={{ margin: 0 }}>
                在相辅和有知补充常见消费范围（如停车、打车、餐饮、人均预算），
                并注明“旺季/节假日会有浮动”，帮助游客形成合理预期，减少误会。
              </p>
            </div>

            <div className="chek-card" style={{ padding: 14, borderRadius: 18, background: 'rgba(255,255,255,0.65)' }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>⑨ 主动帮新手做行前清单</div>
              <p style={{ margin: 0 }}>
                可直接复用这四项清单给外地朋友：
                <br />- 到达方案（高铁站/机场到市区）
                <br />- 住宿建议（商圈与通勤）
                <br />- 天气与穿着（雨具/防晒）
                <br />- 应急电话与官方渠道
              </p>
            </div>

            <div className="chek-card" style={{ padding: 14, borderRadius: 18, background: 'rgba(255,255,255,0.65)' }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>⑩ 组织“胶己人轮值答疑”</div>
              <p style={{ margin: 0 }}>
                几个朋友建个小群，按时间轮值看相辅和社交平台评论区。
                每天哪怕只花 15 分钟，也能让游客问题更快得到回应。
                小事长期做，就是城市信誉的护城河。
              </p>
            </div>

            <h2 style={{ margin: '2px 0 0 0', fontSize: 18, color: 'rgba(16,16,20,0.92)' }}>
              🔥 我们想守住的，是潮汕该有的样子
            </h2>
            <p style={{ margin: 0 }}>
              潮汕最动人的，不是旺季多火，而是待客有礼；不是一时赚钱，而是长久安心。
              游客不是过客，是把时间、心情、期待带来的人。
            </p>
            <p style={{ margin: 0 }}>
              当他们离开时，带走的应该是：“潮汕人真好。”“下次还想来。”
            </p>
            <p style={{ margin: 0, fontWeight: 900, color: 'rgba(16,16,20,0.92)' }}>
              这一次，不等别人要求，我们自己把口碑守住。
              <br />
              慢慢做，不急；一起做，更稳。
            </p>

            <div style={{ textAlign: 'right', marginTop: 8 }}>
              <div style={{ fontWeight: 900, color: 'rgba(16,16,20,0.92)' }}>潮客 CHEK 民间志愿者团队</div>
              <div className="chek-muted" style={{ fontSize: 12, fontStyle: 'italic' }}>
                （自己人，自己担；潮汕个体面，咱共守）
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
          href="/wiki/new"
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
          我来补一条有知（共建）
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

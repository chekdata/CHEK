import Link from 'next/link';
import type { Metadata } from 'next';
import { serverGet } from '@/lib/server-api';
import { WikiEntryDTO } from '@/lib/api-types';
import { absoluteUrl, makePageMetadata } from '@/lib/seo';
import { WikiCard } from '@/components/WikiCard';

export const revalidate = 60;
export const metadata: Metadata = makePageMetadata({
  title: '有知 - CHEK',
  description: '有知：潮汕旅行百科与要点整理。',
  path: '/wiki',
  ogType: 'website',
  keywords: ['潮汕', '百科', '路线', '避坑', 'CHEK'],
});

export default async function WikiIndexPage() {
  const entries =
    (await serverGet<WikiEntryDTO[]>('/api/chek-content/v1/wiki/entries?limit=20', {
      revalidateSeconds: 60,
    })) || [];

  const canonical = absoluteUrl('/wiki');
  const indexableEntries = entries.filter((e) => e?.isPublic && e?.isIndexable && !!String(e?.slug || '').trim());
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
        url: canonical,
        name: '有知',
        description: '有知：潮汕旅行百科与要点整理。',
        inLanguage: 'zh-CN',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [{ '@type': 'ListItem', position: 1, name: '有知', item: canonical }],
      },
      {
        '@type': 'ItemList',
        name: '有知词条列表',
        itemListElement: indexableEntries.map((e, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: e.title,
          item: absoluteUrl(`/wiki/${encodeURIComponent(e.slug)}`),
        })),
      },
    ],
  };

  return (
    <>
      <header className="chek-header">
        <div className="chek-title-row">
          <h1 className="chek-title">有知</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/wiki/new" className="chek-chip">
              共建有知
            </Link>
            <Link href="/timeline" className="chek-chip gray">
              劳热
            </Link>
            <Link href="/map" className="chek-chip gray">
              辣辣嗦
            </Link>
          </div>
        </div>

        <div className="chek-search">
          <Link
            href="/search"
            className="chek-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 14px',
              borderRadius: 999,
              border: '1px solid rgba(0,0,0,0.08)',
              background: 'rgba(255,255,255,0.85)',
              flex: 1,
            }}
          >
            <span className="chek-muted">搜：路线 / 注意事项 / 交通 / 早餐…</span>
          </Link>
        </div>
      </header>

      <main className="chek-section" style={{ display: 'grid', gap: 12 }}>
        {entries.length > 0 ? (
          entries.map((e) => <WikiCard key={e.entryId} entry={e} />)
        ) : (
          <div className="chek-card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>还没有词条</div>
            <div className="chek-muted" style={{ lineHeight: 1.7 }}>
              欢迎你来潮汕。现在有知还在慢慢补齐，给你添麻烦了，先说声抱歉。
              <br />
              你可以先去相辅问问大家，或者先搜一下看看有没有相关内容。
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
              <Link href="/search" className="chek-chip gray">
                去搜索
              </Link>
              <Link href="/post/new" className="chek-chip">
                去发相辅
              </Link>
            </div>
          </div>
        )}
      </main>

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}

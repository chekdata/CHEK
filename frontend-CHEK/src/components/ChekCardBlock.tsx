'use client';

type ChekCardItem = { label: string; value: string };

export function ChekCardBlock(props: { title?: string; items?: ChekCardItem[] }) {
  const title = props.title || '要点';
  const items = Array.isArray(props.items) ? props.items : [];

  return (
    <section
      className="chek-card"
      style={{ padding: 14, borderRadius: 18, border: '1px solid rgba(51,136,255,0.22)' }}
    >
      <div style={{ fontWeight: 900, marginBottom: 10 }}>{title}</div>
      <dl style={{ margin: 0, display: 'grid', gap: 8 }}>
        {items.map((it, idx) => (
          <div
            key={`${it.label}-${idx}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '96px 1fr',
              gap: 10,
              alignItems: 'start',
            }}
          >
            <dt className="chek-muted" style={{ margin: 0, fontWeight: 800, fontSize: 12 }}>
              {it.label}
            </dt>
            <dd style={{ margin: 0, fontWeight: 700, fontSize: 13, lineHeight: 1.5 }}>
              {it.value}
            </dd>
          </div>
        ))}
        {items.length === 0 ? (
          <div className="chek-muted" style={{ fontSize: 13 }}>
            这块卡片还没填内容，给你添麻烦了，先抱歉。
          </div>
        ) : null}
      </dl>
    </section>
  );
}

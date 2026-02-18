import Link from 'next/link';
import { WikiEntryDTO } from '@/lib/api-types';

export function WikiCard({ entry }: { entry: WikiEntryDTO }) {
  return (
    <Link
      href={`/wiki/${encodeURIComponent(entry.slug)}`}
      className="chek-card"
      style={{ display: 'block', padding: 16 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span className="chek-chip" style={{ padding: '6px 10px' }}>
          有知
        </span>
        <span className="chek-muted" style={{ fontSize: 12, fontWeight: 700 }}>
          更新于 {entry.updatedAt ? new Date(entry.updatedAt).toLocaleDateString() : '—'}
        </span>
      </div>

      <div style={{ fontWeight: 900, fontSize: 16, lineHeight: 1.3 }}>{entry.title}</div>

      {entry.summary ? (
        <div className="chek-muted" style={{ marginTop: 8, fontSize: 13, lineHeight: 1.5 }}>
          {entry.summary}
        </div>
      ) : null}

      {entry.tags && entry.tags.length > 0 ? (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          {entry.tags.slice(0, 4).map((t) => (
            <span key={t} className="chek-chip" style={{ padding: '6px 10px' }}>
              #{t}
            </span>
          ))}
        </div>
      ) : null}
    </Link>
  );
}


type HighlightOpts = {
  maxQueryLen?: number;
  maxMarks?: number;
};

function cleanQuery(query: string, opts?: HighlightOpts): string {
  const q = String(query || '').trim();
  if (!q) return '';
  const max = opts?.maxQueryLen ?? 32;
  if (q.length > max) return q.slice(0, max);
  return q;
}

export function highlightText(text: string, query: string, opts?: HighlightOpts): React.ReactNode {
  const raw = String(text || '');
  const q = cleanQuery(query, opts);
  if (!raw || !q) return raw;

  const t = raw;
  const lowerT = t.toLowerCase();
  const lowerQ = q.toLowerCase();
  const maxMarks = opts?.maxMarks ?? 12;

  const out: React.ReactNode[] = [];
  let from = 0;
  let marks = 0;

  while (from < t.length) {
    const i = lowerT.indexOf(lowerQ, from);
    if (i < 0) break;
    if (i > from) out.push(t.slice(from, i));
    const matched = t.slice(i, i + q.length);
    out.push(
      <mark
        key={`${i}-${marks}`}
        style={{
          background: 'rgba(51,136,255,0.16)',
          color: 'inherit',
          padding: '0 2px',
          borderRadius: 4,
        }}
      >
        {matched}
      </mark>
    );
    marks++;
    from = i + q.length;
    if (marks >= maxMarks) break;
  }

  if (out.length === 0) return raw;
  if (from < t.length) out.push(t.slice(from));
  return out;
}


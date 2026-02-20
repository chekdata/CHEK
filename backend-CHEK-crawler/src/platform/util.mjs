export function nowIso() {
  return new Date().toISOString();
}

export function safeText(s, maxLen) {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  if (!t) return '';
  if (maxLen && t.length > maxLen) {
    if (maxLen <= 1) return '…'.slice(0, maxLen);
    return `${t.slice(0, maxLen - 1)}…`;
  }
  return t;
}

export function clipTextPreserveNewlines(s, maxLen) {
  const t = String(s || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  if (!t) return '';
  if (maxLen && t.length > maxLen) {
    if (maxLen <= 1) return '…'.slice(0, maxLen);
    return `${t.slice(0, maxLen - 1)}…`;
  }
  return t;
}

export function uniqBy(items, keyFn) {
  const out = [];
  const seen = new Set();
  for (const it of items || []) {
    const k = String(keyFn(it) || '');
    if (!k) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(it);
  }
  return out;
}

export function normalizeUrl(url) {
  const u = String(url || '').trim();
  if (!u) return '';
  try {
    return new URL(u).toString();
  } catch {
    return u;
  }
}


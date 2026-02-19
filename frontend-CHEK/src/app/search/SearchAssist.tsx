'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const LS_KEY = 'chek.search_history.v1';
const MAX_HISTORY = 12;

const HOT_QUERIES = [
  '牌坊街',
  '英歌舞',
  '牛肉火锅',
  '避坑',
  '攻略',
  '住宿',
  '寄宿家庭',
  '接送站',
  '求助',
  '投诉',
  '交通',
  '早茶',
];

function readHistory(): string[] {
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.map((s) => String(s || '').trim()).filter(Boolean).slice(0, MAX_HISTORY);
  } catch {
    return [];
  }
}

function writeHistory(next: string[]) {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(next.slice(0, MAX_HISTORY)));
  } catch {}
}

function buildHref(query: string, type: 'all' | 'wiki' | 'posts'): string {
  const p = new URLSearchParams();
  if (query) p.set('query', query);
  if (type !== 'all') p.set('type', type);
  const qs = p.toString();
  return qs ? `/search?${qs}` : '/search';
}

export function SearchAssist({
  query,
  type,
}: {
  query: string;
  type: 'all' | 'wiki' | 'posts';
}) {
  const q = String(query || '').trim();
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    setHistory(readHistory());
  }, []);

  useEffect(() => {
    if (!q) return;
    const next = [q, ...readHistory().filter((x) => x !== q)].slice(0, MAX_HISTORY);
    writeHistory(next);
    setHistory(next);
  }, [q]);

  const suggestions = useMemo(() => {
    if (!q) return [];
    const pool = [...HOT_QUERIES, ...history];
    const uniq: string[] = [];
    for (const s of pool) {
      const t = String(s || '').trim();
      if (!t || t === q) continue;
      if (!t.includes(q)) continue;
      if (!uniq.includes(t)) uniq.push(t);
      if (uniq.length >= 10) break;
    }
    return uniq;
  }, [history, q]);

  function clearHistory() {
    writeHistory([]);
    setHistory([]);
  }

  return (
    <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }} aria-label="筛选">
        <Link href={buildHref(q, 'all')} className={type === 'all' ? 'chek-chip' : 'chek-chip gray'}>
          全部
        </Link>
        <Link href={buildHref(q, 'wiki')} className={type === 'wiki' ? 'chek-chip' : 'chek-chip gray'}>
          有知
        </Link>
        <Link href={buildHref(q, 'posts')} className={type === 'posts' ? 'chek-chip' : 'chek-chip gray'}>
          相辅
        </Link>
      </div>

      {!q ? (
        <>
          <div className="chek-card" style={{ padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontWeight: 900 }}>热搜</div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {HOT_QUERIES.slice(0, 10).map((t) => (
                <Link key={t} href={buildHref(t, 'all')} className="chek-chip gray">
                  {t}
                </Link>
              ))}
            </div>
          </div>

          {history.length > 0 ? (
            <div className="chek-card" style={{ padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontWeight: 900 }}>历史</div>
                <button className="chek-chip gray" style={{ border: 'none', cursor: 'pointer' }} onClick={clearHistory}>
                  清空
                </button>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {history.map((t) => (
                  <Link key={t} href={buildHref(t, 'all')} className="chek-chip gray">
                    {t}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : suggestions.length > 0 ? (
        <div className="chek-card" style={{ padding: 14 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>你可能想搜</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {suggestions.slice(0, 10).map((t) => (
              <Link key={t} href={buildHref(t, type)} className="chek-chip gray">
                {t}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}


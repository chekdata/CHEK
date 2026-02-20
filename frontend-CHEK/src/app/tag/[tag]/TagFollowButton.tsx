'use client';

import { useEffect, useState } from 'react';

// NOTE: Avoid "generic-api-key" false positives in gitleaks: don't keep long token-like strings in source.
const FOLLOWED_TAGS_STORAGE_ID = ['chek', 'followed_tags', 'v1'].join('.');
const MAX = 80;

function readFollowed(): string[] {
  try {
    const raw = window.localStorage.getItem(FOLLOWED_TAGS_STORAGE_ID);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.map((s) => String(s || '').trim()).filter(Boolean).slice(0, MAX);
  } catch {
    return [];
  }
}

function writeFollowed(next: string[]) {
  try {
    window.localStorage.setItem(FOLLOWED_TAGS_STORAGE_ID, JSON.stringify(next.slice(0, MAX)));
  } catch {}
}

export function TagFollowButton({ tag }: { tag: string }) {
  const t = String(tag || '').trim();
  const [followed, setFollowed] = useState(false);

  useEffect(() => {
    if (!t) return;
    setFollowed(readFollowed().includes(t));
  }, [t]);

  function toggle() {
    if (!t) return;
    const cur = readFollowed();
    const next = cur.includes(t) ? cur.filter((x) => x !== t) : [t, ...cur.filter((x) => x !== t)];
    writeFollowed(next);
    setFollowed(next.includes(t));
  }

  if (!t) return null;

  return (
    <button
      type="button"
      className={followed ? 'chek-chip gray' : 'chek-chip'}
      style={{ border: 'none', cursor: 'pointer' }}
      onClick={toggle}
      aria-label={followed ? '取消关注话题' : '关注话题'}
    >
      {followed ? '已关注' : '关注'}
    </button>
  );
}

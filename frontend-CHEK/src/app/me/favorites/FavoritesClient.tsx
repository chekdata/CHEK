'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { PostDTO } from '@/lib/api-types';
import { clientFetch } from '@/lib/client-api';
import { getToken } from '@/lib/token';
import { PostCard } from '@/components/PostCard';

export default function FavoritesClient() {
  const authed = !!getToken();

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [list, setList] = useState<PostDTO[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const cursor = useMemo(() => {
    const last = list[list.length - 1];
    return last?.postId ? Number(last.postId) : 0;
  }, [list]);

  async function loadFirstPage() {
    if (!authed) {
      setLoading(false);
      setList([]);
      setHasMore(false);
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      const data = await clientFetch<PostDTO[]>(`/api/chek-content/v1/me/favorites?limit=20`, {
        method: 'GET',
        auth: true,
      });
      const arr = Array.isArray(data) ? data : [];
      setList(arr);
      setHasMore(arr.length >= 20);
    } catch (e: any) {
      setMsg(e?.message || '加载失败了，真诚抱歉。');
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (!authed) return;
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setMsg(null);
    try {
      const data = await clientFetch<PostDTO[]>(
        `/api/chek-content/v1/me/favorites?limit=20&cursor=${encodeURIComponent(String(cursor || 0))}`,
        { method: 'GET', auth: true }
      );
      const arr = Array.isArray(data) ? data : [];
      setList((prev) => {
        const next = [...prev];
        for (const p of arr) {
          if (!next.some((x) => x.postId === p.postId)) next.push(p);
        }
        return next;
      });
      setHasMore(arr.length >= 20);
    } catch (e: any) {
      setMsg(e?.message || '加载失败了，真诚抱歉。');
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    loadFirstPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  if (!authed) {
    return (
      <div className="chek-card" style={{ padding: 16 }}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>先登录一下</div>
        <div className="chek-muted" style={{ lineHeight: 1.7 }}>
          登录后你才能看到自己收藏过的相辅。
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
          <Link href="/auth/login?next=/me/favorites" className="chek-chip">
            去登录
          </Link>
          <Link href="/feed" className="chek-chip gray">
            去相辅
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {msg ? (
        <div className="chek-card" style={{ padding: 12, borderRadius: 18 }}>
          <div className="chek-muted" style={{ lineHeight: 1.7 }}>
            {msg}
          </div>
          <div style={{ marginTop: 10 }}>
            <button className="chek-chip gray" style={{ border: 'none', cursor: 'pointer' }} onClick={loadFirstPage}>
              重试
            </button>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="chek-card" style={{ padding: 16 }}>
          <div className="chek-muted">加载中…</div>
        </div>
      ) : list.length > 0 ? (
        <>
          {list.map((p) => (
            <PostCard key={p.postId} post={p} />
          ))}

          {hasMore ? (
            <button
              className="chek-chip gray"
              style={{ border: 'none', cursor: 'pointer', justifyContent: 'center' }}
              onClick={loadMore}
              disabled={loadingMore}
            >
              {loadingMore ? '加载中…' : '加载更多'}
            </button>
          ) : (
            <div className="chek-muted" style={{ textAlign: 'center', padding: '6px 0' }}>
              没有更多了
            </div>
          )}
        </>
      ) : (
        <div className="chek-card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>还没有收藏</div>
          <div className="chek-muted" style={{ lineHeight: 1.7 }}>
            看到有用的相辅，点一下 ☆ 就会出现在这里。
          </div>
          <div style={{ marginTop: 12 }}>
            <Link href="/feed" className="chek-chip gray">
              去相辅
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}


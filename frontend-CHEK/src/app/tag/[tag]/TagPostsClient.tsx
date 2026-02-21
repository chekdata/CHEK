'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { PostDTO } from '@/lib/api-types';
import { clientFetch } from '@/lib/client-api';
import { PostCard } from '@/components/PostCard';

const PAGE_SIZE = 20;

function score(p: PostDTO): number {
  const like = Number(p.likeCount || 0);
  const fav = Number(p.favoriteCount || 0);
  const c = Number(p.commentCount || 0);
  return like * 2 + fav * 3 + c;
}

export function TagPostsClient({ tag, initialPosts }: { tag: string; initialPosts: PostDTO[] }) {
  const safeTag = String(tag || '').trim();
  const [sort, setSort] = useState<'new' | 'hot'>('new');
  const [posts, setPosts] = useState<PostDTO[]>(Array.isArray(initialPosts) ? initialPosts : []);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const cursor = useMemo(() => {
    const last = posts[posts.length - 1];
    return last?.postId ? Number(last.postId) : 0;
  }, [posts]);

  useEffect(() => {
    setPosts(Array.isArray(initialPosts) ? initialPosts : []);
    setHasMore((Array.isArray(initialPosts) ? initialPosts.length : 0) >= PAGE_SIZE);
  }, [initialPosts]);

  async function loadMore() {
    if (!safeTag) return;
    if (loadingMore || !hasMore) return;
    if (!cursor) return;
    setLoadingMore(true);
    setMsg(null);
    try {
      const data = await clientFetch<PostDTO[]>(
        `/api/chek-content/v1/posts?tags=${encodeURIComponent(safeTag)}&limit=${PAGE_SIZE}&cursor=${encodeURIComponent(String(cursor))}`,
        { method: 'GET', auth: true }
      );
      const arr = Array.isArray(data) ? data : [];
      setPosts((prev) => {
        const next = [...prev];
        for (const p of arr) {
          if (!next.some((x) => x.postId === p.postId)) next.push(p);
        }
        return next;
      });
      setHasMore(arr.length >= PAGE_SIZE);
    } catch (e: any) {
      setMsg(e?.message || '加载失败了，真诚抱歉。');
    } finally {
      setLoadingMore(false);
    }
  }

  const displayPosts = useMemo(() => {
    if (sort === 'new') return posts;
    const next = [...posts];
    next.sort((a, b) => {
      const sa = score(a);
      const sb = score(b);
      if (sb !== sa) return sb - sa;
      return Number(b.postId) - Number(a.postId);
    });
    return next;
  }, [posts, sort]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (hit) loadMore();
      },
      { root: null, rootMargin: '400px 0px', threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentinelRef, cursor, hasMore, loadingMore, safeTag]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ fontWeight: 900 }}>相辅</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className={sort === 'new' ? 'chek-chip' : 'chek-chip gray'}
            style={{ border: 'none', cursor: 'pointer' }}
            onClick={() => setSort('new')}
          >
            最新
          </button>
          <button
            type="button"
            className={sort === 'hot' ? 'chek-chip' : 'chek-chip gray'}
            style={{ border: 'none', cursor: 'pointer' }}
            onClick={() => setSort('hot')}
          >
            热度
          </button>
        </div>
      </div>

      {msg ? (
        <div className="chek-card" style={{ padding: 12, borderRadius: 18 }}>
          <div className="chek-muted" style={{ lineHeight: 1.7 }}>
            {msg}
          </div>
          <div style={{ marginTop: 10 }}>
            <button className="chek-chip gray" style={{ border: 'none', cursor: 'pointer' }} onClick={loadMore}>
              重试
            </button>
          </div>
        </div>
      ) : null}

      {displayPosts.length > 0 ? (
        displayPosts.map((p) => <PostCard key={p.postId} post={p} />)
      ) : (
        <div className="chek-muted" style={{ lineHeight: 1.7 }}>
          这个标签下暂时还没有相辅。欢迎你先发一条，我们一起把信息补齐。
        </div>
      )}

      <div ref={sentinelRef} />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', justifyItems: 'center', paddingTop: 6 }}>
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
          <div className="chek-muted">没有更多了</div>
        )}
      </div>
    </div>
  );
}


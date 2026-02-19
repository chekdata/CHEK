'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { PostDTO } from '@/lib/api-types';
import { clientFetch } from '@/lib/client-api';
import { PostCard } from '@/components/PostCard';

const CACHE_KEY = 'chek.feed.cache.v1';
const CACHE_TTL_MS = 60 * 60 * 1000;
const PAGE_SIZE = 20;

type FeedCache = {
  ts: number;
  posts: PostDTO[];
  hasMore: boolean;
  scrollY: number;
};

function safeParseCache(raw: string | null): FeedCache | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<FeedCache>;
    if (!parsed || typeof parsed !== 'object') return null;
    const ts = Number(parsed.ts || 0);
    if (!Number.isFinite(ts) || ts <= 0) return null;
    if (Date.now() - ts > CACHE_TTL_MS) return null;
    const posts = Array.isArray(parsed.posts) ? (parsed.posts as PostDTO[]) : [];
    const hasMore = parsed.hasMore !== false;
    const scrollY = Number(parsed.scrollY || 0);
    return { ts, posts, hasMore, scrollY: Number.isFinite(scrollY) ? scrollY : 0 };
  } catch {
    return null;
  }
}

function persistCache(next: FeedCache) {
  try {
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function FeedClient({ initialPosts }: { initialPosts: PostDTO[] }) {
  const [posts, setPosts] = useState<PostDTO[]>(Array.isArray(initialPosts) ? initialPosts : []);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pullPx, setPullPx] = useState(0);
  const [pullReady, setPullReady] = useState(false);

  const restoreDoneRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);
  const lastScrollYRef = useRef(0);

  const cursor = useMemo(() => {
    const last = posts[posts.length - 1];
    return last?.postId ? Number(last.postId) : 0;
  }, [posts]);

  function schedulePersist() {
    if (saveTimerRef.current) return;
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      persistCache({
        ts: Date.now(),
        posts: posts.slice(0, 200),
        hasMore,
        scrollY: Math.max(0, lastScrollYRef.current || 0),
      });
    }, 250);
  }

  useEffect(() => {
    try {
      const cached = safeParseCache(window.sessionStorage.getItem(CACHE_KEY));
      if (cached && cached.posts.length > 0) {
        setPosts(cached.posts);
        setHasMore(cached.hasMore);
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => window.scrollTo({ top: cached.scrollY || 0 }));
        });
      } else {
        setHasMore(true);
      }
    } finally {
      restoreDoneRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!restoreDoneRef.current) return;
    schedulePersist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts, hasMore]);

  useEffect(() => {
    function onScroll() {
      lastScrollYRef.current = window.scrollY || 0;
      schedulePersist();
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      persistCache({
        ts: Date.now(),
        posts: posts.slice(0, 200),
        hasMore,
        scrollY: Math.max(0, lastScrollYRef.current || 0),
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts, hasMore]);

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    if (!cursor) return;
    setLoadingMore(true);
    setMsg(null);
    try {
      const data = await clientFetch<PostDTO[]>(
        `/api/chek-content/v1/posts?limit=${PAGE_SIZE}&cursor=${encodeURIComponent(String(cursor))}`,
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

  async function refreshAll() {
    setMsg(null);
    setLoadingMore(true);
    try {
      const data = await clientFetch<PostDTO[]>(`/api/chek-content/v1/posts?limit=${PAGE_SIZE}`, {
        method: 'GET',
        auth: true,
      });
      const arr = Array.isArray(data) ? data : [];
      setPosts(arr);
      setHasMore(arr.length >= PAGE_SIZE);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: any) {
      setMsg(e?.message || '刷新失败了，真诚抱歉。');
    } finally {
      setLoadingMore(false);
      setPullPx(0);
      setPullReady(false);
    }
  }

  // Infinite scroll sentinel
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
  }, [sentinelRef, cursor, hasMore, loadingMore]);

  // Minimal pull-to-refresh
  useEffect(() => {
    let startY = 0;
    let tracking = false;

    function onTouchStart(e: TouchEvent) {
      if (window.scrollY > 0) return;
      const y = e.touches?.[0]?.clientY;
      if (!y) return;
      startY = y;
      tracking = true;
    }

    function onTouchMove(e: TouchEvent) {
      if (!tracking) return;
      if (window.scrollY > 0) return;
      const y = e.touches?.[0]?.clientY;
      if (!y) return;
      const dy = Math.max(0, y - startY);
      const px = Math.min(110, dy * 0.55);
      setPullPx(px);
      setPullReady(px >= 64);
    }

    function onTouchEnd() {
      if (!tracking) return;
      tracking = false;
      if (pullReady) {
        refreshAll();
        return;
      }
      setPullPx(0);
      setPullReady(false);
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pullReady]);

  const pullText = loadingMore ? '刷新中…' : pullReady ? '松手刷新' : pullPx > 10 ? '下拉刷新' : '';

  return (
    <>
      {pullPx > 6 ? (
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 5,
            margin: '0 0 -6px',
            paddingTop: 8,
            height: pullPx,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            pointerEvents: 'none',
            transition: loadingMore ? 'height 0.12s ease' : undefined,
          }}
        >
          <div className="chek-muted" style={{ fontSize: 12, fontWeight: 800 }}>
            {pullText}
          </div>
        </div>
      ) : null}

      {msg ? (
        <div className="chek-card" style={{ padding: 12, borderRadius: 18 }}>
          <div className="chek-muted" style={{ lineHeight: 1.7 }}>
            {msg}
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
            <button className="chek-chip gray" style={{ border: 'none', cursor: 'pointer' }} onClick={refreshAll}>
              重试
            </button>
            <button className="chek-chip gray" style={{ border: 'none', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              回顶部
            </button>
          </div>
        </div>
      ) : null}

      {posts.map((p) => (
        <PostCard key={p.postId} post={p} />
      ))}

      <div ref={sentinelRef} />

      <div style={{ display: 'grid', gap: 10, justifyItems: 'center', paddingBottom: 8 }}>
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
          <div className="chek-muted" style={{ padding: '6px 0' }}>
            没有更多了
          </div>
        )}
      </div>
    </>
  );
}

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { PostMediaDTO } from '@/lib/api-types';
import { resolveMediaObject } from '@/lib/media';
import { SkeletonBlock } from '@/components/Skeleton';

type MediaView = {
  mediaObjectId: number;
  kind: string;
  url: string;
  contentType: string;
  loading: boolean;
  error?: string;
};

export function MediaGallery({ media }: { media?: PostMediaDTO[] }) {
  const list = Array.isArray(media) ? media : [];
  const [views, setViews] = useState<MediaView[]>([]);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const touchRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const list = Array.isArray(media) ? media : [];
    let canceled = false;
    async function run() {
      const results = await Promise.allSettled(
        list.map((m) => resolveMediaObject(m.mediaObjectId))
      );
      if (canceled) return;
      setViews(
        list.map((m, i) => {
          const r = results[i];
          if (r && r.status === 'fulfilled') {
            return {
              mediaObjectId: m.mediaObjectId,
              kind: m.kind,
              url: r.value.url || '',
              contentType: r.value.contentType || '',
              loading: false,
            };
          }
          return {
            mediaObjectId: m.mediaObjectId,
            kind: m.kind,
            url: '',
            contentType: '',
            loading: false,
            error: '加载失败',
          };
        })
      );
    }
    setViews(
      list.map((m) => ({
        mediaObjectId: m.mediaObjectId,
        kind: m.kind,
        url: '',
        contentType: '',
        loading: true,
      }))
    );
    run();
    return () => {
      canceled = true;
    };
  }, [media]);

  const viewer = viewerIndex === null ? null : views[viewerIndex] || null;
  const viewerIsImage = useMemo(() => {
    const ct = String(viewer?.contentType || '').toLowerCase();
    if (ct.startsWith('image/')) return true;
    if (viewer?.kind && String(viewer.kind).toUpperCase() === 'IMAGE') return true;
    return false;
  }, [viewer?.contentType, viewer?.kind]);

  useEffect(() => {
    if (viewerIndex === null) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setViewerIndex(null);
      if (e.key === 'ArrowLeft') setViewerIndex((i) => (i === null ? i : Math.max(0, i - 1)));
      if (e.key === 'ArrowRight') setViewerIndex((i) => (i === null ? i : Math.min(views.length - 1, i + 1)));
    }
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [viewerIndex, views.length]);

  function prev() {
    setViewerIndex((i) => (i === null ? i : Math.max(0, i - 1)));
  }
  function next() {
    setViewerIndex((i) => (i === null ? i : Math.min(views.length - 1, i + 1)));
  }

  if (list.length === 0) return null;

  return (
    <section style={{ display: 'grid', gap: 10, marginTop: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {views.map((v, idx) => (
          <button
            key={v.mediaObjectId}
            type="button"
            className="chek-card"
            style={{
              padding: 6,
              borderRadius: 18,
              cursor: v.loading ? 'default' : 'pointer',
              textAlign: 'left',
            }}
            onClick={() => {
              if (!v.loading) setViewerIndex(idx);
            }}
            aria-label="查看媒体"
          >
            {v.loading ? (
              <SkeletonBlock width="100%" height="100%" radius={12} style={{ aspectRatio: '1 / 1' }} />
            ) : v.error ? (
              <div className="chek-muted" style={{ padding: 10 }}>
                {v.error}
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                {String(v.contentType || '').toLowerCase().startsWith('image/') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={v.url}
                    alt=""
                    style={{ width: '100%', borderRadius: 12, aspectRatio: '1 / 1', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    className="chek-muted"
                    style={{
                      width: '100%',
                      borderRadius: 12,
                      aspectRatio: '1 / 1',
                      background: 'rgba(0,0,0,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    视频
                  </div>
                )}
                {String(v.contentType || '').toLowerCase().startsWith('video/') ? (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      textShadow: '0 6px 18px rgba(0,0,0,0.45)',
                    }}
                    aria-hidden
                  >
                    <svg width="42" height="42" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                ) : null}
              </div>
            )}
          </button>
        ))}
      </div>

      {viewerIndex !== null ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="媒体预览"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            background: 'rgba(0,0,0,0.88)',
            display: 'grid',
            gridTemplateRows: 'auto 1fr auto',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewerIndex(null);
          }}
          onTouchStart={(e) => {
            const t = e.touches?.[0];
            if (!t) return;
            touchRef.current = { x: t.clientX, y: t.clientY };
          }}
          onTouchEnd={(e) => {
            const start = touchRef.current;
            touchRef.current = null;
            const t = e.changedTouches?.[0];
            if (!start || !t) return;
            const dx = t.clientX - start.x;
            const dy = t.clientY - start.y;
            if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
            if (dx > 0) prev();
            else next();
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: `calc(env(safe-area-inset-top) + 10px) 14px 10px`,
              color: 'rgba(255,255,255,0.92)',
            }}
          >
            <div style={{ fontWeight: 900 }}>
              {viewerIndex + 1}/{views.length}
            </div>
            <button
              type="button"
              className="chek-card"
              style={{
                width: 36,
                height: 36,
                borderRadius: 999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(255,255,255,0.08)',
                color: 'white',
                cursor: 'pointer',
              }}
              onClick={() => setViewerIndex(null)}
              aria-label="关闭"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              placeItems: 'center',
              padding: '0 14px',
            }}
          >
            {!viewer ? (
              <div className="chek-muted" style={{ color: 'rgba(255,255,255,0.75)' }}>
                加载中…
              </div>
            ) : viewer.error ? (
              <div className="chek-muted" style={{ color: 'rgba(255,255,255,0.75)' }}>
                {viewer.error}
              </div>
            ) : viewerIsImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={viewer.url}
                alt=""
                style={{
                  maxWidth: 'min(420px, 100%)',
                  width: '100%',
                  maxHeight: 'calc(100vh - 180px)',
                  objectFit: 'contain',
                  borderRadius: 16,
                  background: 'rgba(255,255,255,0.04)',
                }}
              />
            ) : (
              <video
                src={viewer.url}
                controls
                playsInline
                style={{
                  maxWidth: 'min(420px, 100%)',
                  width: '100%',
                  maxHeight: 'calc(100vh - 180px)',
                  borderRadius: 16,
                  background: 'rgba(255,255,255,0.04)',
                }}
              />
            )}
          </div>

          <div
            style={{
              padding: `10px 14px calc(env(safe-area-inset-bottom) + 14px)`,
              display: 'flex',
              justifyContent: 'space-between',
              gap: 10,
              color: 'white',
            }}
          >
            <button
              type="button"
              className="chek-chip gray"
              style={{ border: 'none', cursor: viewerIndex <= 0 ? 'not-allowed' : 'pointer', opacity: viewerIndex <= 0 ? 0.4 : 1 }}
              onClick={prev}
              disabled={viewerIndex <= 0}
            >
              上一张
            </button>
            <button
              type="button"
              className="chek-chip gray"
              style={{
                border: 'none',
                cursor: viewerIndex >= views.length - 1 ? 'not-allowed' : 'pointer',
                opacity: viewerIndex >= views.length - 1 ? 0.4 : 1,
              }}
              onClick={next}
              disabled={viewerIndex >= views.length - 1}
            >
              下一张
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

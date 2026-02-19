'use client';

import { useEffect, useMemo, useState } from 'react';
import type { GetMediaResponse, PostMediaDTO } from '@/lib/api-types';
import { clientFetch } from '@/lib/client-api';

type MediaView = {
  mediaObjectId: number;
  kind: string;
  url: string;
  loading: boolean;
  error?: string;
};

export function MediaGallery({ media }: { media?: PostMediaDTO[] }) {
  const list = useMemo(() => (Array.isArray(media) ? media : []), [media]);
  const mediaKey = useMemo(() => list.map((m) => m.mediaObjectId).join(','), [list]);
  const [views, setViews] = useState<MediaView[]>(
    list.map((m) => ({
      mediaObjectId: m.mediaObjectId,
      kind: m.kind,
      url: '',
      loading: true,
    }))
  );

  useEffect(() => {
    let canceled = false;
    async function run() {
      const next: MediaView[] = [];
      for (const m of list) {
        try {
          const dto = await clientFetch<GetMediaResponse>(`/api/chek-media/v1/media/${m.mediaObjectId}`, {
            method: 'GET',
          });
          next.push({
            mediaObjectId: m.mediaObjectId,
            kind: m.kind,
            url: dto?.getUrl || '',
            loading: false,
          });
        } catch (e: any) {
          next.push({
            mediaObjectId: m.mediaObjectId,
            kind: m.kind,
            url: '',
            loading: false,
            error: e?.message || '加载失败',
          });
        }
      }
      if (!canceled) setViews(next);
    }
    setViews(
      list.map((m) => ({ mediaObjectId: m.mediaObjectId, kind: m.kind, url: '', loading: true }))
    );
    run();
    return () => {
      canceled = true;
    };
  }, [list, mediaKey]);

  if (list.length === 0) return null;

  return (
    <section style={{ display: 'grid', gap: 10, marginTop: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {views.map((v) => (
          <div key={v.mediaObjectId} className="chek-card" style={{ padding: 6, borderRadius: 18 }}>
            {v.loading ? (
              <div className="chek-muted" style={{ padding: 10 }}>
                加载中…
              </div>
            ) : v.error ? (
              <div className="chek-muted" style={{ padding: 10 }}>
                {v.error}
              </div>
            ) : v.kind === 'VIDEO' ? (
              <video src={v.url} controls style={{ width: '100%', borderRadius: 12 }} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={v.url} alt="" style={{ width: '100%', borderRadius: 12 }} />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

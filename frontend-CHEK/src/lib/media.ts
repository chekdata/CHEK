'use client';

import type { GetMediaResponse } from '@/lib/api-types';
import { clientFetch } from '@/lib/client-api';

export type ResolvedMediaObject = {
  url: string;
  contentType: string;
};

const mediaCache = new Map<number, ResolvedMediaObject>();
const inflight = new Map<number, Promise<ResolvedMediaObject>>();

export async function resolveMediaObject(mediaObjectId: number): Promise<ResolvedMediaObject> {
  const id = Number(mediaObjectId);
  if (!Number.isFinite(id) || id <= 0) return { url: '', contentType: '' };

  const cached = mediaCache.get(id);
  if (cached) return cached;

  const running = inflight.get(id);
  if (running) return running;

  const p = (async () => {
    const dto = await clientFetch<GetMediaResponse>(`/api/chek-media/v1/media/${id}`, { method: 'GET' });
    const v = { url: String(dto?.getUrl || ''), contentType: String(dto?.contentType || '') };
    mediaCache.set(id, v);
    return v;
  })()
    .catch(() => ({ url: '', contentType: '' }))
    .finally(() => {
      inflight.delete(id);
    });

  inflight.set(id, p);
  return p;
}


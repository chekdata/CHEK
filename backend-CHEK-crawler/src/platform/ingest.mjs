import { z } from 'zod';

const ItemSchema = z.object({
  sourcePlatform: z.string().min(1).max(32),
  sourceId: z.string().min(1).max(128),
  sourceUrl: z.string().url().max(500),
  title: z.string().max(120).optional().nullable(),
  body: z.string().min(1).max(4000),
  tags: z.array(z.string().min(1).max(64)).optional().nullable(),
  locationName: z.string().max(120).optional().nullable(),
  lng: z.number().optional().nullable(),
  lat: z.number().optional().nullable(),
  occurredAt: z.string().datetime().optional().nullable(),
  authorUserOneId: z.string().max(64).optional().nullable(),
});

function resolveEndpoint(baseUrl) {
  const u = new URL(String(baseUrl || '').replace(/\/+$/, '') + '/');
  return new URL('v1/ingest/externalPosts:upsert', u).toString();
}

export async function ingestExternalPost(baseUrl, ingestToken, item) {
  const parsed = ItemSchema.safeParse(item);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`invalid item: ${msg}`);
  }
  const url = resolveEndpoint(baseUrl);
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-ingest-token': String(ingestToken || '').trim(),
    },
    body: JSON.stringify(parsed.data),
  });
  const text = await r.text();
  if (!r.ok) {
    throw new Error(`HTTP ${r.status}: ${text.slice(0, 500)}`);
  }
  return { status: 'ok' };
}


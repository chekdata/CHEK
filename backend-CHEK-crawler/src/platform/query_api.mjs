import { z } from 'zod';

const ResponseDataSchema = z.object({
  success: z.boolean(),
  code: z.string().optional().nullable(),
  message: z.string().optional().nullable(),
  data: z.any().optional(),
});

function resolveEndpoint(baseUrl, path) {
  const u = new URL(String(baseUrl || '').replace(/\/+$/, '') + '/');
  return new URL(path.replace(/^\//, ''), u).toString();
}

async function postJson(url, ingestToken, body) {
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-ingest-token': String(ingestToken || '').trim(),
    },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${text.slice(0, 500)}`);

  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  const parsed = ResponseDataSchema.safeParse(json);
  if (!parsed.success) throw new Error(`invalid ResponseData: ${text.slice(0, 500)}`);
  if (parsed.data.success !== true) {
    const code = String(parsed.data.code || 'ERROR');
    const msg = String(parsed.data.message || 'unknown error');
    throw new Error(`${code}: ${msg}`);
  }
  return parsed.data.data;
}

export async function upsertCrawlerQueries(baseUrl, ingestToken, platform, queries) {
  const url = resolveEndpoint(baseUrl, '/v1/ingest/crawlerQueries:upsert');
  const p = String(platform || '').trim();
  const arr = Array.isArray(queries) ? queries.map((x) => String(x || '').trim()).filter(Boolean) : [];
  if (!p || arr.length === 0) return false;
  await postJson(url, ingestToken, { platform: p, queries: arr });
  return true;
}

export async function sampleCrawlerQueries(baseUrl, ingestToken, platform, limit) {
  const url = resolveEndpoint(baseUrl, '/v1/ingest/crawlerQueries:sample');
  const p = String(platform || '').trim();
  const n = Number(limit || 0) || 10;
  if (!p) return [];
  const data = await postJson(url, ingestToken, { platform: p, limit: n });
  return Array.isArray(data) ? data.map((x) => String(x || '').trim()).filter(Boolean) : [];
}

export async function reportCrawlerQueries(baseUrl, ingestToken, platform, items) {
  const url = resolveEndpoint(baseUrl, '/v1/ingest/crawlerQueries:report');
  const p = String(platform || '').trim();
  const arr = Array.isArray(items) ? items : [];
  if (!p || arr.length === 0) return false;
  await postJson(url, ingestToken, { platform: p, items: arr });
  return true;
}


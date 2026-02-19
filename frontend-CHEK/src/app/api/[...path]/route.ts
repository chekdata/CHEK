import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
]);

function getApiBaseUrl(): string {
  const raw = String(process.env.CHEK_API_BASE_URL || 'https://api-dev.chekkk.com').trim();
  return raw.replace(/\/+$/, '');
}

function extractApiPath(pathname: string): string {
  // Support optional Next.js basePath (e.g. /chek/api/...) by slicing from the first /api/ segment.
  const i = pathname.indexOf('/api/');
  if (i >= 0) return pathname.slice(i);
  return pathname || '/';
}

function normalizeRequestHeaders(req: NextRequest): Headers {
  const h = new Headers(req.headers);

  // Remove hop-by-hop headers.
  for (const k of HOP_BY_HOP_HEADERS) h.delete(k);
  h.delete('host');

  // Avoid proxying compressed responses to prevent header/body mismatch.
  h.delete('accept-encoding');

  const host = req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') || req.nextUrl.protocol.replace(/:$/, '');
  if (host) h.set('x-forwarded-host', host);
  if (proto) h.set('x-forwarded-proto', proto);

  return h;
}

function normalizeResponseHeaders(upstream: Response): Headers {
  const h = new Headers(upstream.headers);
  for (const k of HOP_BY_HOP_HEADERS) h.delete(k);
  h.delete('content-encoding');
  h.delete('transfer-encoding');
  h.delete('connection');
  return h;
}

async function handler(req: NextRequest): Promise<Response> {
  const base = getApiBaseUrl();
  const apiPath = extractApiPath(req.nextUrl.pathname);
  const url = `${base}${apiPath}${req.nextUrl.search}`;

  const method = String(req.method || 'GET').toUpperCase();
  const hasBody = !(method === 'GET' || method === 'HEAD');

  let body: ArrayBuffer | undefined;
  if (hasBody) {
    try {
      const ab = await req.arrayBuffer();
      if (ab.byteLength > 0) body = ab;
    } catch {
      body = undefined;
    }
  }

  try {
    const upstream = await fetch(url, {
      method,
      headers: normalizeRequestHeaders(req),
      body,
      redirect: 'manual',
    });
    return new Response(upstream.body, {
      status: upstream.status,
      headers: normalizeResponseHeaders(upstream),
    });
  } catch (e: any) {
    const msg = String(e?.message || 'bad gateway');
    return new Response(
      JSON.stringify({ code: 'BAD_GATEWAY', message: msg, data: null, success: false, traceId: '' }),
      { status: 502, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
export const HEAD = handler;


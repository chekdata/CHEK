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

const USER_INFO_CACHE_TTL_MS = 10 * 60 * 1000;
const userInfoCache = new Map<string, { userOneId: string; isAdmin: boolean; expiresAt: number }>();

type AuthIdentity = {
  userOneId: string;
  isAdmin: boolean;
};

function getApiBaseUrl(): string {
  const raw = String(process.env.CHEK_API_BASE_URL || 'https://api-dev.chekkk.com').trim();
  return raw.replace(/\/+$/, '');
}

function getAuthBaseUrl(req: NextRequest): string {
  const raw = String(process.env.CHEK_AUTH_BASE_URL || process.env.CHEK_API_BASE_URL || 'https://api-dev.chekkk.com').trim();
  const normalized = raw.replace(/\/+$/, '');

  try {
    const authHost = new URL(normalized).host;
    const requestHost = req.headers.get('host') || '';
    if (authHost && requestHost && authHost === requestHost) {
      return 'https://api-dev.chekkk.com';
    }
  } catch {}

  return normalized || 'https://api-dev.chekkk.com';
}

function extractApiPath(pathname: string): string {
  // Support optional Next.js basePath (e.g. /chek/api/...) by slicing from the first /api/ segment.
  const i = pathname.indexOf('/api/');
  if (i >= 0) return pathname.slice(i);
  return pathname || '/';
}

function shouldResolveIdentity(apiPath: string): boolean {
  if (!apiPath.startsWith('/api/')) return false;
  if (apiPath.startsWith('/api/auth/')) return false;
  return apiPath.startsWith('/api/chek-');
}

function extractIdentity(payload: any): AuthIdentity | null {
  if (!payload || typeof payload !== 'object') return null;
  const data = payload.success === true && payload.data && typeof payload.data === 'object' ? payload.data : payload;
  if (!data || typeof data !== 'object') return null;

  const raw =
    (data as any).userOneId ??
    (data as any).user_one_id ??
    (data as any).userId ??
    (data as any).user_id ??
    '';
  const userOneId = String(raw || '').trim();
  if (!userOneId) return null;

  const isAdmin = (data as any).boolAdmin === true || (data as any).isAdmin === true;
  return { userOneId, isAdmin };
}

async function resolveIdentity(req: NextRequest, authorization: string): Promise<AuthIdentity | null> {
  const authz = String(authorization || '').trim();
  if (!authz) return null;

  const cached = userInfoCache.get(authz);
  if (cached && cached.expiresAt > Date.now()) {
    return { userOneId: cached.userOneId, isAdmin: cached.isAdmin };
  }

  try {
    const authBase = getAuthBaseUrl(req);
    const upstream = await fetch(`${authBase}/api/auth/v1/userInfo`, {
      method: 'GET',
      headers: { Authorization: authz, Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!upstream.ok) return null;

    const text = await upstream.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }

    const identity = extractIdentity(json);
    if (!identity) return null;

    userInfoCache.set(authz, {
      userOneId: identity.userOneId,
      isAdmin: identity.isAdmin,
      expiresAt: Date.now() + USER_INFO_CACHE_TTL_MS,
    });
    return identity;
  } catch {
    return null;
  }
}

function normalizeRequestHeaders(req: NextRequest): Headers {
  const h = new Headers(req.headers);

  // Remove hop-by-hop headers.
  for (const k of HOP_BY_HOP_HEADERS) h.delete(k);
  h.delete('host');

  // Never trust caller-provided identity headers.
  h.delete('x-user-one-id');
  h.delete('x-is-admin');
  h.delete('useroneid');
  h.delete('isadmin');

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

  const headers = normalizeRequestHeaders(req);
  if (shouldResolveIdentity(apiPath)) {
    const authz = String(headers.get('authorization') || '').trim();
    if (authz) {
      const identity = await resolveIdentity(req, authz);
      if (identity?.userOneId) headers.set('x-user-one-id', identity.userOneId);
      headers.set('x-is-admin', identity?.isAdmin ? 'true' : 'false');
    }
  }

  try {
    const upstream = await fetch(url, {
      method,
      headers,
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

import http from 'node:http';
import { Readable } from 'node:stream';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvLocal() {
  const p = resolve(process.cwd(), '.env.local');
  if (!existsSync(p)) return;
  const raw = readFileSync(p, 'utf8');
  for (const line of raw.split('\n')) {
    const s = line.trim();
    if (!s || s.startsWith('#')) continue;
    const idx = s.indexOf('=');
    if (idx <= 0) continue;
    const k = s.slice(0, idx).trim();
    let v = s.slice(idx + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!(k in process.env)) process.env[k] = v;
  }
}

loadEnvLocal();

const PORT = Number(process.env.PORT || 8787);
const AUTH_BASE_URL = String(process.env.AUTH_BASE_URL || 'https://api-dev.chekkk.com').replace(/\/+$/, '');
const CONTENT_BASE_URL = String(process.env.CONTENT_BASE_URL || 'http://localhost:8081').replace(/\/+$/, '');
const MEDIA_BASE_URL = String(process.env.MEDIA_BASE_URL || 'http://localhost:8083').replace(/\/+$/, '');
const AI_BASE_URL = String(process.env.AI_BASE_URL || 'http://localhost:8082').replace(/\/+$/, '');

const DEV_USER_ONE_ID = String(process.env.CHEK_DEV_USER_ONE_ID || '').trim();
const DEV_IS_ADMIN = String(process.env.CHEK_DEV_IS_ADMIN || '').trim() === '1';

function pickTarget(pathname) {
  const p = pathname || '/';
  if (p === '/api/chek-content' || p.startsWith('/api/chek-content/')) {
    return { base: CONTENT_BASE_URL, strip: '/api/chek-content', kind: 'content' };
  }
  if (p === '/api/chek-media' || p.startsWith('/api/chek-media/')) {
    return { base: MEDIA_BASE_URL, strip: '/api/chek-media', kind: 'media' };
  }
  if (p === '/api/chek-ai' || p.startsWith('/api/chek-ai/')) {
    return { base: AI_BASE_URL, strip: '/api/chek-ai', kind: 'ai' };
  }
  if (p === '/api/auth' || p.startsWith('/api/auth/')) {
    return { base: AUTH_BASE_URL, strip: '', kind: 'auth' };
  }
  return null;
}

function normalizeHeaders(inHeaders) {
  const h = {};
  for (const [k, v] of Object.entries(inHeaders || {})) {
    if (v == null) continue;
    const key = String(k).toLowerCase();
    if (
      key === 'host' ||
      key === 'connection' ||
      key === 'transfer-encoding' ||
      key === 'upgrade' ||
      key === 'proxy-connection' ||
      key === 'keep-alive'
    ) {
      continue;
    }
    h[key] = v;
  }
  return h;
}

function extractUserOneId(payload) {
  if (!payload || typeof payload !== 'object') return '';
  // auth-saas may be envelope or raw
  const data = payload.success === true && payload.data ? payload.data : payload;
  const candidates = [
    data.userOneId,
    data.user_one_id,
    data.userId,
    data.user_id,
    data.accountId,
    data.account_id,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim();
    if (typeof c === 'number' && Number.isFinite(c)) return String(c);
  }
  return '';
}

const tokenCache = new Map(); // token -> { userOneId, expiresAt }
const CACHE_TTL_MS = 10 * 60 * 1000;

async function resolveUserOneId(authz) {
  const token = String(authz || '').trim();
  if (!token) return '';

  const cached = tokenCache.get(token);
  if (cached && cached.expiresAt > Date.now() && cached.userOneId) return cached.userOneId;

  try {
    const r = await fetch(`${AUTH_BASE_URL}/api/auth/v1/userInfo`, {
      method: 'GET',
      headers: { Authorization: token },
    });
    if (!r.ok) return '';
    const json = await r.json();
    const userOneId = extractUserOneId(json);
    if (userOneId) tokenCache.set(token, { userOneId, expiresAt: Date.now() + CACHE_TTL_MS });
    return userOneId;
  } catch {
    return '';
  }
}

function stripPrefix(urlPath, prefix) {
  if (!prefix) return urlPath || '/';
  if (!urlPath) return '/';
  if (urlPath === prefix) return '/';
  if (urlPath.startsWith(prefix + '/')) return urlPath.slice(prefix.length) || '/';
  return urlPath;
}

const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const target = pickTarget(u.pathname);
    if (!target) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('not found');
      return;
    }

    const outHeaders = normalizeHeaders(req.headers);

    if (target.kind !== 'auth') {
      const existingUserOneId = String(req.headers['x-user-one-id'] || '').trim();
      const authz = String(req.headers.authorization || '').trim();
      const userOneId =
        existingUserOneId ||
        (authz ? await resolveUserOneId(authz) : '') ||
        (DEV_USER_ONE_ID || '');

      if (userOneId) outHeaders['x-user-one-id'] = userOneId;
      if (DEV_IS_ADMIN) outHeaders['x-is-admin'] = 'true';
    }

    const path = stripPrefix(u.pathname, target.strip) + u.search;
    const destUrl = `${target.base}${path}`;

    const method = String(req.method || 'GET').toUpperCase();
    const hasBody = !(method === 'GET' || method === 'HEAD');

    const fr = await fetch(destUrl, {
      method,
      headers: outHeaders,
      body: hasBody ? req : undefined,
      redirect: 'manual',
      duplex: hasBody ? 'half' : undefined,
    });

    res.statusCode = fr.status;
    for (const [k, v] of fr.headers.entries()) {
      const key = k.toLowerCase();
      if (key === 'connection' || key === 'transfer-encoding') continue;
      res.setHeader(k, v);
    }

    if (fr.body) {
      Readable.fromWeb(fr.body).pipe(res);
    } else {
      res.end();
    }
  } catch (e) {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('bad gateway');
  }
});

server.listen(PORT, () => {
  // Keep logs minimal; never print Authorization/token.
  console.log(`[chek-dev-gateway] listening on http://localhost:${PORT}`);
  console.log(`[chek-dev-gateway] auth=${AUTH_BASE_URL}`);
  console.log(`[chek-dev-gateway] content=${CONTENT_BASE_URL}`);
  console.log(`[chek-dev-gateway] media=${MEDIA_BASE_URL}`);
  console.log(`[chek-dev-gateway] ai=${AI_BASE_URL}`);
});


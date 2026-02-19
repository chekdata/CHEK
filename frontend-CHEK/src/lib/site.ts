function originFromRequest(request: Request): string {
  try {
    const url = new URL(request.url);
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || url.host;
    const proto =
      request.headers.get('x-forwarded-proto') || url.protocol.replace(/:$/, '') || 'https';
    if (host) return `${proto}://${host}`.replace(/\/+$/, '');
    return url.origin.replace(/\/+$/, '');
  } catch {
    return '';
  }
}

function normalizeBasePath(raw: string | null | undefined): string {
  const s = String(raw || '').trim();
  if (!s || s === '/') return '';
  const noTrail = s.replace(/\/+$/, '');
  if (!noTrail || noTrail === '/') return '';
  return noTrail.startsWith('/') ? noTrail : `/${noTrail}`;
}

export function getSiteBasePath(): string {
  return normalizeBasePath(process.env.CHEK_BASE_PATH || process.env.NEXT_PUBLIC_CHEK_BASE_PATH);
}

function normalizeSiteUrl(raw: string): string {
  const s = String(raw || '').trim().replace(/\/+$/, '');
  if (!s) return '';

  try {
    return new URL(s).toString().replace(/\/+$/, '');
  } catch {}

  try {
    return new URL(`https://${s}`).toString().replace(/\/+$/, '');
  } catch {}

  return s;
}

function appendBasePathIfNeeded(site: string, basePath: string): string {
  const s = String(site || '').replace(/\/+$/, '');
  if (!basePath) return s;

  try {
    const u = new URL(s);
    // If env site URL already includes a pathname (non-root), trust it.
    if (u.pathname && u.pathname !== '/' && u.pathname !== basePath && !u.pathname.startsWith(basePath + '/')) {
      return s;
    }
  } catch {
    // If we can't parse it, best-effort append below.
  }

  if (s.endsWith(basePath)) return s;
  return `${s}${basePath}`;
}

export function getSiteUrl(request?: Request): string {
  const basePath = getSiteBasePath();

  const raw = process.env.CHEK_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (raw && String(raw).trim()) {
    const normalized = normalizeSiteUrl(String(raw));
    if (normalized) return appendBasePathIfNeeded(normalized, basePath);
  }

  if (request) {
    const guessed = originFromRequest(request);
    if (guessed) return appendBasePathIfNeeded(guessed, basePath);
  }

  return appendBasePathIfNeeded('http://localhost:3000', basePath);
}

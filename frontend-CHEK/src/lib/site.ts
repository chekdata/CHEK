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

export function getSiteUrl(request?: Request): string {
  const raw = process.env.CHEK_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (raw && String(raw).trim()) return String(raw).replace(/\/+$/, '');

  if (request) {
    const guessed = originFromRequest(request);
    if (guessed) return guessed;
  }

  return 'http://localhost:3000';
}

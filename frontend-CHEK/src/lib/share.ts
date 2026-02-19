'use client';

export function withBasePath(path: string): string {
  const raw = String(process.env.NEXT_PUBLIC_CHEK_BASE_PATH || '').trim();
  const base = raw && raw !== '/' ? raw.replace(/\/+$/, '') : '';
  if (!base) return path;

  if (!path.startsWith('/')) return `${base}/${path}`;
  if (path === base) return path;
  if (path.startsWith(base + '/')) return path;
  return `${base}${path}`;
}

export function absoluteUrl(path: string): string {
  if (typeof window === 'undefined') return withBasePath(path);
  return `${window.location.origin}${withBasePath(path)}`;
}

export async function shareLink(opts: {
  url: string;
  title?: string;
  text?: string;
}): Promise<'native' | 'copied' | 'opened'> {
  const url = opts.url;
  const title = opts.title || '';
  const text = opts.text || '';

  if (typeof navigator !== 'undefined' && 'share' in navigator) {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await navigator.share({ url, title, text });
      return 'native';
    } catch {
      // fallthrough
    }
  }

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return 'copied';
    }
  } catch {
    // fallthrough
  }

  if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener,noreferrer');
  return 'opened';
}


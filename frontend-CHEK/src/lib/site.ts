export function getSiteUrl(): string {
  const raw =
    process.env.CHEK_SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3000';
  return String(raw).replace(/\/+$/, '');
}


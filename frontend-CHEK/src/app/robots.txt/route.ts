import { getSiteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const site = getSiteUrl(request);
  const body = `User-agent: *\nAllow: /\nSitemap: ${site}/sitemap.xml\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

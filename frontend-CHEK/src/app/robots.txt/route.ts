import { getSiteUrl } from '@/lib/site';

export async function GET() {
  const site = getSiteUrl();
  const body = `User-agent: *\nAllow: /\nSitemap: ${site}/sitemap.xml\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}


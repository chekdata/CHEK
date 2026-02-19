import type { Metadata } from 'next';
import { getSiteBasePath, getSiteUrl } from '@/lib/site';

export const SITE_NAME = '潮客 CHEK';
export const DEFAULT_DESCRIPTION = '有知（百科）+ 相辅（帖子与评论）。欢迎你来潮汕，路上辛苦了。';

function normalizePath(path: string): string {
  const raw = String(path || '').trim();
  if (!raw) return '/';
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  if (!raw.startsWith('/')) return `/${raw}`;
  return raw;
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  const basePath = getSiteBasePath();

  const p = normalizePath(path);
  if (p.startsWith('http://') || p.startsWith('https://')) return p;

  const withoutBasePath =
    basePath && (p === basePath || p.startsWith(basePath + '/')) ? p.slice(basePath.length) || '/' : p;

  if (withoutBasePath === '/' || withoutBasePath === '') return base;
  return `${base}${withoutBasePath}`;
}

export function safeMetadataBase(): URL {
  try {
    return new URL(getSiteUrl());
  } catch {
    return new URL('http://localhost:3000');
  }
}

export function stripMarkdownToText(input: string): string {
  let s = String(input || '');

  // Remove fenced code blocks.
  s = s.replace(/```[\s\S]*?```/g, ' ');
  // Remove inline code.
  s = s.replace(/`([^`]*)`/g, '$1');
  // Replace images and links with their text.
  s = s.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');
  s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  // Remove headings and blockquotes markers.
  s = s.replace(/^\s{0,3}#{1,6}\s+/gm, '');
  s = s.replace(/^\s{0,3}>\s?/gm, '');
  // Remove emphasis markers.
  s = s.replace(/(\*\*|__)(.*?)\1/g, '$2');
  s = s.replace(/(\*|_)(.*?)\1/g, '$2');
  // Strip HTML tags.
  s = s.replace(/<[^>]+>/g, ' ');
  // Normalize whitespace.
  s = s.replace(/\s+/g, ' ').trim();

  return s;
}

export function makeDescription(input: string, maxLen = 160): string {
  const raw = stripMarkdownToText(input);
  if (!raw) return DEFAULT_DESCRIPTION;
  if (raw.length <= maxLen) return raw;
  return `${raw.slice(0, maxLen - 1).trim()}…`;
}

export function makePageMetadata(args: {
  title: string;
  description?: string;
  path: string;
  ogType?: 'website' | 'article';
  noindex?: boolean;
  keywords?: string[];
  publishedTime?: string;
  modifiedTime?: string;
}): Metadata {
  const title = String(args.title || '').trim() || SITE_NAME;
  const description = String(args.description || '').trim() || DEFAULT_DESCRIPTION;
  const canonical = absoluteUrl(args.path);
  const ogType = args.ogType || 'website';
  const ogImage = absoluteUrl('/og.png');

  const robots = args.noindex
    ? {
        index: false,
        follow: true,
        googleBot: { index: false, follow: true },
      }
    : {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true },
      };

  return {
    title,
    description,
    keywords: args.keywords,
    alternates: { canonical },
    robots,
    openGraph: {
      type: ogType,
      locale: 'zh_CN',
      siteName: SITE_NAME,
      title,
      description,
      url: canonical,
      images: [{ url: ogImage, alt: SITE_NAME }],
      ...(ogType === 'article'
        ? {
            article: {
              publishedTime: args.publishedTime,
              modifiedTime: args.modifiedTime,
              tags: args.keywords,
            },
          }
        : null),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}


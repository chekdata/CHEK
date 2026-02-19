import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { WikiEntryDTO } from '@/lib/api-types';
import { serverGet } from '@/lib/server-api';
import { makePageMetadata } from '@/lib/seo';
import { WikiEditorForm } from '@/components/WikiEditorForm';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug || '');
  return makePageMetadata({
    title: '编辑有知 - CHEK',
    description: '有知众包编辑：一起把潮汕信息讲清楚。',
    path: `/wiki/${encodeURIComponent(slug)}/edit`,
    ogType: 'website',
    noindex: true,
  });
}

export default async function WikiEditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug || '');
  const entry = await serverGet<WikiEntryDTO>(`/api/chek-content/v1/wiki/entries/bySlug/${encodeURIComponent(slug)}`, {
    revalidateSeconds: 0,
  });
  if (!entry) notFound();
  if (!entry.isPublic) notFound();

  return (
    <WikiEditorForm
      mode="edit"
      sourceSlug={entry.slug}
      initial={{
        entryId: entry.entryId,
        slug: entry.slug,
        title: entry.title,
        summary: entry.summary || '',
        body: entry.body || '',
        tags: entry.tags || [],
      }}
    />
  );
}

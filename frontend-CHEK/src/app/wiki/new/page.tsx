import type { Metadata } from 'next';
import { makePageMetadata } from '@/lib/seo';
import { WikiEditorForm } from '@/components/WikiEditorForm';

export const metadata: Metadata = makePageMetadata({
  title: '创建有知 - CHEK',
  description: '有知众包创建：一起把潮汕信息讲清楚。',
  path: '/wiki/new',
  ogType: 'website',
  noindex: true,
});

export default function WikiCreatePage() {
  return <WikiEditorForm mode="create" />;
}

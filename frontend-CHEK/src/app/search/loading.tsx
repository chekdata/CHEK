import { PageLoading } from '@/components/PageLoading';

export default function SearchLoading() {
  return <PageLoading title="搜索中" hint="正在整理匹配结果，请稍等。" rows={2} />;
}

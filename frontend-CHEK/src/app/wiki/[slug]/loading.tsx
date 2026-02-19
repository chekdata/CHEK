import { PageLoading } from '@/components/PageLoading';

export default function WikiDetailLoading() {
  return <PageLoading title="有知词条加载中" hint="词条正文和关联相辅正在读取。" rows={3} />;
}

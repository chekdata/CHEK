import { PageLoading } from '@/components/PageLoading';

export default function PostDetailLoading() {
  return <PageLoading title="相辅详情加载中" hint="帖子和评论正在同步，请稍等一下。" rows={3} />;
}

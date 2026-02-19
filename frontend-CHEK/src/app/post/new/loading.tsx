import { PageLoading } from '@/components/PageLoading';

export default function NewPostLoading() {
  return <PageLoading title="发相辅准备中" hint="上传与表单组件正在加载，请稍等。" rows={2} />;
}

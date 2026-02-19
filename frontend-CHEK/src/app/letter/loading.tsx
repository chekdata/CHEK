import { PageLoading } from '@/components/PageLoading';

export default function LetterLoading() {
  return <PageLoading title="信件加载中" hint="正在把这封信准备好，请稍等一下。" rows={1} />;
}

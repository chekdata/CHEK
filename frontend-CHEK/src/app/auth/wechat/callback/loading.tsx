import { PageLoading } from '@/components/PageLoading';

export default function WechatCallbackLoading() {
  return <PageLoading title="微信登录处理中" hint="正在校验登录态并同步资料。" rows={1} />;
}

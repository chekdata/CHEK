import { Suspense } from 'react';
import type { Metadata } from 'next';
import WeChatCallbackClient from './WeChatCallbackClient';
import { makePageMetadata } from '@/lib/seo';
import { PageLoading } from '@/components/PageLoading';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = makePageMetadata({
  title: '微信登录回调 - CHEK',
  description: '正在处理微信登录回调。',
  path: '/auth/wechat/callback',
  ogType: 'website',
  noindex: true,
  keywords: ['微信登录', 'CHEK'],
});

export default function WeChatCallbackPage() {
  const wechatAppId = String(process.env.CHEK_WECHAT_APP_ID || process.env.NEXT_PUBLIC_WECHAT_APP_ID || '').trim();
  const wechatScope = String(process.env.CHEK_WECHAT_SCOPE || process.env.NEXT_PUBLIC_WECHAT_SCOPE || '').trim() || 'snsapi_userinfo';
  const authClientId = String(process.env.CHEK_AUTH_CLIENT_ID || process.env.NEXT_PUBLIC_AUTH_CLIENT_ID || '').trim() || 'app';
  const wechatPackageName =
    String(process.env.CHEK_WECHAT_PACKAGE_NAME || process.env.NEXT_PUBLIC_WECHAT_PACKAGE_NAME || '').trim() ||
    'com.chek.app';

  return (
    <Suspense
      fallback={<PageLoading title="微信登录处理中" hint="正在校验授权状态并准备跳转。" rows={1} />}
    >
      <WeChatCallbackClient
        wechatAppId={wechatAppId}
        wechatScope={wechatScope}
        authClientId={authClientId}
        wechatPackageName={wechatPackageName}
      />
    </Suspense>
  );
}

import { Suspense } from 'react';
import type { Metadata } from 'next';
import LoginClient from './LoginClient';
import { makePageMetadata } from '@/lib/seo';
import { PageLoading } from '@/components/PageLoading';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = makePageMetadata({
  title: '登录 - CHEK',
  description: '登录后发相辅、评论，更方便。',
  path: '/auth/login',
  ogType: 'website',
  noindex: true,
  keywords: ['登录', 'CHEK'],
});

export default function LoginPage() {
  const wechatMpAppId = String(process.env.CHEK_WECHAT_MP_APP_ID || process.env.NEXT_PUBLIC_WECHAT_MP_APP_ID || '').trim();
  const wechatOpenAppId = String(process.env.CHEK_WECHAT_OPEN_APP_ID || process.env.NEXT_PUBLIC_WECHAT_OPEN_APP_ID || '').trim();
  const wechatScope = String(process.env.CHEK_WECHAT_SCOPE || process.env.NEXT_PUBLIC_WECHAT_SCOPE || '').trim() || 'snsapi_userinfo';
  const authClientId = String(process.env.CHEK_AUTH_CLIENT_ID || process.env.NEXT_PUBLIC_AUTH_CLIENT_ID || '').trim() || 'app';
  const wechatOauthRedirectOrigin = String(
    process.env.CHEK_WECHAT_OAUTH_REDIRECT_ORIGIN ||
      process.env.NEXT_PUBLIC_WECHAT_OAUTH_REDIRECT_ORIGIN ||
      'https://app.chekkk.com',
  )
    .trim()
    .replace(/\/+$/, '');

  return (
    <Suspense
      fallback={<PageLoading title="登录页加载中" hint="登录表单正在准备，请稍等一下。" rows={1} />}
    >
      <LoginClient
        wechatMpAppId={wechatMpAppId}
        wechatOpenAppId={wechatOpenAppId}
        wechatScope={wechatScope}
        authClientId={authClientId}
        wechatOauthRedirectOrigin={wechatOauthRedirectOrigin}
      />
    </Suspense>
  );
}

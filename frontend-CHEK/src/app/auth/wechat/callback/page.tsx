import { Suspense } from 'react';
import type { Metadata } from 'next';
import WeChatCallbackClient from './WeChatCallbackClient';
import { makePageMetadata } from '@/lib/seo';

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
      fallback={
        <div className="chek-shell" style={{ paddingBottom: 24 }}>
          <main className="chek-section">
            <div className="chek-card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 900, marginBottom: 8 }}>加载中…</div>
              <div className="chek-muted">给你添麻烦了，稍等一下。</div>
            </div>
          </main>
        </div>
      }
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

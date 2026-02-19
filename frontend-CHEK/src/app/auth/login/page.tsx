import { Suspense } from 'react';
import type { Metadata } from 'next';
import LoginClient from './LoginClient';
import { makePageMetadata } from '@/lib/seo';

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
  const wechatAppId = String(process.env.CHEK_WECHAT_APP_ID || process.env.NEXT_PUBLIC_WECHAT_APP_ID || '').trim();
  const wechatScope = String(process.env.CHEK_WECHAT_SCOPE || process.env.NEXT_PUBLIC_WECHAT_SCOPE || '').trim() || 'snsapi_userinfo';
  const authClientId = String(process.env.CHEK_AUTH_CLIENT_ID || process.env.NEXT_PUBLIC_AUTH_CLIENT_ID || '').trim() || 'app';

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
      <LoginClient wechatAppId={wechatAppId} wechatScope={wechatScope} authClientId={authClientId} />
    </Suspense>
  );
}

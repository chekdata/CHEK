import { Suspense } from 'react';
import WeChatCallbackClient from './WeChatCallbackClient';

export const dynamic = 'force-dynamic';

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

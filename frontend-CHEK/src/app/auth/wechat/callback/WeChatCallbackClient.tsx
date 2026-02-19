'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { clientFetch } from '@/lib/client-api';
import { setToken } from '@/lib/token';
import { markWelcomePendingIfFirstLogin } from '@/lib/welcome';
import { consumeWechatOauthAttempt, sanitizeNext, storeWechatOauthAttempt, withPublicBasePath, buildWechatOAuthUrl } from '@/lib/wechat-oauth';

type WechatLoginDTO = {
  accessToken?: string;
  mobilePhone?: string;
};

function getAuthClientId(): string {
  return String(process.env.NEXT_PUBLIC_AUTH_CLIENT_ID || '').trim() || 'app';
}

function getWechatAppId(): string {
  return String(process.env.NEXT_PUBLIC_WECHAT_APP_ID || '').trim();
}

export default function WeChatCallbackClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const code = useMemo(() => String(sp.get('code') || '').trim(), [sp]);
  const state = useMemo(() => sp.get('state'), [sp]);

  const [status, setStatus] = useState<'loading' | 'error' | 'ok'>('loading');
  const [msg, setMsg] = useState<string>('正在登录…');

  useEffect(() => {
    let canceled = false;

    async function run() {
      const attempt = consumeWechatOauthAttempt(state);
      const next = sanitizeNext(attempt.next);
      if (!code) {
        setStatus('error');
        setMsg('缺少 code：微信授权回调不完整。');
        return;
      }
      if (!attempt.ok) {
        setStatus('error');
        setMsg('登录状态校验失败：请回到登录页重新点一次“微信登录”。');
        return;
      }

      try {
        const dto = await clientFetch<WechatLoginDTO>('/api/auth/v1/wechat/login', {
          method: 'POST',
          body: JSON.stringify({
            code,
            clientId: getAuthClientId(),
            scene: 'chek_h5',
          }),
        });

        const token = String((dto as any)?.accessToken || (dto as any)?.AccessToken || (dto as any)?.token || '').trim();
        const mobilePhone = String((dto as any)?.mobilePhone || (dto as any)?.phone || '').trim();
        if (!token) throw new Error('登录成功但缺少 accessToken');

        setToken(token);
        markWelcomePendingIfFirstLogin();

        if (canceled) return;
        setStatus('ok');
        setMsg('登录成功，正在跳转…');

        if (!mobilePhone) {
          router.replace(`/auth/bind-phone?next=${encodeURIComponent(next)}`);
          return;
        }

        router.replace(next);
      } catch (e: any) {
        if (canceled) return;
        setStatus('error');
        setMsg(e?.message || '微信登录失败了，真诚抱歉。你可以再试一次。');
      }
    }

    run();
    return () => {
      canceled = true;
    };
  }, [code, router, state]);

  function retryWechatLogin() {
    const appId = getWechatAppId();
    if (!appId) {
      setMsg('未配置微信 AppID：请先在环境变量里设置 NEXT_PUBLIC_WECHAT_APP_ID。');
      return;
    }
    const next = sanitizeNext(sp.get('next') || '/feed');
    const s = storeWechatOauthAttempt(next);
    const redirectUri = `${window.location.origin}${withPublicBasePath('/auth/wechat/callback')}`;
    const url = buildWechatOAuthUrl({ appId, redirectUri, state: s });
    window.location.href = url;
  }

  return (
    <div className="chek-shell" style={{ paddingBottom: 24 }}>
      <header className="chek-header">
        <div className="chek-title-row">
          <h1 className="chek-title">微信登录</h1>
          <Link href="/auth/login" className="chek-chip gray">
            返回
          </Link>
        </div>
      </header>

      <main className="chek-section" style={{ display: 'grid', gap: 12 }}>
        <div className="chek-card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>
            {status === 'loading' ? '登录中…' : status === 'ok' ? '已登录' : '登录失败'}
          </div>
          <div className="chek-muted" style={{ lineHeight: 1.7 }}>
            {msg}
          </div>
        </div>

        {status === 'error' ? (
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="chek-chip"
              style={{ border: 'none', cursor: 'pointer' }}
              onClick={retryWechatLogin}
            >
              再试一次
            </button>
            <Link href="/auth/login" className="chek-chip gray">
              改用手机号登录
            </Link>
          </div>
        ) : null}
      </main>
    </div>
  );
}


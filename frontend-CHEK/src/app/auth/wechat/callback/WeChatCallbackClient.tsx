'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { clientFetch } from '@/lib/client-api';
import { setToken } from '@/lib/token';
import { saveCurrentUserProfile } from '@/lib/user-display';
import { markWelcomePendingIfFirstLogin } from '@/lib/welcome';
import { SkeletonBlock, SkeletonLines } from '@/components/Skeleton';
import {
  buildWechatOAuthUrl,
  consumeWechatOauthAttempt,
  sanitizeNext,
  storeWechatOauthAttempt,
  withPublicBasePath,
} from '@/lib/wechat-oauth';

type WechatLoginDTO = {
  accessToken?: string;
  mobilePhone?: string;
};

type WeChatCallbackClientProps = {
  wechatMpAppId?: string;
  wechatOpenAppId?: string;
  wechatScope?: string;
  authClientId?: string;
  wechatOauthRedirectOrigin?: string;
};

export default function WeChatCallbackClient(props: WeChatCallbackClientProps) {
  const router = useRouter();
  const sp = useSearchParams();

  const code = useMemo(() => String(sp.get('code') || '').trim(), [sp]);
  const state = useMemo(() => sp.get('state'), [sp]);
  const wxRet = useMemo(() => String(sp.get('wx_ret') || '').trim(), [sp]);

  const [status, setStatus] = useState<'loading' | 'error' | 'ok'>('loading');
  const [msg, setMsg] = useState<string>('正在登录…');

  useEffect(() => {
    let canceled = false;

    async function run() {
      // 如果回调落在“统一回调域”（例如 app.chekkk.com），sessionStorage 里没有发起端写入的 state/next
      // 这时用 wx_ret 把 code/state 转发回发起域的 /auth/wechat/callback 再消费
      try {
        if (wxRet && code) {
          let raw = String(wxRet || '').trim();
          if (/^https?%3A/i.test(raw)) {
            try { raw = decodeURIComponent(raw); } catch {}
          }
          const retUrl = new URL(raw);
          if (retUrl.origin && typeof window !== 'undefined' && retUrl.origin !== window.location.origin) {
            const host = String(retUrl.hostname || '').toLowerCase();
            const allowed =
              host === 'localhost' ||
              host === '127.0.0.1' ||
              host === 'chekkk.com' ||
              host.endsWith('.chekkk.com');
            if (allowed) {
              const forward = new URL(`${retUrl.origin}${withPublicBasePath('/auth/wechat/callback')}`);
              forward.searchParams.set('code', code);
              if (state) forward.searchParams.set('state', String(state));
              window.location.replace(forward.toString());
              return;
            }
          }
        }
      } catch {}

      const attempt = consumeWechatOauthAttempt(state);
      const next = sanitizeNext(attempt.next);
      const fallbackChannel = /MicroMessenger/i.test(String(window.navigator?.userAgent || '')) ? 'mp' : 'open';
      const channel = attempt.channel || fallbackChannel;
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
        const clientId = String(props.authClientId || '').trim() || 'app';
        const dto = await clientFetch<WechatLoginDTO>('/api/auth/v1/wechat/login', {
          method: 'POST',
          body: JSON.stringify({
            code,
            clientId,
            channel,
          }),
        });

        const token = String((dto as any)?.accessToken || (dto as any)?.AccessToken || (dto as any)?.token || '').trim();
        const mobilePhone = String((dto as any)?.mobilePhone || (dto as any)?.phone || '').trim();
        if (!token) throw new Error('登录成功但缺少 accessToken');

        setToken(token);
        saveCurrentUserProfile({
          userOneId: String((dto as any)?.userOneId || '').trim(),
          nickName: String((dto as any)?.nickName || (dto as any)?.nickname || '').trim(),
          userName: String((dto as any)?.userName || '').trim(),
          avatarUrl: String((dto as any)?.avatarUrl || '').trim(),
        });
        markWelcomePendingIfFirstLogin();

        if (canceled) return;
        setStatus('ok');
        setMsg('登录成功，正在跳转…');

        if (!mobilePhone) {
          router.replace(`/auth/bind-phone?next=${encodeURIComponent(next)}`);
          return;
        }

        // 优先回到登录前完整 URL（同域校验已在存储时做过）
        try {
          const retUrl = String((attempt as any).retUrl || '').trim();
          if (retUrl) {
            window.location.replace(retUrl);
            return;
          }
        } catch {}

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
  }, [code, router, state, wxRet, props.authClientId]);

  function retryWechatLogin() {
    const isWx = /MicroMessenger/i.test(String(window.navigator?.userAgent || ''));
    const appId = isWx ? String(props.wechatMpAppId || '').trim() : String(props.wechatOpenAppId || '').trim();
    if (!appId) {
      setMsg(
        isWx
          ? '未配置公众号 AppID：请先配置 CHEK_WECHAT_MP_APP_ID（或 NEXT_PUBLIC_WECHAT_MP_APP_ID）。'
          : '未配置开放平台网站应用 AppID：请先配置 CHEK_WECHAT_OPEN_APP_ID（或 NEXT_PUBLIC_WECHAT_OPEN_APP_ID）。'
      );
      return;
    }
    const next = sanitizeNext('/feed');
    const retUrl = (() => {
      try {
        return String(window.location.href || '');
      } catch {
        return '';
      }
    })();
    const s = storeWechatOauthAttempt(next, isWx ? 'mp' : 'open', retUrl);
    const callbackOrigin = String(
      props.wechatOauthRedirectOrigin ||
        process.env.NEXT_PUBLIC_WECHAT_OAUTH_REDIRECT_ORIGIN ||
        'https://app.chekkk.com',
    )
      .trim()
      .replace(/\/+$/, '');
    const base = `${callbackOrigin}${withPublicBasePath('/auth/wechat/callback')}`;
    const u = new URL(base);
    if (retUrl) u.searchParams.set('wx_ret', retUrl);
    const redirectUri = u.toString();
    const url = buildWechatOAuthUrl({ appId, redirectUri, state: s, scopeInWechat: props.wechatScope });
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
          {status === 'loading' ? (
            <div style={{ display: 'grid', gap: 10 }}>
              <SkeletonBlock width="38%" height={18} radius={10} />
              <SkeletonLines lines={2} widths={['86%', '62%']} lineHeight={12} />
            </div>
          ) : (
            <>
              <div style={{ fontWeight: 900, marginBottom: 8 }}>{status === 'ok' ? '已登录' : '登录失败'}</div>
              <div className="chek-muted" style={{ lineHeight: 1.7 }}>
                {msg}
              </div>
            </>
          )}
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

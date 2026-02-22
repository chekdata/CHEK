'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { clientFetch } from '@/lib/client-api';
import { setToken } from '@/lib/token';
import { saveCurrentUserProfile } from '@/lib/user-display';
import { markWelcomePendingIfFirstLogin } from '@/lib/welcome';
import {
  buildWechatOAuthUrl,
  isWeChatBrowser,
  sanitizeNext,
  storeWechatOauthAttempt,
  withPublicBasePath,
} from '@/lib/wechat-oauth';

type LoginClientProps = {
  wechatMpAppId?: string;
  wechatOpenAppId?: string;
  wechatScope?: string;
  authClientId?: string;
  wechatOauthRedirectOrigin?: string;
};

export default function LoginClient(props: LoginClientProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const next = useMemo(() => sp.get('next') || '/feed', [sp]);

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function wechatLogin() {
    const channel = isWeChatBrowser() ? 'mp' : 'open';
    const appId = isWeChatBrowser()
      ? String(props.wechatMpAppId || '').trim()
      : String(props.wechatOpenAppId || '').trim();
    if (!appId) {
      setMsg(
        isWeChatBrowser()
          ? '暂未配置公众号 AppID：请先配置 CHEK_WECHAT_MP_APP_ID（或 NEXT_PUBLIC_WECHAT_MP_APP_ID）。'
          : '暂未配置开放平台网站应用 AppID：请先配置 CHEK_WECHAT_OPEN_APP_ID（或 NEXT_PUBLIC_WECHAT_OPEN_APP_ID）。'
      );
      return;
    }
    const retUrl = (() => {
      try {
        return String(window.location.href || '');
      } catch {
        return '';
      }
    })();
    const s = storeWechatOauthAttempt(sanitizeNext(next), channel, retUrl);

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
    const url = buildWechatOAuthUrl({
      appId,
      redirectUri,
      state: s,
      scopeInWechat: props.wechatScope,
    });
    window.location.href = url;
  }

  async function sendSms() {
    const p = phone.trim();
    if (!p) return setMsg('请先填手机号');
    setMsg(null);
    setSending(true);
    try {
      await clientFetch('/api/auth/v1/sms/send', {
        method: 'POST',
        body: JSON.stringify({ mobilePhone: p, scene: 'login' }),
      });
      setMsg('验证码已发送，麻烦你看下短信。');
    } catch (e: any) {
      setMsg(e?.message || '发送失败了，给你添麻烦了，先抱歉。');
    } finally {
      setSending(false);
    }
  }

  async function smsLogin() {
    const p = phone.trim();
    const c = code.trim();
    if (!p || !c) return setMsg('手机号和验证码都要填');
    setMsg(null);
    setLoggingIn(true);
    try {
      const clientId = String(props.authClientId || '').trim() || 'app';
      const dto = await clientFetch<any>('/api/auth/v1/accounts/smsLogin', {
        method: 'POST',
        body: JSON.stringify({ mobilePhone: p, code: c, clientId }),
      });
      const token = dto?.accessToken || dto?.AccessToken || dto?.token || '';
      if (!token) throw new Error('登录返回缺少 accessToken');
      setToken(String(token));
      saveCurrentUserProfile({
        userOneId: String(dto?.userOneId || '').trim(),
        nickName: String(dto?.nickName || dto?.nickname || '').trim(),
        userName: String(dto?.userName || '').trim(),
        avatarUrl: String(dto?.avatarUrl || '').trim(),
      });
      markWelcomePendingIfFirstLogin();
      router.replace(next);
    } catch (e: any) {
      setMsg(e?.message || '登录失败了，真诚抱歉。你可以再试一次。');
    } finally {
      setLoggingIn(false);
    }
  }

  return (
    <div className="chek-shell" style={{ paddingBottom: 24 }}>
      <header className="chek-header">
        <div className="chek-title-row">
          <h1 className="chek-title">欢迎来潮汕</h1>
          <Link href="/feed" className="chek-chip gray">
            先随便逛逛
          </Link>
        </div>
      </header>

      <main className="chek-section" style={{ display: 'grid', gap: 12 }}>
        <div className="chek-card" style={{ padding: 16 }}>
          <div className="chek-muted" style={{ lineHeight: 1.7 }}>
            登录后可发相辅、评论、收藏。
            <br />
            来了就是胶己人；要是哪里没照顾到位，我们先说声抱歉。
          </div>
        </div>

        <div className="chek-card" style={{ padding: 16, display: 'grid', gap: 10 }}>
          <div style={{ fontWeight: 900 }}>微信登录（推荐）</div>
          <div className="chek-muted" style={{ lineHeight: 1.7 }}>
            {isWeChatBrowser()
              ? '在微信里打开可直接授权登录。'
              : '不在微信环境：会走微信开放平台扫码登录（更适合电脑端）。'}
          </div>
          <button
            className="chek-chip"
            style={{ border: 'none', cursor: 'pointer', justifyContent: 'center' }}
            onClick={wechatLogin}
          >
            微信登录
          </button>
        </div>

        <div className="chek-card" style={{ padding: 16, display: 'grid', gap: 10 }}>
          <div style={{ fontWeight: 900 }}>手机号验证码登录</div>

          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="手机号"
            inputMode="tel"
            style={{
              borderRadius: 14,
              border: '1px solid rgba(0,0,0,0.08)',
              padding: 12,
              outline: 'none',
              background: 'rgba(255,255,255,0.85)',
            }}
          />

          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="验证码"
              inputMode="numeric"
              style={{
                flex: 1,
                borderRadius: 14,
                border: '1px solid rgba(0,0,0,0.08)',
                padding: 12,
                outline: 'none',
                background: 'rgba(255,255,255,0.85)',
              }}
            />
            <button
              className="chek-chip gray"
              style={{ border: 'none', cursor: 'pointer', minWidth: 92 }}
              onClick={sendSms}
              disabled={sending}
            >
              {sending ? '发送中…' : '发验证码'}
            </button>
          </div>

          <button
            className="chek-chip"
            style={{ border: 'none', cursor: 'pointer', justifyContent: 'center' }}
            onClick={smsLogin}
            disabled={loggingIn}
          >
            {loggingIn ? '登录中…' : '登录'}
          </button>

          {msg ? (
            <div className="chek-muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
              {msg}
            </div>
          ) : null}
        </div>

        <div className="chek-card" style={{ padding: 16 }}>
          <div className="chek-muted" style={{ lineHeight: 1.7 }}>
            继续即表示你同意
            <Link href="/legal" style={{ color: 'var(--chek-primary)', fontWeight: 900, marginLeft: 6 }}>
              协议与免责声明
            </Link>
            。
          </div>
        </div>
      </main>
    </div>
  );
}

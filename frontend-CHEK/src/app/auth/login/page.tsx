'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { clientFetch } from '@/lib/client-api';
import { setToken } from '@/lib/token';

export default function LoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = useMemo(() => sp.get('next') || '/feed', [sp]);

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

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
      const dto = await clientFetch<any>('/api/auth/v1/accounts/smsLogin', {
        method: 'POST',
        body: JSON.stringify({ mobilePhone: p, code: c, clientId: 'app' }),
      });
      const token = dto?.accessToken || dto?.AccessToken || dto?.token || '';
      if (!token) throw new Error('登录返回缺少 accessToken');
      setToken(String(token));
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
          <div style={{ fontWeight: 900, marginBottom: 8 }}>微信一键登录（可选）</div>
          <div className="chek-muted" style={{ lineHeight: 1.7 }}>
            MVP 先打通手机号登录；微信登录后续接入 auth-saas 的 `/api/auth/v1/wechat/login`。
          </div>
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


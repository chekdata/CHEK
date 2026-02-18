'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { clientFetch } from '@/lib/client-api';
import { getToken } from '@/lib/token';

export default function BindPhonePage() {
  const router = useRouter();
  const token = getToken();

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function sendSms() {
    const p = phone.trim();
    if (!p) return setMsg('请先填手机号');
    setMsg(null);
    setSending(true);
    try {
      await clientFetch('/api/auth/v1/sms/send', {
        method: 'POST',
        body: JSON.stringify({ mobilePhone: p, scene: 'BIND_PHONE' }),
      });
      setMsg('验证码已发送。');
    } catch (e: any) {
      setMsg(e?.message || '发送失败了，真诚抱歉。');
    } finally {
      setSending(false);
    }
  }

  async function bind() {
    if (!token) {
      setMsg('未登录：绑定手机号需要先完成登录。');
      return;
    }
    const p = phone.trim();
    const c = code.trim();
    if (!p || !c) return setMsg('手机号和验证码都要填');
    setMsg(null);
    setSubmitting(true);
    try {
      await clientFetch('/api/auth/v1/user/wechat/bindPhone', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ mobilePhone: p, code: c, scene: 'BIND_PHONE' }),
      });
      router.replace('/me');
    } catch (e: any) {
      setMsg(e?.message || '绑定失败了，给你添麻烦了，先抱歉。');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="chek-shell" style={{ paddingBottom: 24 }}>
      <header className="chek-header">
        <div className="chek-title-row">
          <h1 className="chek-title">绑定手机号</h1>
          <Link href="/me" className="chek-chip gray">
            返回
          </Link>
        </div>
      </header>

      <main className="chek-section" style={{ display: 'grid', gap: 12 }}>
        <div className="chek-card" style={{ padding: 16 }}>
          <div className="chek-muted" style={{ lineHeight: 1.7 }}>
            这个页面主要给“微信登录后需要补全手机号”的场景使用。
            <br />
            现在 MVP 先用手机号验证码登录为主。给你添麻烦了，先抱歉。
          </div>
        </div>

        <div className="chek-card" style={{ padding: 16, display: 'grid', gap: 10 }}>
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
            onClick={bind}
            disabled={submitting}
          >
            {submitting ? '提交中…' : '提交'}
          </button>

          {msg ? (
            <div className="chek-muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
              {msg}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}


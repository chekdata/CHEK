'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { clientFetch } from '@/lib/client-api';
import { clearToken, getToken } from '@/lib/token';

type UserInfo = {
  userOneId?: string;
  nickName?: string;
  avatarUrl?: string;
  mobilePhone?: string;
};

export default function MePage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [token, setTokenState] = useState(() => getToken());

  useEffect(() => {
    let canceled = false;
    async function run() {
      if (!token) {
        setLoading(false);
        setUser(null);
        return;
      }
      try {
        const info = await clientFetch<UserInfo>('/api/auth/v1/userInfo', { method: 'GET', auth: true });
        if (!canceled) setUser(info || null);
      } catch {
        if (!canceled) setUser(null);
      } finally {
        if (!canceled) setLoading(false);
      }
    }
    run();
    return () => {
      canceled = true;
    };
  }, [token]);

  return (
    <>
      <header className="chek-header">
        <div className="chek-title-row">
          <h1 className="chek-title">胶己</h1>
          {!loading && token ? (
            <button
              className="chek-chip gray"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                clearToken();
                setUser(null);
                setTokenState('');
              }}
            >
              退出
            </button>
          ) : (
            <Link href="/auth/login" className="chek-chip gray">
              登录
            </Link>
          )}
        </div>
      </header>

      <main className="chek-section" style={{ display: 'grid', gap: 12 }}>
        <div className="chek-card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>
            {loading ? '加载中…' : user?.nickName || (token ? '胶己' : '游客')}
          </div>
          <div className="chek-muted" style={{ lineHeight: 1.7 }}>
            {token
              ? `userOneId：${user?.userOneId || '—'}`
              : '欢迎你来潮汕。先随便逛逛也行；想发相辅/评论的话，登录一下更方便。'}
          </div>

          {!token ? (
            <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
              <Link href="/auth/login" className="chek-chip">
                去登录
              </Link>
              <Link href="/feed" className="chek-chip gray">
                先随便逛逛
              </Link>
            </div>
          ) : null}
        </div>

        <Link href="/me/posts" className="chek-card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>我的相辅</div>
          <div className="chek-muted">看我发过的相辅，顺便看看大家怎么评论。</div>
        </Link>

        <Link href="/me/favorites" className="chek-card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>我的收藏</div>
          <div className="chek-muted">先占位，MVP 可后置。</div>
        </Link>

        <Link href="/settings" className="chek-card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>设置</div>
          <div className="chek-muted">账号与安全、隐私、关于。</div>
        </Link>

        <Link href="/legal" className="chek-card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>协议与免责声明</div>
          <div className="chek-muted">我们尽量把话说清楚，不拐弯。</div>
        </Link>
      </main>
    </>
  );
}

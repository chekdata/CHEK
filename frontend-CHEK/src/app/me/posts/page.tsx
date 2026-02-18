'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { clientFetch } from '@/lib/client-api';
import type { PostDTO } from '@/lib/api-types';
import { getToken } from '@/lib/token';

type UserInfo = { userOneId?: string; nickName?: string };

export default function MyPostsPage() {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<PostDTO[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const token = getToken();
    if (!token) {
      setLoading(false);
      setMsg('未登录：只能看公共内容。要看“我的相辅”，先登录一下。');
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      const user = await clientFetch<UserInfo>('/api/auth/v1/userInfo', { method: 'GET', auth: true });
      const userOneId = String(user?.userOneId || '').trim();
      if (!userOneId) throw new Error('用户信息缺少 userOneId');
      const list = await clientFetch<PostDTO[]>(
        `/api/chek-content/v1/posts?authorUserOneId=${encodeURIComponent(userOneId)}&limit=30`,
        { method: 'GET' }
      );
      setPosts(Array.isArray(list) ? list : []);
    } catch (e: any) {
      setMsg(e?.message || '加载失败了，真诚抱歉。');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="chek-shell" style={{ paddingBottom: 24 }}>
      <header className="chek-header">
        <div className="chek-title-row">
          <h1 className="chek-title">我的相辅</h1>
          <Link href="/me" className="chek-chip gray">
            返回
          </Link>
        </div>
      </header>

      <main className="chek-section" style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="chek-chip gray" style={{ border: 'none', cursor: 'pointer' }} onClick={load}>
            刷新
          </button>
          <Link href="/post/new" className="chek-chip">
            + 来相辅
          </Link>
        </div>

        {loading ? <div className="chek-muted">加载中…</div> : null}

        {msg ? (
          <div className="chek-card" style={{ padding: 16 }}>
            <div className="chek-muted" style={{ lineHeight: 1.7 }}>
              {msg}
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
              <Link href="/auth/login?next=/me/posts" className="chek-chip">
                去登录
              </Link>
              <Link href="/feed" className="chek-chip gray">
                去相辅
              </Link>
            </div>
          </div>
        ) : null}

        {posts.length > 0 ? (
          <div style={{ display: 'grid', gap: 10 }}>
            {posts.map((p) => (
              <Link key={p.postId} href={`/p/${p.postId}`} className="chek-card" style={{ padding: 16 }}>
                <div style={{ fontWeight: 900, marginBottom: 6 }}>{p.title?.trim() || '无标题'}</div>
                <div className="chek-muted" style={{ fontSize: 13 }}>
                  {p.createdAt ? new Date(p.createdAt).toLocaleString() : '—'} · {p.commentCount} 评论
                </div>
              </Link>
            ))}
          </div>
        ) : !loading && !msg ? (
          <div className="chek-card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>还没有相辅</div>
            <div className="chek-muted" style={{ lineHeight: 1.7 }}>
              欢迎你来潮汕。你还没发过相辅，给你添麻烦了，先抱歉。
              <br />
              来发第一条吧，我们一起把信息补齐。
            </div>
            <div style={{ marginTop: 12 }}>
              <Link href="/post/new" className="chek-chip">
                + 来相辅
              </Link>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}


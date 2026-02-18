'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { CommentDTO } from '@/lib/api-types';
import { clientFetch } from '@/lib/client-api';
import { getToken } from '@/lib/token';

export function CommentsSection({ postId }: { postId: number }) {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<CommentDTO[]>([]);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const data = await clientFetch<CommentDTO[]>(
        `/api/chek-content/v1/posts/${postId}/comments?limit=50`,
        { method: 'GET' }
      );
      setList(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setMsg(e?.message || '评论加载失败了，真诚抱歉。');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  async function submit() {
    const token = getToken();
    if (!token) {
      setMsg('要评论的话，先登录一下。');
      return;
    }
    const t = body.trim();
    if (!t) return;
    setSubmitting(true);
    setMsg(null);
    try {
      await clientFetch(`/api/chek-content/v1/posts/${postId}/comments`, {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ body: t }),
      });
      setBody('');
      await refresh();
    } catch (e: any) {
      setMsg(e?.message || '评论失败了，给你添麻烦了，先抱歉。');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontWeight: 900 }}>评论</div>
        <button className="chek-chip gray" style={{ border: 'none', cursor: 'pointer' }} onClick={refresh}>
          刷新
        </button>
      </div>

      <div className="chek-card" style={{ padding: 12 }}>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="说两句吧（不必客气）"
          rows={3}
          style={{
            width: '100%',
            borderRadius: 12,
            border: '1px solid rgba(0,0,0,0.08)',
            padding: 10,
            outline: 'none',
            background: 'rgba(255,255,255,0.85)',
            resize: 'vertical',
            lineHeight: 1.6,
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
          <div className="chek-muted" style={{ fontSize: 12 }}>
            {getToken() ? '文明交流，胶己人都舒服。' : '未登录：只读'}
          </div>
          {getToken() ? (
            <button
              className="chek-chip"
              style={{ border: 'none', cursor: 'pointer' }}
              onClick={submit}
              disabled={submitting}
            >
              {submitting ? '发送中…' : '发送'}
            </button>
          ) : (
            <Link href={`/auth/login?next=/p/${postId}`} className="chek-chip">
              去登录
            </Link>
          )}
        </div>
      </div>

      {msg ? (
        <div className="chek-muted" style={{ marginTop: 10, fontSize: 13, lineHeight: 1.6 }}>
          {msg}
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
        {loading ? (
          <div className="chek-muted">加载评论中…</div>
        ) : list.length > 0 ? (
          list.map((c) => (
            <div key={c.commentId} className="chek-card" style={{ padding: 12, borderRadius: 18 }}>
              <div className="chek-muted" style={{ fontSize: 12, fontWeight: 800 }}>
                {c.authorUserOneId} ·{' '}
                {c.createdAt ? new Date(c.createdAt).toLocaleString() : '—'}
              </div>
              <div style={{ marginTop: 6, lineHeight: 1.7, fontSize: 14, whiteSpace: 'pre-wrap' }}>{c.body}</div>
            </div>
          ))
        ) : (
          <div className="chek-card" style={{ padding: 12 }}>
            <div className="chek-muted" style={{ lineHeight: 1.7 }}>
              还没有评论。欢迎你先说两句，路上辛苦了。
            </div>
          </div>
        )}
      </div>
    </section>
  );
}


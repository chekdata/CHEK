'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { CommentDTO } from '@/lib/api-types';
import { clientFetch } from '@/lib/client-api';
import { getToken } from '@/lib/token';
import { resolveAuthorDisplayName } from '@/lib/user-display';
import { SkeletonBlock, SkeletonLines } from '@/components/Skeleton';

function formatTime(ts?: string): string {
  if (!ts) return '—';
  const d = new Date(ts);
  if (!Number.isFinite(d.getTime())) return '—';
  return d.toLocaleString();
}

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
    <section style={{ marginTop: 18, paddingBottom: 96 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontWeight: 900 }}>评论 {list.length ? `(${list.length})` : ''}</div>
        <button className="chek-chip gray" style={{ border: 'none', cursor: 'pointer' }} onClick={refresh}>
          刷新
        </button>
      </div>

      {msg ? (
        <div className="chek-card" style={{ padding: 12, borderRadius: 18, marginBottom: 12 }}>
          <div className="chek-muted" style={{ lineHeight: 1.7 }}>
            {msg}
          </div>
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: 10 }}>
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={`skeleton-${index}`} className="chek-card" style={{ padding: 12, borderRadius: 20 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <SkeletonBlock width={32} height={32} radius={999} style={{ marginTop: 2 }} />
                <div style={{ minWidth: 0, flex: 1, display: 'grid', gap: 8 }}>
                  <SkeletonBlock width="42%" height={12} />
                  <SkeletonLines lines={2} widths={['92%', '76%']} />
                </div>
                <SkeletonBlock width={46} height={30} radius={999} />
              </div>
            </div>
          ))
        ) : list.length > 0 ? (
          list.map((c) => (
            <div key={c.commentId} className="chek-card" style={{ padding: 12, borderRadius: 20 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div className="chek-avatar" aria-hidden style={{ width: 32, height: 32, marginTop: 2 }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="chek-muted" style={{ fontSize: 12, fontWeight: 800 }}>
                    {resolveAuthorDisplayName(c.authorUserOneId, '游客')} · {formatTime(c.createdAt)}
                  </div>
                  <div style={{ marginTop: 6, lineHeight: 1.7, fontSize: 14, whiteSpace: 'pre-wrap' }}>{c.body}</div>
                </div>
                <button
                  className="chek-chip gray"
                  style={{ border: 'none', cursor: 'not-allowed', height: 30 }}
                  type="button"
                  disabled
                >
                  回复
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="chek-card" style={{ padding: 12, borderRadius: 20 }}>
            <div className="chek-muted" style={{ lineHeight: 1.7 }}>
              还没有评论。欢迎你先说两句，路上辛苦了。
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          position: 'fixed',
          left: '50%',
          bottom: `calc(env(safe-area-inset-bottom) + 14px)`,
          transform: 'translateX(-50%)',
          width: 'min(420px, 100%)',
          padding: '0 16px',
          zIndex: 40,
          pointerEvents: 'none',
        }}
      >
        <div
          className="chek-card"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: 10,
            borderRadius: 28,
            pointerEvents: 'auto',
          }}
        >
          {getToken() ? (
            <form
              style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
            >
              <input
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="胶己人说两句..."
                style={{
                  flex: 1,
                  borderRadius: 24,
                  border: '1px solid rgba(0,0,0,0.08)',
                  padding: '10px 12px',
                  outline: 'none',
                  background: 'rgba(255,255,255,0.85)',
                }}
              />
              <button
                className="chek-chip"
                style={{ border: 'none', cursor: 'pointer', height: 40, minWidth: 72, justifyContent: 'center' }}
                type="submit"
                disabled={submitting}
              >
                {submitting ? '发送中…' : '发送'}
              </button>
            </form>
          ) : (
            <Link href={`/auth/login?next=/p/${postId}`} className="chek-chip" style={{ flex: 1, justifyContent: 'center', height: 40 }}>
              登录后评论
            </Link>
          )}

          <button
            type="button"
            className="chek-chip gray"
            style={{ border: 'none', cursor: 'not-allowed', height: 40, minWidth: 56, justifyContent: 'center' }}
            disabled
            aria-label="收藏（占位）"
          >
            ☆
          </button>

          <button
            type="button"
            className="chek-chip gray"
            style={{ border: 'none', cursor: 'not-allowed', height: 40, minWidth: 56, justifyContent: 'center' }}
            disabled
            aria-label="分享（占位）"
          >
            ↗
          </button>
        </div>
      </div>
    </section>
  );
}

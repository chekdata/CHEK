'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CommentDTO, PostDTO } from '@/lib/api-types';
import { clientFetch } from '@/lib/client-api';
import { getToken } from '@/lib/token';
import { absoluteUrl, shareLink } from '@/lib/share';
import { resolveAuthorDisplayName } from '@/lib/user-display';
import { SkeletonBlock, SkeletonLines } from '@/components/Skeleton';
import { UserAvatar } from '@/components/UserAvatar';

function formatTime(ts?: string): string {
  if (!ts) return '—';
  const d = new Date(ts);
  if (!Number.isFinite(d.getTime())) return '—';
  return d.toLocaleString();
}

function tsValue(ts?: string | null): number {
  if (!ts) return 0;
  const d = new Date(ts);
  const t = d.getTime();
  return Number.isFinite(t) ? t : 0;
}

type CommentNode = CommentDTO & {
  children: CommentNode[];
};

function buildCommentTree(list: CommentDTO[]): CommentNode[] {
  const nodes = new Map<number, CommentNode>();
  for (const c of list) {
    if (!c || !Number.isFinite(Number(c.commentId))) continue;
    nodes.set(c.commentId, { ...c, children: [] });
  }

  const roots: CommentNode[] = [];
  for (const node of nodes.values()) {
    const parentId = node.parentCommentId ? Number(node.parentCommentId) : 0;
    const parent = parentId ? nodes.get(parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}

function descendantCount(node: CommentNode): number {
  let count = 0;
  for (const child of node.children) count += 1 + descendantCount(child);
  return count;
}

function sortCommentTree(roots: CommentNode[], mode: 'new' | 'hot'): CommentNode[] {
  function sortChildren(node: CommentNode) {
    node.children.sort((a, b) => tsValue(a.createdAt) - tsValue(b.createdAt) || a.commentId - b.commentId);
    for (const child of node.children) sortChildren(child);
  }

  const list = roots.slice();
  if (mode === 'hot') {
    list.sort(
      (a, b) => descendantCount(b) - descendantCount(a) || tsValue(b.createdAt) - tsValue(a.createdAt) || b.commentId - a.commentId
    );
  } else {
    list.sort((a, b) => tsValue(b.createdAt) - tsValue(a.createdAt) || b.commentId - a.commentId);
  }

  for (const node of list) sortChildren(node);
  return list;
}

export function CommentsSection({ postId }: { postId: number }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<CommentDTO[]>([]);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<'new' | 'hot'>('new');
  const [replyTo, setReplyTo] = useState<{ commentId: number; authorUserOneId: string } | null>(null);
  const [social, setSocial] = useState<{
    likeCount: number;
    favoriteCount: number;
    likedByMe: boolean;
    favoritedByMe: boolean;
  } | null>(null);
  const [likePending, setLikePending] = useState(false);
  const [favoritePending, setFavoritePending] = useState(false);
  const [shareHint, setShareHint] = useState('');

  async function refresh() {
    setLoading(true);
    setMsg(null);
    try {
      const data = await clientFetch<CommentDTO[]>(
        `/api/chek-content/v1/posts/${postId}/comments?limit=100`,
        { method: 'GET' }
      );
      setList(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setMsg(e?.message || '评论加载失败了，真诚抱歉。');
    } finally {
      setLoading(false);
    }
  }

  async function refreshSocial() {
    try {
      const post = await clientFetch<PostDTO>(`/api/chek-content/v1/posts/${postId}`, {
        method: 'GET',
        auth: true,
      });
      setSocial({
        likeCount: Number(post?.likeCount || 0),
        favoriteCount: Number(post?.favoriteCount || 0),
        likedByMe: post?.likedByMe === true,
        favoritedByMe: post?.favoritedByMe === true,
      });
    } catch {
      // keep whatever we had
    }
  }

  useEffect(() => {
    refresh();
    refreshSocial();
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
        body: JSON.stringify({ body: t, parentCommentId: replyTo?.commentId || null }),
      });
      setBody('');
      setReplyTo(null);
      await refresh();
    } catch (e: any) {
      setMsg(e?.message || '评论失败了，给你添麻烦了，先抱歉。');
    } finally {
      setSubmitting(false);
    }
  }

  function gotoLogin() {
    router.push(`/auth/login?next=${encodeURIComponent(`/p/${postId}`)}`);
  }

  async function toggleLike() {
    if (likePending) return;
    if (!getToken()) return gotoLogin();
    const curLiked = social?.likedByMe === true;
    const nextLiked = !curLiked;

    setSocial((s) => ({
      likeCount: Math.max(0, Number(s?.likeCount || 0) + (nextLiked ? 1 : -1)),
      favoriteCount: Number(s?.favoriteCount || 0),
      likedByMe: nextLiked,
      favoritedByMe: s?.favoritedByMe === true,
    }));

    setLikePending(true);
    try {
      const updated = await clientFetch<PostDTO>(`/api/chek-content/v1/posts/${postId}/likes`, {
        method: nextLiked ? 'POST' : 'DELETE',
        auth: true,
      });
      setSocial({
        likeCount: Number(updated?.likeCount || 0),
        favoriteCount: Number(updated?.favoriteCount || 0),
        likedByMe: updated?.likedByMe === true,
        favoritedByMe: updated?.favoritedByMe === true,
      });
    } catch (e: any) {
      setMsg(e?.message || '操作失败了，真诚抱歉。');
      await refreshSocial();
    } finally {
      setLikePending(false);
    }
  }

  async function toggleFavorite() {
    if (favoritePending) return;
    if (!getToken()) return gotoLogin();
    const curFav = social?.favoritedByMe === true;
    const nextFav = !curFav;

    setSocial((s) => ({
      likeCount: Number(s?.likeCount || 0),
      favoriteCount: Math.max(0, Number(s?.favoriteCount || 0) + (nextFav ? 1 : -1)),
      likedByMe: s?.likedByMe === true,
      favoritedByMe: nextFav,
    }));

    setFavoritePending(true);
    try {
      const updated = await clientFetch<PostDTO>(`/api/chek-content/v1/posts/${postId}/favorites`, {
        method: nextFav ? 'POST' : 'DELETE',
        auth: true,
      });
      setSocial({
        likeCount: Number(updated?.likeCount || 0),
        favoriteCount: Number(updated?.favoriteCount || 0),
        likedByMe: updated?.likedByMe === true,
        favoritedByMe: updated?.favoritedByMe === true,
      });
    } catch (e: any) {
      setMsg(e?.message || '操作失败了，真诚抱歉。');
      await refreshSocial();
    } finally {
      setFavoritePending(false);
    }
  }

  async function onShare() {
    const url = absoluteUrl(`/p/${postId}`);
    const method = await shareLink({ url, title: '相辅' });
    if (method === 'copied') {
      setShareHint('已复制');
      window.setTimeout(() => setShareHint(''), 1200);
    }
  }

  const tree = useMemo(() => sortCommentTree(buildCommentTree(list), sortMode), [list, sortMode]);

  function beginReply(target: CommentDTO) {
    setReplyTo({ commentId: target.commentId, authorUserOneId: target.authorUserOneId });
    setMsg(null);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }

  function renderNode(node: CommentNode, depth: number, parent?: CommentNode) {
    const authorLabel = resolveAuthorDisplayName(node.authorUserOneId, '游客');
    const parentLabel = parent ? resolveAuthorDisplayName(parent.authorUserOneId, '游客') : '';
    const metaParts = [authorLabel, formatTime(node.createdAt)];
    if (parentLabel) metaParts.push(`回复 ${parentLabel}`);
    const meta = metaParts.filter(Boolean).join(' · ');

    const avatarSize = depth === 0 ? 32 : 28;
    const padLeft = depth === 0 ? 0 : 14;
    const borderLeft = depth === 0 ? 'none' : '2px solid rgba(0,0,0,0.06)';

    return (
      <div key={node.commentId} style={{ paddingLeft: padLeft, borderLeft }}>
        <div
          style={{
            padding: depth === 0 ? 12 : 10,
            borderRadius: depth === 0 ? 20 : 16,
            background: depth === 0 ? undefined : 'rgba(0,0,0,0.03)',
            border: depth === 0 ? undefined : '1px solid rgba(0,0,0,0.05)',
          }}
          className={depth === 0 ? 'chek-card' : undefined}
        >
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <UserAvatar userOneId={node.authorUserOneId} label={authorLabel} size={avatarSize} style={{ marginTop: 2 }} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="chek-muted" style={{ fontSize: 12, fontWeight: 800 }}>
                {meta}
              </div>
              <div style={{ marginTop: 6, lineHeight: 1.7, fontSize: 14, whiteSpace: 'pre-wrap' }}>{node.body}</div>
              <div style={{ marginTop: 10 }}>
                <button
                  type="button"
                  className="chek-chip gray"
                  style={{ border: 'none', cursor: 'pointer', padding: '6px 10px', fontSize: 12 }}
                  onClick={() => beginReply(node)}
                >
                  回复
                </button>
              </div>
            </div>
          </div>

          {node.children.length > 0 ? (
            <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
              {node.children.map((child) => renderNode(child, depth + 1, node))}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <section style={{ marginTop: 18, paddingBottom: 96 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontWeight: 900 }}>评论 {list.length ? `(${list.length})` : ''}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className={sortMode === 'new' ? 'chek-chip' : 'chek-chip gray'}
            style={{ border: 'none', cursor: 'pointer' }}
            onClick={() => setSortMode('new')}
          >
            最新
          </button>
          <button
            type="button"
            className={sortMode === 'hot' ? 'chek-chip' : 'chek-chip gray'}
            style={{ border: 'none', cursor: 'pointer' }}
            onClick={() => setSortMode('hot')}
          >
            最热
          </button>
          <button type="button" className="chek-chip gray" style={{ border: 'none', cursor: 'pointer' }} onClick={refresh}>
            刷新
          </button>
        </div>
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
        ) : tree.length > 0 ? (
          tree.map((n) => renderNode(n, 0))
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
            display: 'grid',
            gap: 8,
            padding: 10,
            borderRadius: 28,
            pointerEvents: 'auto',
          }}
        >
          {replyTo ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div className="chek-muted" style={{ fontSize: 12, fontWeight: 800 }}>
                回复 {resolveAuthorDisplayName(replyTo.authorUserOneId, '游客')}
              </div>
              <button
                type="button"
                className="chek-chip gray"
                style={{ border: 'none', cursor: 'pointer', padding: '6px 10px', fontSize: 12 }}
                onClick={() => setReplyTo(null)}
              >
                取消
              </button>
            </div>
          ) : null}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {getToken() ? (
              <form
                style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
              >
                <input
                  ref={inputRef}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={replyTo ? '回复一句…' : '胶己人说两句...'}
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
              <Link
                href={`/auth/login?next=/p/${postId}`}
                className="chek-chip"
                style={{ flex: 1, justifyContent: 'center', height: 40 }}
              >
                登录后评论
              </Link>
            )}

            <button
              type="button"
              className={social?.likedByMe ? 'chek-chip' : 'chek-chip gray'}
              style={{ border: 'none', cursor: 'pointer', height: 40, minWidth: 72, justifyContent: 'center' }}
              aria-label="点赞"
              onClick={toggleLike}
              disabled={likePending}
            >
              ♥ {social?.likeCount ? social.likeCount : '赞'}
            </button>

            <button
              type="button"
              className={social?.favoritedByMe ? 'chek-chip' : 'chek-chip gray'}
              style={{ border: 'none', cursor: 'pointer', height: 40, minWidth: 72, justifyContent: 'center' }}
              aria-label="收藏"
              onClick={toggleFavorite}
              disabled={favoritePending}
            >
              ☆ {social?.favoriteCount ? social.favoriteCount : '藏'}
            </button>

            <button
              type="button"
              className="chek-chip gray"
              style={{ border: 'none', cursor: 'pointer', height: 40, minWidth: 56, justifyContent: 'center' }}
              aria-label="分享"
              onClick={onShare}
            >
              {shareHint || '↗'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

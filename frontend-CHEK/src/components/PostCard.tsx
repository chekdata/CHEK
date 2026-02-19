'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { PostDTO } from '@/lib/api-types';
import type { PostMediaDTO } from '@/lib/api-types';
import { clientFetch } from '@/lib/client-api';
import { resolveMediaObject } from '@/lib/media';
import { getToken } from '@/lib/token';
import { absoluteUrl, shareLink } from '@/lib/share';
import { highlightText } from '@/lib/highlight';
import { resolveAuthorDisplayName } from '@/lib/user-display';
import { UserAvatar } from '@/components/UserAvatar';

function snippetFromBody(body: string): string {
  const s = String(body || '')
    .replace(/```[\\s\\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/!\\[[^\\]]*\\]\\([^)]*\\)/g, '')
    .replace(/\\[[^\\]]*\\]\\([^)]*\\)/g, '')
    .replace(/[#>*_~]/g, '')
    .trim();
  return s.length > 90 ? `${s.slice(0, 90)}…` : s;
}

function formatRelativeTime(ts?: string): string {
  if (!ts) return '';
  const d = new Date(ts);
  if (!Number.isFinite(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min <= 0) return '刚刚';
  if (min < 60) return `${min}分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}小时前`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}天前`;
  return d.toLocaleDateString();
}

type MediaPreview = {
  mediaObjectId: number;
  kind: string;
  url: string;
  contentType: string;
  loading: boolean;
};

export function PostCard({ post, highlightQuery }: { post: PostDTO; highlightQuery?: string }) {
  const router = useRouter();
  const pathname = usePathname();

  const title = post.title?.trim() || '';
  const summary = snippetFromBody(post.body);
  const author = String(post.authorUserOneId || '').trim();
  const authorLabel = resolveAuthorDisplayName(author, '游客');
  const time = formatRelativeTime(post.createdAt || post.updatedAt);
  const meta = [time, post.locationName].filter(Boolean).join(' · ');
  const mediaCount = Array.isArray(post.media) ? post.media.length : 0;
  const mediaPreview = Math.min(mediaCount, 2);

  const [likeCount, setLikeCount] = useState<number>(Number(post.likeCount || 0));
  const [favoriteCount, setFavoriteCount] = useState<number>(Number(post.favoriteCount || 0));
  const [likedByMe, setLikedByMe] = useState<boolean>(post.likedByMe === true);
  const [favoritedByMe, setFavoritedByMe] = useState<boolean>(post.favoritedByMe === true);
  const [likePending, setLikePending] = useState(false);
  const [favoritePending, setFavoritePending] = useState(false);
  const [shareHint, setShareHint] = useState<string>('');

  useEffect(() => {
    setLikeCount(Number(post.likeCount || 0));
    setFavoriteCount(Number(post.favoriteCount || 0));
    setLikedByMe(post.likedByMe === true);
    setFavoritedByMe(post.favoritedByMe === true);
  }, [post.favoriteCount, post.favoritedByMe, post.likeCount, post.likedByMe]);

  const previewList = useMemo<PostMediaDTO[]>(() => {
    const list: PostMediaDTO[] = Array.isArray(post.media) ? (post.media as PostMediaDTO[]) : [];
    return list.slice(0, mediaPreview);
  }, [mediaPreview, post.media]);

  const [mediaViews, setMediaViews] = useState<MediaPreview[]>([]);
  useEffect(() => {
    let canceled = false;
    if (previewList.length === 0) {
      setMediaViews([]);
      return () => {
        canceled = true;
      };
    }

    setMediaViews(
      previewList.map((m) => ({
        mediaObjectId: m.mediaObjectId,
        kind: m.kind,
        url: '',
        contentType: '',
        loading: true,
      }))
    );

    Promise.allSettled(previewList.map((m) => resolveMediaObject(m.mediaObjectId))).then((results) => {
      if (canceled) return;
      setMediaViews(
        previewList.map((m, i) => {
          const r = results[i];
          if (r && r.status === 'fulfilled') {
            return {
              mediaObjectId: m.mediaObjectId,
              kind: m.kind,
              url: r.value.url,
              contentType: r.value.contentType,
              loading: false,
            };
          }
          return {
            mediaObjectId: m.mediaObjectId,
            kind: m.kind,
            url: '',
            contentType: '',
            loading: false,
          };
        })
      );
    });

    return () => {
      canceled = true;
    };
  }, [previewList]);

  function gotoLogin() {
    const next = pathname || '/feed';
    router.push(`/auth/login?next=${encodeURIComponent(next)}`);
  }

  async function toggleLike() {
    if (likePending) return;
    if (!getToken()) return gotoLogin();
    const nextLiked = !likedByMe;
    setLikedByMe(nextLiked);
    setLikeCount((n) => Math.max(0, n + (nextLiked ? 1 : -1)));
    setLikePending(true);
    try {
      const updated = await clientFetch<PostDTO>(`/api/chek-content/v1/posts/${post.postId}/likes`, {
        method: nextLiked ? 'POST' : 'DELETE',
        auth: true,
      });
      setLikeCount(Number(updated?.likeCount || 0));
      setFavoriteCount(Number(updated?.favoriteCount || 0));
      setLikedByMe(updated?.likedByMe === true);
      setFavoritedByMe(updated?.favoritedByMe === true);
    } catch {
      setLikedByMe(!nextLiked);
      setLikeCount((n) => Math.max(0, n + (nextLiked ? -1 : 1)));
    } finally {
      setLikePending(false);
    }
  }

  async function toggleFavorite() {
    if (favoritePending) return;
    if (!getToken()) return gotoLogin();
    const nextFav = !favoritedByMe;
    setFavoritedByMe(nextFav);
    setFavoriteCount((n) => Math.max(0, n + (nextFav ? 1 : -1)));
    setFavoritePending(true);
    try {
      const updated = await clientFetch<PostDTO>(`/api/chek-content/v1/posts/${post.postId}/favorites`, {
        method: nextFav ? 'POST' : 'DELETE',
        auth: true,
      });
      setLikeCount(Number(updated?.likeCount || 0));
      setFavoriteCount(Number(updated?.favoriteCount || 0));
      setLikedByMe(updated?.likedByMe === true);
      setFavoritedByMe(updated?.favoritedByMe === true);
    } catch {
      setFavoritedByMe(!nextFav);
      setFavoriteCount((n) => Math.max(0, n + (nextFav ? -1 : 1)));
    } finally {
      setFavoritePending(false);
    }
  }

  async function onShare() {
    const url = absoluteUrl(`/p/${post.postId}`);
    const method = await shareLink({ url, title: title || '相辅' });
    if (method === 'copied') {
      setShareHint('已复制');
      window.setTimeout(() => setShareHint(''), 1200);
    }
  }

  return (
    <article className="chek-card chek-post-card" style={{ display: 'block' }}>
      <Link href={`/p/${post.postId}`} style={{ display: 'block', color: 'inherit', textDecoration: 'none' }}>
        <div className="chek-author-row">
          <UserAvatar userOneId={author} label={authorLabel} size={36} />
          <div style={{ minWidth: 0 }}>
            <div className="chek-author-name">{authorLabel}</div>
            <div className="chek-author-meta">{meta || '—'}</div>
          </div>
        </div>

        {title ? (
          <div style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.35, marginBottom: 8 }}>
            {highlightText(title, highlightQuery || '')}
          </div>
        ) : null}

        <div className="chek-card-text">
          {summary ? highlightText(summary, highlightQuery || '') : '先说两句也行，胶己人都爱听。'}
        </div>

        {mediaPreview > 0 ? (
          <div className="chek-media-grid" aria-label="媒体预览">
            {mediaViews.length > 0 ? (
              mediaViews.map((v) => (
                <div key={v.mediaObjectId} className="chek-media-item">
                  {v.loading ? null : v.url && String(v.contentType || '').toLowerCase().startsWith('image/') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div
                      className="chek-muted"
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      媒体
                    </div>
                  )}
                </div>
              ))
            ) : (
              Array.from({ length: mediaPreview }).map((_, i) => <div key={i} className="chek-media-item" />)
            )}
          </div>
        ) : null}
      </Link>

      <div className="chek-action-row" aria-label="操作">
        <button
          type="button"
          className={`chek-action-item${likedByMe ? ' active' : ''}`}
          style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
          onClick={toggleLike}
          disabled={likePending}
          aria-label="点赞"
        >
          <svg
            className="chek-icon-sm"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          {likeCount > 0 ? likeCount : '赞'}
        </button>

        <button
          type="button"
          className={`chek-action-item${favoritedByMe ? ' active' : ''}`}
          style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
          onClick={toggleFavorite}
          disabled={favoritePending}
          aria-label="收藏"
        >
          <svg className="chek-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
          {favoriteCount > 0 ? favoriteCount : '收藏'}
        </button>

        <Link href={`/p/${post.postId}`} className="chek-action-item active" aria-label="评论">
          <svg
            className="chek-icon-sm"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          {post.commentCount > 0 ? post.commentCount : '评论'}
        </Link>

        <button
          type="button"
          className="chek-action-item"
          style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
          onClick={onShare}
          aria-label="分享"
        >
          <svg
            className="chek-icon-sm"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          {shareHint || '分享'}
        </button>
      </div>
    </article>
  );
}

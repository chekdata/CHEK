import Link from 'next/link';
import { PostDTO } from '@/lib/api-types';
import { resolveAuthorDisplayName } from '@/lib/user-display';

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

function avatarColor(seed: string): string {
  const s = String(seed || '');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const palette = ['rgba(51,136,255,0.18)', 'rgba(70,235,213,0.18)', 'rgba(211,119,205,0.16)', 'rgba(0,0,0,0.08)'];
  return palette[h % palette.length]!;
}

export function PostCard({ post }: { post: PostDTO }) {
  const title = post.title?.trim() || '';
  const summary = snippetFromBody(post.body);
  const author = String(post.authorUserOneId || '').trim();
  const authorLabel = resolveAuthorDisplayName(author, '游客');
  const time = formatRelativeTime(post.createdAt || post.updatedAt);
  const meta = [time, post.locationName].filter(Boolean).join(' · ');
  const mediaCount = Array.isArray(post.media) ? post.media.length : 0;
  const mediaPreview = Math.min(mediaCount, 2);

  return (
    <Link href={`/p/${post.postId}`} className="chek-card chek-post-card" style={{ display: 'block' }}>
      <div className="chek-author-row">
        <div className="chek-avatar" style={{ background: avatarColor(author) }} aria-hidden />
        <div style={{ minWidth: 0 }}>
          <div className="chek-author-name">{authorLabel}</div>
          <div className="chek-author-meta">{meta || '—'}</div>
        </div>
      </div>

      {title ? (
        <div style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.35, marginBottom: 8 }}>
          {title}
        </div>
      ) : null}

      <div className="chek-card-text">{summary || '先说两句也行，胶己人都爱听。'}</div>

      {mediaPreview > 0 ? (
        <div className="chek-media-grid" aria-label="媒体预览">
          {Array.from({ length: mediaPreview }).map((_, i) => (
            <div key={i} className="chek-media-item" />
          ))}
        </div>
      ) : null}

      <div className="chek-action-row" aria-label="操作">
        <div className="chek-action-item">
          <svg
            className="chek-icon-sm"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          赞
        </div>

        <div className="chek-action-item active">
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
        </div>

        <div className="chek-action-item">
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
          分享
        </div>
      </div>
    </Link>
  );
}

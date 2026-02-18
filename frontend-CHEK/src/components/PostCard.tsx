import Link from 'next/link';
import { PostDTO } from '@/lib/api-types';

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

export function PostCard({ post }: { post: PostDTO }) {
  const title = post.title?.trim() || '';
  const summary = snippetFromBody(post.body);

  return (
    <Link href={`/p/${post.postId}`} className="chek-card" style={{ display: 'block', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 900, fontSize: 16, lineHeight: 1.3 }}>
            {title || '无标题'}
          </div>
          <div className="chek-muted" style={{ marginTop: 8, fontSize: 13, lineHeight: 1.5 }}>
            {summary || '先说两句也行，胶己人都爱听。'}
          </div>
        </div>
        <div className="chek-chip gray" style={{ height: 28 }}>
          {post.commentCount} 评论
        </div>
      </div>

      {post.tags && post.tags.length > 0 ? (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          {post.tags.slice(0, 4).map((t) => (
            <span key={t} className="chek-chip" style={{ padding: '6px 10px' }}>
              #{t}
            </span>
          ))}
        </div>
      ) : null}
    </Link>
  );
}


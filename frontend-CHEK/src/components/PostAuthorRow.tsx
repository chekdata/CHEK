'use client';

import { resolveAuthorDisplayName } from '@/lib/user-display';
import { FollowButton } from '@/components/FollowButton';
import { UserAvatar } from '@/components/UserAvatar';

function formatTime(ts?: string | null): string {
  if (!ts) return '—';
  const d = new Date(ts);
  if (!Number.isFinite(d.getTime())) return '—';
  return d.toLocaleString();
}

export function PostAuthorRow({
  authorUserOneId,
  createdAt,
  locationName,
  nextPath,
  avatarSize = 40,
}: {
  authorUserOneId: string;
  createdAt?: string | null;
  locationName?: string | null;
  nextPath: string;
  avatarSize?: number;
}) {
  const authorLabel = resolveAuthorDisplayName(authorUserOneId, '游客');
  const meta = [formatTime(createdAt), String(locationName || '').trim()].filter(Boolean).join(' · ') || '—';

  return (
    <div className="chek-author-row" style={{ margin: 0 }}>
      <UserAvatar userOneId={authorUserOneId} label={authorLabel} size={avatarSize} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="chek-author-name">{authorLabel}</div>
        <div className="chek-author-meta">{meta}</div>
      </div>
      <FollowButton targetUserOneId={authorUserOneId} nextPath={nextPath} />
    </div>
  );
}

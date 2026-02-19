'use client';

import type { CSSProperties } from 'react';
import { readCurrentUserProfile } from '@/lib/user-display';

function avatarColor(seed: string): string {
  const s = String(seed || '');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const palette = [
    'rgba(51,136,255,0.18)',
    'rgba(70,235,213,0.18)',
    'rgba(211,119,205,0.16)',
    'rgba(0,0,0,0.08)',
  ];
  return palette[h % palette.length]!;
}

function pickInitial(label?: string | null): string {
  const s = String(label || '').trim();
  if (!s) return '';
  return s.slice(0, 1).toUpperCase();
}

export function UserAvatar({
  userOneId,
  label,
  size = 36,
  className,
  style,
}: {
  userOneId?: string | null;
  label?: string | null;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const uid = String(userOneId || '').trim();
  const current = readCurrentUserProfile();
  const avatarUrl = current?.userOneId && uid && current.userOneId === uid ? String(current.avatarUrl || '').trim() : '';
  const initial = pickInitial(label) || (uid ? uid.slice(-1) : '');

  const base: CSSProperties = {
    width: size,
    height: size,
    background: avatarUrl ? undefined : avatarColor(uid || label || ''),
    backgroundImage: avatarUrl ? `url(${avatarUrl})` : undefined,
    backgroundSize: avatarUrl ? 'cover' : undefined,
    backgroundPosition: avatarUrl ? 'center' : undefined,
  };

  return (
    <div className={`chek-avatar${className ? ` ${className}` : ''}`} aria-hidden style={{ ...base, ...style }}>
      {!avatarUrl && initial ? (
        <span style={{ fontSize: Math.max(12, Math.floor(size * 0.42)), fontWeight: 900, color: 'rgba(0,0,0,0.55)' }}>
          {initial}
        </span>
      ) : null}
    </div>
  );
}


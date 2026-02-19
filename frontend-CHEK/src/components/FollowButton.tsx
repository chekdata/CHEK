'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { FollowStatusDTO } from '@/lib/api-types';
import { clientFetch } from '@/lib/client-api';
import { getToken } from '@/lib/token';
import { readCurrentUserProfile } from '@/lib/user-display';

export function FollowButton({
  targetUserOneId,
  nextPath,
}: {
  targetUserOneId: string;
  nextPath: string;
}) {
  const router = useRouter();

  const target = String(targetUserOneId || '').trim();
  const selfUserOneId = useMemo(() => readCurrentUserProfile()?.userOneId || '', []);
  const isSelf = !!selfUserOneId && !!target && selfUserOneId === target;

  const [status, setStatus] = useState<FollowStatusDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  async function refresh() {
    if (!target) return;
    setLoading(true);
    try {
      const dto = await clientFetch<FollowStatusDTO>(
        `/api/chek-content/v1/users/${encodeURIComponent(target)}/followStatus`,
        { method: 'GET', auth: true }
      );
      setStatus(dto || null);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  if (!target || isSelf) return null;

  const following = status?.following === true;

  async function toggle() {
    if (pending) return;
    if (!getToken()) {
      router.push(`/auth/login?next=${encodeURIComponent(nextPath || '/')}`);
      return;
    }
    setPending(true);
    try {
      await clientFetch(`/api/chek-content/v1/users/${encodeURIComponent(target)}/follow`, {
        method: following ? 'DELETE' : 'POST',
        auth: true,
      });
      await refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      className={following ? 'chek-chip gray' : 'chek-chip'}
      style={{ border: 'none', cursor: 'pointer', height: 32, opacity: loading ? 0.75 : 1 }}
      onClick={toggle}
      disabled={loading || pending}
    >
      {loading ? '加载…' : following ? '已关注' : '关注'}
    </button>
  );
}


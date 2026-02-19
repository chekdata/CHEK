'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { clientFetch } from '@/lib/client-api';
import type { PostDTO } from '@/lib/api-types';
import { clearToken, getToken } from '@/lib/token';
import { resolveDisplayName, saveCurrentUserProfile } from '@/lib/user-display';
import { SkeletonBlock, SkeletonLines } from '@/components/Skeleton';

type UserInfo = {
  userOneId?: string;
  nickName?: string;
  userName?: string;
  avatarUrl?: string;
  mobilePhone?: string;
  followCount?: number;
  followerCount?: number;
  likedAndFavoriteCount?: number;
  likedAndFavoritedCount?: number;
  likedAndCollectedCount?: number;
  likedCount?: number;
  favoriteCount?: number;
};

function safeNumber(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function readCount(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function formatCount(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}w`;
  return String(n);
}

function snippetFromBody(body: string): string {
  const s = String(body || '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/[#>*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return s.length > 56 ? `${s.slice(0, 56)}…` : s;
}

function cardHeight(seed: number): number {
  const heights = [160, 220, 180, 200];
  return heights[Math.abs(seed) % heights.length]!;
}

export default function MePage() {
  const [token, setTokenState] = useState(() => getToken());
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [posts, setPosts] = useState<PostDTO[]>([]);

  useEffect(() => {
    let canceled = false;

    async function run() {
      setLoading(true);
      try {
        let currentUser: UserInfo | null = null;
        if (token) {
          currentUser = await clientFetch<UserInfo>('/api/auth/v1/userInfo', {
            method: 'GET',
            auth: true,
          });
          saveCurrentUserProfile(currentUser);
        }

        if (canceled) return;
        setUser(currentUser);

        const authorUserOneId = String(currentUser?.userOneId || '').trim();
        const listPath = authorUserOneId
          ? `/api/chek-content/v1/posts?authorUserOneId=${encodeURIComponent(authorUserOneId)}&limit=30`
          : '/api/chek-content/v1/posts?limit=20';

        const list = await clientFetch<PostDTO[]>(listPath, { method: 'GET' });
        if (!canceled) setPosts(Array.isArray(list) ? list : []);
      } catch {
        if (!canceled) {
          setUser(null);
          setPosts([]);
        }
      } finally {
        if (!canceled) setLoading(false);
      }
    }

    run();
    return () => {
      canceled = true;
    };
  }, [token]);

  const stats = useMemo(() => {
    const attention = readCount(user?.followCount);
    const fans = readCount(user?.followerCount);
    const likedAndFavorite =
      readCount(user?.likedAndFavoriteCount) ??
      readCount(user?.likedAndFavoritedCount) ??
      readCount(user?.likedAndCollectedCount) ??
      (user?.likedCount !== undefined || user?.favoriteCount !== undefined
        ? safeNumber(user?.likedCount) + safeNumber(user?.favoriteCount)
        : null);

    return {
      attention,
      fans,
      likedAndFavorite,
    };
  }, [user]);

  const displayName = resolveDisplayName(
    {
      userOneId: user?.userOneId,
      nickName: user?.nickName,
      userName: user?.userName,
    },
    token ? '胶己用户' : '游客'
  );
  const userId = user?.userOneId?.trim() || '未登录';
  const bio = token
    ? '来了就是胶己人。相辅里分享真实经验，少踩坑，多帮人。'
    : '欢迎你来潮汕。先随便逛逛也行，登录后可发相辅和评论。';

  return (
    <>
      <div className="chek-me-scroll">
        <div className="chek-me-topbar">
          <Link href="/settings" className="chek-me-icon-btn" aria-label="设置菜单">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </Link>

          <Link href="/legal" className="chek-me-icon-btn" aria-label="协议与说明">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <circle cx="12" cy="16" r="1" />
            </svg>
          </Link>
        </div>

        <section className="chek-me-profile">
          <div className="chek-me-profile-row">
            <div className="chek-me-avatar-wrap">
              {loading ? (
                <SkeletonBlock width={86} height={86} radius="50%" className="chek-me-avatar" />
              ) : user?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="chek-me-avatar" src={user.avatarUrl} alt="头像" />
              ) : (
                <div className="chek-me-avatar" aria-hidden />
              )}
              <div className="chek-me-level">LV.1</div>
            </div>

            <div className="chek-me-stats">
              <div className="chek-me-stat-item">
                <div className="chek-me-stat-num">
                  {loading ? (
                    <SkeletonBlock width={38} height={18} radius={10} style={{ margin: '0 auto' }} />
                  ) : stats.attention === null ? (
                    '—'
                  ) : (
                    formatCount(stats.attention)
                  )}
                </div>
                <div className="chek-me-stat-label">关注</div>
              </div>
              <div className="chek-me-stat-item">
                <div className="chek-me-stat-num">
                  {loading ? (
                    <SkeletonBlock width={38} height={18} radius={10} style={{ margin: '0 auto' }} />
                  ) : stats.fans === null ? (
                    '—'
                  ) : (
                    formatCount(stats.fans)
                  )}
                </div>
                <div className="chek-me-stat-label">粉丝</div>
              </div>
              <div className="chek-me-stat-item">
                <div className="chek-me-stat-num">
                  {loading ? (
                    <SkeletonBlock width={38} height={18} radius={10} style={{ margin: '0 auto' }} />
                  ) : stats.likedAndFavorite === null ? (
                    '—'
                  ) : (
                    formatCount(stats.likedAndFavorite)
                  )}
                </div>
                <div className="chek-me-stat-label">获赞与收藏</div>
              </div>
            </div>
          </div>

          {loading ? (
            <>
              <div style={{ display: 'grid', gap: 8 }}>
                <SkeletonBlock width="46%" height={22} radius={12} />
                <SkeletonBlock width="60%" height={16} radius={10} />
                <SkeletonLines lines={2} widths={['88%', '70%']} lineHeight={14} radius={10} />
              </div>

              <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <SkeletonBlock width={62} height={26} radius={999} />
                <SkeletonBlock width={88} height={26} radius={999} />
                <SkeletonBlock width={78} height={26} radius={999} />
              </div>

              <div className="chek-me-actions">
                <SkeletonBlock width="100%" height={42} radius={999} />
                <SkeletonBlock width={42} height={42} radius={999} />
              </div>
            </>
          ) : (
            <>
              <div className="chek-me-name">{displayName}</div>
              <div className="chek-me-id">潮客号：{userId}</div>
              <div className="chek-me-bio">{bio}</div>

              <div className="chek-me-tags">
                <span className="chek-me-tag">胶己</span>
                <span className="chek-me-tag">相辅互助</span>
                <span className="chek-me-tag">潮汕在地</span>
              </div>

              <div className="chek-me-actions">
                {token ? (
                  <Link href="/settings" className="chek-me-btn">
                    编辑资料
                  </Link>
                ) : (
                  <Link href="/auth/login" className="chek-me-btn">
                    去登录
                  </Link>
                )}

                {token ? (
                  <button
                    className="chek-me-icon-pill"
                    type="button"
                    onClick={() => {
                      clearToken();
                      setUser(null);
                      setTokenState('');
                    }}
                    aria-label="退出登录"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                  </button>
                ) : (
                  <Link href="/settings" className="chek-me-icon-pill" aria-label="设置">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                  </Link>
                )}
              </div>
            </>
          )}
        </section>

        <div className="chek-me-sticky-tabs" role="tablist" aria-label="胶己内容导航">
          <button type="button" className="chek-me-tab active" role="tab" aria-selected="true">
            相辅
          </button>
          <Link href="/me/favorites" className="chek-me-tab" role="tab" aria-selected="false">
            收藏
          </Link>
          <button type="button" className="chek-me-tab" role="tab" aria-selected="false" disabled>
            赞过
          </button>
        </div>

        <section className="chek-me-masonry" aria-label="我的相辅">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={`me-loading-${index}`} className="chek-me-post-card" aria-hidden>
                <div className="chek-loading-shimmer" style={{ height: cardHeight(index), borderRadius: 0 }} />
                <div className="chek-me-post-body" style={{ display: 'grid', gap: 8 }}>
                  <SkeletonLines lines={2} widths={['86%', '62%']} lineHeight={12} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <SkeletonBlock width="42%" height={10} radius={8} />
                    <SkeletonBlock width={26} height={10} radius={8} />
                  </div>
                </div>
              </div>
            ))
          ) : posts.length > 0 ? (
            posts.map((post, index) => {
              const seed = Number(post.postId || 0) + index;
              const height = cardHeight(seed);
              const title = post.title?.trim() || snippetFromBody(post.body) || '这条相辅还没写标题';
              return (
                <Link key={post.postId} href={`/p/${post.postId}`} className="chek-me-post-card">
                  <div className="chek-me-post-media" style={{ height }}>
                    <span>相辅</span>
                  </div>

                  <div className="chek-me-post-body">
                    <div className="chek-me-post-title">{title}</div>
                    <div className="chek-me-post-foot">
                      <div className="chek-me-mini-user">
                        <span className="chek-me-mini-avatar" aria-hidden />
                        <span>{displayName}</span>
                      </div>
                      <div className="chek-me-mini-like">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                        {post.commentCount > 0 ? post.commentCount : 0}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="chek-me-empty-card">
              <div className="chek-me-empty-title">还没有相辅</div>
              <div className="chek-muted" style={{ lineHeight: 1.7 }}>
                {token ? '你还没发过相辅，来发第一条吧。' : '欢迎你来潮汕。登录后可发相辅、评论。'}
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
                <Link href={token ? '/post/new' : '/auth/login?next=/me'} className="chek-chip">
                  {token ? '+ 来相辅' : '去登录'}
                </Link>
                <Link href="/feed" className="chek-chip gray">
                  去相辅
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

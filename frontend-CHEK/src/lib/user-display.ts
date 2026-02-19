export type UserIdentity = {
  userOneId?: string | null;
  nickName?: string | null;
  userName?: string | null;
  avatarUrl?: string | null;
};

const LS_PROFILE_KEY = 'chek.user_profile.v1';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MACHINE_ID_RE = /^(ckid_|wx_unionid:|wxmini_openid:)/i;

function clean(v: unknown): string {
  return String(v || '').trim();
}

function looksLikeMachineId(v: string): boolean {
  if (!v) return false;
  if (UUID_RE.test(v)) return true;
  if (MACHINE_ID_RE.test(v)) return true;
  if (v.length >= 20 && /^[a-z0-9:_-]+$/i.test(v)) return true;
  return false;
}

export function formatUserOneIdForDisplay(userOneId?: string | null, fallback = '游客'): string {
  const uid = clean(userOneId);
  if (!uid) return fallback;
  if (!looksLikeMachineId(uid) && uid.length <= 12) return uid;
  return `胶己·${uid.slice(-6)}`;
}

export function resolveDisplayName(identity?: UserIdentity | null, fallback = '游客'): string {
  const nickName = clean(identity?.nickName);
  if (nickName) return nickName;
  const userName = clean(identity?.userName);
  if (userName) return userName;
  return formatUserOneIdForDisplay(identity?.userOneId, fallback);
}

export function saveCurrentUserProfile(identity?: UserIdentity | null) {
  if (typeof window === 'undefined') return;
  try {
    const userOneId = clean(identity?.userOneId);
    if (!userOneId) return;
    const payload: UserIdentity = {
      userOneId,
      nickName: clean(identity?.nickName),
      userName: clean(identity?.userName),
      avatarUrl: clean(identity?.avatarUrl),
    };
    window.localStorage.setItem(LS_PROFILE_KEY, JSON.stringify(payload));
  } catch {}
}

export function readCurrentUserProfile(): UserIdentity | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LS_PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserIdentity;
    const userOneId = clean(parsed?.userOneId);
    if (!userOneId) return null;
    return {
      userOneId,
      nickName: clean(parsed?.nickName),
      userName: clean(parsed?.userName),
      avatarUrl: clean(parsed?.avatarUrl),
    };
  } catch {
    return null;
  }
}

export function clearCurrentUserProfile() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(LS_PROFILE_KEY);
  } catch {}
}

export function resolveAuthorDisplayName(authorUserOneId?: string | null, fallback = '游客'): string {
  const uid = clean(authorUserOneId);
  if (!uid) return fallback;
  const current = readCurrentUserProfile();
  if (current?.userOneId === uid) {
    return resolveDisplayName(current, fallback);
  }
  return formatUserOneIdForDisplay(uid, fallback);
}

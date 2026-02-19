const SS_WX_STATE = 'chek.wx_oauth_state';
const SS_WX_NEXT = 'chek.wx_oauth_next';
const SS_WX_AT = 'chek.wx_oauth_at';

function basePathFromEnv(): string {
  const raw = String(process.env.NEXT_PUBLIC_CHEK_BASE_PATH || '').trim();
  const base = raw && raw !== '/' ? raw.replace(/\/+$/, '') : '';
  return base;
}

export function withPublicBasePath(path: string): string {
  const base = basePathFromEnv();
  if (!base) return path;
  if (!path.startsWith('/')) return `${base}/${path}`;
  if (path === base) return path;
  if (path.startsWith(base + '/')) return path;
  return `${base}${path}`;
}

export function isWeChatBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  return /MicroMessenger/i.test(String(window.navigator?.userAgent || ''));
}

export function sanitizeNext(next: string | null | undefined): string {
  const raw = String(next || '').trim();
  if (!raw) return '/feed';
  if (!raw.startsWith('/')) return '/feed';
  if (raw.startsWith('//')) return '/feed';
  return raw;
}

function makeState(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `chek_${crypto.randomUUID()}`;
    }
  } catch {}
  return `chek_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export function storeWechatOauthAttempt(next: string): string {
  const state = makeState();
  if (typeof window === 'undefined') return state;
  try {
    window.sessionStorage.setItem(SS_WX_STATE, state);
    window.sessionStorage.setItem(SS_WX_NEXT, sanitizeNext(next));
    window.sessionStorage.setItem(SS_WX_AT, String(Date.now()));
  } catch {}
  return state;
}

export function consumeWechatOauthAttempt(stateFromQuery: string | null): { ok: boolean; next: string } {
  const fallback = { ok: false, next: '/feed' };
  if (typeof window === 'undefined') return fallback;
  try {
    const storedState = window.sessionStorage.getItem(SS_WX_STATE) || '';
    const next = sanitizeNext(window.sessionStorage.getItem(SS_WX_NEXT) || '/feed');
    window.sessionStorage.removeItem(SS_WX_STATE);
    window.sessionStorage.removeItem(SS_WX_NEXT);
    window.sessionStorage.removeItem(SS_WX_AT);
    if (!storedState) return { ok: false, next };
    if (!stateFromQuery) return { ok: false, next };
    if (String(stateFromQuery).trim() !== storedState) return { ok: false, next };
    return { ok: true, next };
  } catch {
    return fallback;
  }
}

export function buildWechatOAuthUrl(args: { appId: string; redirectUri: string; state: string }): string {
  const appId = String(args.appId || '').trim();
  if (!appId) throw new Error('未配置微信 AppID');

  const redirectUri = String(args.redirectUri || '').trim();
  if (!redirectUri) throw new Error('缺少 redirectUri');

  const state = String(args.state || '').trim();
  if (!state) throw new Error('缺少 state');

  if (isWeChatBrowser()) {
    const scope = String(process.env.NEXT_PUBLIC_WECHAT_SCOPE || '').trim() || 'snsapi_userinfo';
    return (
      `https://open.weixin.qq.com/connect/oauth2/authorize` +
      `?appid=${encodeURIComponent(appId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scope)}` +
      `&state=${encodeURIComponent(state)}` +
      `#wechat_redirect`
    );
  }

  // 非微信环境：使用 open platform 的扫码登录（PC 更常用）
  return (
    `https://open.weixin.qq.com/connect/qrconnect` +
    `?appid=${encodeURIComponent(appId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=snsapi_login` +
    `&state=${encodeURIComponent(state)}` +
    `#wechat_redirect`
  );
}

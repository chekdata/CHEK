export const LS_WELCOME_PENDING = 'chek.welcome_pending';
export const LS_HAS_EVER_LOGIN = 'chek.has_ever_login';

export function markWelcomePendingIfFirstLogin() {
  if (typeof window === 'undefined') return;
  try {
    const hasEver = window.localStorage.getItem(LS_HAS_EVER_LOGIN) === '1';
    if (!hasEver) window.localStorage.setItem(LS_WELCOME_PENDING, '1');
    window.localStorage.setItem(LS_HAS_EVER_LOGIN, '1');
  } catch {}
}


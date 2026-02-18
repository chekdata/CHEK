const LS_KEY = 'chek.sid_at';

export function getToken(): string {
  if (typeof window === 'undefined') return '';
  try {
    return String(window.localStorage.getItem(LS_KEY) || '');
  } catch {
    return '';
  }
}

export function setToken(token: string) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LS_KEY, token);
  } catch {}
}

export function clearToken() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(LS_KEY);
  } catch {}
}


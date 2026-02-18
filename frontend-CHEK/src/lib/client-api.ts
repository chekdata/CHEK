'use client';

import { ApiEnvelope } from '@/lib/api-types';
import { getToken } from '@/lib/token';

export async function clientFetch<T>(
  path: string,
  init?: RequestInit & { auth?: boolean }
): Promise<T> {
  const headers = new Headers(init?.headers || {});
  headers.set('Content-Type', headers.get('Content-Type') || 'application/json');

  if (init?.auth) {
    const token = getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(path, { ...init, headers });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const msg = json?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  if (json && typeof json === 'object' && 'success' in json) {
    const env = json as ApiEnvelope<T>;
    if (!env.success) throw new Error(env.message || env.code || '请求失败');
    return env.data;
  }

  return json as T;
}


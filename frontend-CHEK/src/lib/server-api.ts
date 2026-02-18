import { ApiEnvelope } from '@/lib/api-types';
import { getApiBaseUrl } from '@/lib/env';

export async function serverGet<T>(
  path: string,
  opts?: { revalidateSeconds?: number }
): Promise<T | null> {
  const base = getApiBaseUrl();
  const url = `${base}${path.startsWith('/') ? '' : '/'}${path}`;

  try {
    const res = await fetch(url, {
      next: {
        revalidate: opts?.revalidateSeconds ?? 60,
      },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as ApiEnvelope<T>;
    if (json && (json as any).success === true) return json.data;
    return null;
  } catch {
    return null;
  }
}


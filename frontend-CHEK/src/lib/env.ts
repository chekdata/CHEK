export function getApiBaseUrl(): string {
  const raw = process.env.CHEK_API_BASE_URL || 'https://api-dev.chekkk.com';
  return raw.replace(/\/+$/, '');
}


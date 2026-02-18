/** @type {import('next').NextConfig} */
const rawBasePath = String(process.env.CHEK_BASE_PATH || '').trim();
const basePath = rawBasePath && rawBasePath !== '/' ? rawBasePath.replace(/\/+$/, '') : '';

const nextConfig = {
  output: 'standalone',
  basePath: basePath || undefined,
  reactStrictMode: true,
  async rewrites() {
    const apiBase = process.env.CHEK_API_BASE_URL || 'https://api-dev.chekkk.com';
    return [
      {
        source: '/api/:path*',
        destination: `${apiBase.replace(/\/+$/, '')}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

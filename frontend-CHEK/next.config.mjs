/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const apiBase = process.env.CHEK_API_BASE_URL || 'https://api-dev.chekkk.com';
    return [
      {
        source: '/api/:path*',
        destination: `${apiBase.replace(/\\/+$/, '')}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;


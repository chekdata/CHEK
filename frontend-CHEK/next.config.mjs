/** @type {import('next').NextConfig} */
const rawBasePath = String(process.env.CHEK_BASE_PATH || '').trim();
const basePath = rawBasePath && rawBasePath !== '/' ? rawBasePath.replace(/\/+$/, '') : '';

const nextConfig = {
  output: 'standalone',
  basePath: basePath || undefined,
  reactStrictMode: true,
};

export default nextConfig;

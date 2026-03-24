/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@via/shared'],
  experimental: { typedRoutes: true },
};

export default nextConfig;

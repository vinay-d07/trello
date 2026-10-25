import type { NextConfig } from 'next';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@taskflow/shared'],
  // Linting runs once from the repo root (`npm run lint`), not again inside `next build`.
  eslint: { ignoreDuringBuilds: true },
  // Proxy REST calls so the browser sees one origin: cookies stay first-party and there is no CORS.
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_URL}/api/:path*` }];
  },
};

export default nextConfig;

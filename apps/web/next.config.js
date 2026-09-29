/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@ondigo/shared'],
  reactStrictMode: true,
  // `next build` and `next dev` share .next by default; building while the dev
  // server runs corrupts its chunk manifests (404s, no hydration). Local builds
  // go to .next-build; Vercel leaves the variable unset and uses .next.
  distDir: process.env.NEXT_DIST_DIR || '.next',
};

module.exports = nextConfig;

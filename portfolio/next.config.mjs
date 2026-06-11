/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export so the site deploys to GitHub Pages with no server.
  output: 'export',
  // GitHub Pages serves project sites under /<repo>/ — set at build time:
  //   PAGES_BASE_PATH=/Programming npm run build
  // Local dev (`npm run dev`) leaves this empty so everything serves from /.
  basePath: process.env.PAGES_BASE_PATH ?? '',
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;

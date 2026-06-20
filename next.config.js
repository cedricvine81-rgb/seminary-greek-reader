/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
    // The Phrase Explorer's per-book trees are fetched client-side as static assets
    // (served from the CDN), never read by server code. reader.ts reads public/data
    // via fs, which makes Next trace the whole folder into every serverless function;
    // exclude the phrase-tree data so it doesn't bloat the function bundle (250MB cap).
    outputFileTracingExcludes: {
      '*': ['public/data/phrase-tree/**'],
    },
  },
  images: {
    remotePatterns: [],
  },
}

module.exports = nextConfig

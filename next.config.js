/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
    // The Phrase Explorer's per-book trees and the verse-by-verse commentary are
    // fetched client-side as static assets (served from the CDN), never read by
    // server code. reader.ts reads public/data via fs with a dynamic path, which
    // makes Next trace the whole folder into every serverless function; exclude
    // these so they don't bloat the function bundle (250MB cap).
    outputFileTracingExcludes: {
      '*': ['public/data/phrase-tree/**', 'public/data/commentary/**'],
    },
  },
  images: {
    remotePatterns: [],
  },
  // The standalone Phrase tool was folded into the Exegesis page (Phrasing tab).
  async redirects() {
    return [
      { source: '/phrase', destination: '/exegesis', permanent: false },
      // Browsers and crawlers blindly probe these legacy favicon paths; point them at
      // the real icon so they resolve to a 200 instead of cluttering logs with 404s.
      { source: '/favicon.ico', destination: '/icon.svg', permanent: false },
      { source: '/favicon.png', destination: '/icon.svg', permanent: false },
    ]
  },
}

module.exports = nextConfig

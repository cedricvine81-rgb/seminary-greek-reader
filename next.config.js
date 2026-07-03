/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
    // The Phrase Explorer's per-book trees and the verse-by-verse commentary are
    // fetched client-side as static assets (served from the CDN), never read by
    // server code, so they can never end up in a function bundle regardless.
    // gnt/lxx/na1904 ARE read server-side (src/lib/reader.ts, for /api/reader's
    // lexicon-enriched response), but only via a dynamic path — Next's tracer can't
    // tell which files that might touch, so it conservatively bundles the whole
    // directory into every function that imports reader.ts. Together those three
    // corpora run past 200MB, which blew through Vercel's 250MB uncompressed
    // function-size limit. reader.ts now fetches them from this deployment's own
    // static assets in production instead of reading via fs (see readCorpusFile),
    // so excluding them here is both safe and necessary to keep them out of the
    // bundle at all.
    outputFileTracingExcludes: {
      '*': [
        'public/data/phrase-tree/**',
        'public/data/commentary/**',
        'public/data/gnt/**',
        'public/data/lxx/**',
        'public/data/na1904/**',
      ],
    },
  },
  images: {
    remotePatterns: [],
  },
  // The standalone Phrase tool and Texts library were folded into the Exegesis page
  // (Phrasing / Texts tabs).
  async redirects() {
    return [
      { source: '/phrase', destination: '/exegesis', permanent: false },
      { source: '/texts', destination: '/exegesis', permanent: false },
      // Browsers and crawlers blindly probe these legacy favicon paths; point them at
      // the real icon so they resolve to a 200 instead of cluttering logs with 404s.
      { source: '/favicon.ico', destination: '/icon.svg', permanent: false },
      { source: '/favicon.png', destination: '/icon.svg', permanent: false },
    ]
  },
}

module.exports = nextConfig

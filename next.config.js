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
        'public/data/mt/**',
        // Macula Hebrew syntax is fetched client-side (per book) only.
        'public/data/macula-hebrew/**',
        // Translation search indexes are fetched from this deployment's static assets in
        // production (src/lib/translation-search.ts), so keep them out of the bundle too.
        'public/data/search-index-*.json.gz',
        // Same for the background-sources search indexes (src/lib/backgrounds-search.ts).
        'public/data/backgrounds-search-*.json.gz',
        // The Texts/Backgrounds prose corpora (Greco-Roman, Josephus, Philo, church
        // fathers, targums, variants, …) are ALL fetched client-side as static assets
        // via their `dataUrl` (see src/lib/prose-texts.ts / texts-catalog.ts and
        // VariantsView) — no server route reads them via fs. They only end up in the
        // bundle because reader.ts does a dynamic fs.readFileSync under public/data, so
        // Next's tracer conservatively pulls in the whole tree. Adding the Greco-Roman
        // batch (Dio/Aratus/Philostratus) grew this past Vercel's 250MB uncompressed
        // function limit (the api/.../course-notes function hit 252.74MB, failing every
        // Production build from that commit on). Excluding them is safe and necessary.
        'public/data/greco/**',
        'public/data/quintilian/**',
        'public/data/josephus/**',
        'public/data/philo/**',
        'public/data/variants/**',
        'public/data/eusebius/**',
        'public/data/clement/**',
        'public/data/justin/**',
        'public/data/pseudepigrapha/**',
        'public/data/pseudepigrapha-b/**',
        'public/data/apostolic-fathers/**',
        'public/data/targums/**',
        'public/data/anf/**',
        'public/data/mishnah/**',
        'public/data/apocrypha/**',
        'public/data/apocrypha-gospels/**',
        'public/data/brenton/**',
        'public/data/rhetoric/**',
        // The Jerusalem Talmud (client-fetched via its dataUrl, like every prose corpus).
        // NB: every NEW public/data directory must be added here unless server code
        // fs-reads it — reader.ts's dynamic read pulls the whole tree into every function
        // otherwise. Forgetting this list is how /api/reader's cold start reached 68
        // seconds (measured 2026-07-30): these client-only files below were riding along
        // in every server bundle.
        'public/data/yerushalmi/**',
        'public/data/bavli/**',
        'public/data/tosefta/**',
        // Jastrow's dictionary is fetched by the Talmud reader only (src/lib/jastrow.ts).
        'public/data/jastrow.json',
        // Reader syntax layers — SyntaxMenu/GreekReader fetch them client-side.
        'public/data/abs-syntax.json',
        'public/data/gbi.json',
        'public/data/syntax.json',
        'public/data/macula-syntax.json',
        // ParsingPanel lexica — client-fetched.
        'public/data/lsj.json',
        'public/data/greek-lexicon.json',
        // Client-fetched alignment/overview data (TextsReader, Synopsis, Backgrounds).
        'public/data/bsb-alignment.json',
        'public/data/backgrounds-crossrefs.json',
        'public/data/pericopes.json',
        'public/data/nt-parallels.json',
        'public/data/gospel-parallels.json',
      ],
    },
  },
  images: {
    remotePatterns: [],
  },
  // The standalone Phrase tool was folded into the Exegesis page (Phrasing tab). Texts, by
  // contrast, is now its OWN top-level page (/texts) + header nav item again, so it is NOT
  // redirected here — see src/app/texts/page.tsx.
  async redirects() {
    return [
      { source: '/phrase', destination: '/exegesis', permanent: false },
      // The Morphology page became the Grammar page (it covers syntax too).
      { source: '/morphology', destination: '/grammar', permanent: true },
      // Browsers and crawlers blindly probe these legacy favicon paths; point them at
      // the real icon so they resolve to a 200 instead of cluttering logs with 404s.
      { source: '/favicon.ico', destination: '/icon.svg', permanent: false },
      { source: '/favicon.png', destination: '/icon.svg', permanent: false },
    ]
  },
  // Baseline security headers. Deliberately NO Content-Security-Policy here — a CSP
  // must be scoped against Paddle.js / Supabase / fonts and tested before enabling,
  // so it's handled separately. None of these affect what resources the app loads.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

module.exports = nextConfig

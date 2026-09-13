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
        // Same for the background-sources search indexes (src/lib/backgrounds-search.ts),
        // now sharded per collection under backgrounds-search/<lang>/<category>.json.gz.
        'public/data/backgrounds-search/**',
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
        'public/data/fathers/**',
        'public/data/places/**',
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
  // Baseline security headers, plus the Content-Security-Policy in REPORT-ONLY mode.
  //
  // The CSP names every place a page may load or run content from; the browser refuses the
  // rest. Report-Only means nothing is blocked yet — browsers POST would-be violations to
  // /api/csp-report (rows land in ErrorLog, scope 'csp-report'). After a quiet week of real
  // classroom traffic, rename the key to 'Content-Security-Policy' and it becomes binding.
  //
  // The origin inventory (2026-09-13, audited from src/):
  //   fonts.googleapis.com / fonts.gstatic.com — the three reading faces in layout.tsx
  //   *.paddle.com — cdn.paddle.com serves paddle.js; the checkout overlay iframes and its
  //     API calls use sibling subdomains (buy., checkout-service., …), so the wildcard
  //   NEXT_PUBLIC_SUPABASE_URL — FileManager uploads straight to Storage signed URLs
  // Everything else external in the codebase is server-side (bolls.life, getbible.net,
  // resend) or a plain hyperlink (Perseus, Sefaria attributions) — neither needs a grant.
  //
  // script-src carries 'unsafe-inline' for Next's own bootstrap inline scripts. The stricter
  // per-request-nonce setup is a later tightening (it needs middleware to mint the nonce);
  // even without it, this policy closes external script origins, exfiltration targets
  // (connect-src), rogue frames, plugins (object-src) and <base> hijacks.
  async headers() {
    const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://*.paddle.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.paddle.com",
      `connect-src 'self' https://*.paddle.com${supabase ? ' ' + supabase : ''}`,
      "frame-src https://*.paddle.com",
      "media-src 'self' blob:",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      'report-uri /api/csp-report',
    ].join('; ')
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy-Report-Only', value: csp },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        // The corpus under public/data is build-time content: chapters, lexicons, morphology,
        // search indexes. Next serves public/ with `max-age=0`, so every page load revalidated
        // every file it touches — a reader opening one chapter conditionally re-requests the
        // lexicon, the syntax trees, the gloss table and the rest, and gets a stack of 304s for
        // its trouble. That is a round trip per file per page load, and at any scale it is the
        // largest source of edge requests in the app.
        //
        // An hour of freshness is the trade: within a browsing session there are no revalidation
        // requests at all, and a corpus fix published today reaches a reader on their next load
        // after the hour (stale-while-revalidate hands them the cached copy immediately and
        // refreshes in the background, so they never wait for it). Nothing here is user data —
        // uploads live in Supabase Storage and are not served from this path.
        source: '/data/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
        ],
      },
    ]
  },
}

module.exports = nextConfig

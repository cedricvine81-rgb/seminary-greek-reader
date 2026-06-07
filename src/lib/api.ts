import { NextRequest, NextResponse } from 'next/server'

type Handler = (req: NextRequest, ctx?: { params: Record<string, string> }) => Promise<NextResponse>

/** Wraps a route handler with consistent try/catch and error logging. */
export function withErrorHandling(handler: Handler): Handler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[${req.method} ${req.nextUrl.pathname}]`, message)
      return NextResponse.json({ error: 'Server error.' }, { status: 500 })
    }
  }
}

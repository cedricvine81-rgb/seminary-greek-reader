import { NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { logError } from '@/lib/logger'

// "Send me a test email" — proves the Resend configuration end-to-end the moment the env
// vars are set, instead of finding out from a notification that silently never arrived.
// Admin-only; sends to the signed-in admin's own address, never to input from the request.
export async function POST() {
  try {
    const token = getTokenFromCookies()
    const payload = token ? verifyToken(token) : null
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
      return NextResponse.json({
        error: 'Email is not configured: set RESEND_API_KEY and EMAIL_FROM in Vercel, then redeploy.',
      }, { status: 400 })
    }
    const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { email: true } })
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { sent } = await sendEmail({
      to: [user.email],
      subject: 'Seminary Greek — test email',
      html: '<p>Email is configured correctly. This test was sent from the admin Notifications page.</p>',
      text: 'Email is configured correctly. This test was sent from the admin Notifications page.',
    })
    if (!sent) {
      return NextResponse.json({ error: 'Send failed — check the Errors page for the Resend response.' }, { status: 502 })
    }
    return NextResponse.json({ ok: true, to: user.email })
  } catch (err) {
    logError('POST /api/admin/test-email', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}

import { logError, logWarn } from './logger'

/**
 * Minimal transactional-email sender.
 *
 * The app has no long-lived mail server; this posts to Resend's REST API with a plain
 * `fetch`, so there's no npm dependency to add. It stays DORMANT until configured: if
 * RESEND_API_KEY or EMAIL_FROM is missing, it logs and returns without sending, so
 * callers never fail because email isn't set up yet. To turn it on, set both env vars
 * in Vercel (and verify the EMAIL_FROM domain in Resend):
 *
 *   RESEND_API_KEY=re_xxx
 *   EMAIL_FROM="Seminary Greek <noreply@seminarygreek.app>"
 *
 * Swapping providers (SMTP, SES, etc.) later means changing only this file.
 */
/**
 * Whether email can actually leave the building.
 *
 * sendEmail() deliberately no-ops when the keys are absent so no caller ever fails because
 * email is not set up. That is right for a notification and wrong for a flow whose ONLY output
 * is the message — a password reset that silently sends nothing tells the student to check an
 * inbox that will stay empty, which is worse than not offering the link. Surfaces that state
 * so the UI can say what is true instead.
 */
export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)
}

export async function sendEmail(opts: {
  to: string[]
  subject: string
  html: string
  text?: string
}): Promise<{ sent: boolean }> {
  const to = opts.to.map(e => e.trim()).filter(Boolean)
  if (to.length === 0) return { sent: false }

  const key = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  if (!key || !from) {
    // Not configured yet — never block the caller; just record that we skipped.
    logWarn('email skipped: RESEND_API_KEY / EMAIL_FROM not set', { subject: opts.subject, to })
    return { sent: false }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject: opts.subject, html: opts.html, text: opts.text }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      logError('email send failed', new Error(`Resend ${res.status}: ${body}`), { subject: opts.subject })
      return { sent: false }
    }
    return { sent: true }
  } catch (err) {
    logError('email send error', err, { subject: opts.subject })
    return { sent: false }
  }
}

/** Escape user-supplied text before interpolating it into an HTML email body. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

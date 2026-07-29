import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { getPayload } from '@/lib/auth'
import { requireStudentAccess } from '@/lib/subscription'
import { saveMyContribution, attestMyContribution, submitMyContribution, reopenMyContribution } from '@/lib/group-presentations'

// POST { action: 'save' | 'attest' | 'submit' | 'reopen', body?, aiDeclaration? } — a
// student's action on their OWN section of their group's presentation. 'submit' and
// 'reopen' affect only the caller's section, never a teammate's. All membership/deadline
// checks live in the lib.
export async function POST(req: NextRequest, { params }: { params: { groupId: string } }) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const gate = await requireStudentAccess(payload); if (gate) return gate
    const b = await req.json()

    switch (b.action) {
      case 'save': {
        await saveMyContribution(payload.sub, params.groupId, { body: b.body, aiDeclaration: b.aiDeclaration })
        return NextResponse.json({ ok: true })
      }
      case 'attest': {
        const c = await attestMyContribution(payload.sub, params.groupId)
        return NextResponse.json({ attestedAt: c.attestedAt })
      }
      case 'submit': {
        const c = await submitMyContribution(payload.sub, params.groupId)
        return NextResponse.json({ submittedAt: c.submittedAt })
      }
      case 'reopen': {
        const c = await reopenMyContribution(payload.sub, params.groupId)
        return NextResponse.json({ submittedAt: c.submittedAt })
      }
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (err) {
    // Membership/deadline/attestation errors are expected user-facing messages.
    const msg = err instanceof Error ? err.message : 'Server error.'
    const expected = ['Presentation not found', 'Not a member of this group', 'Not enrolled', 'You have already submitted your section', 'Not submitted', 'Add your AI/sources statement before signing', 'The deadline has passed. Ask your instructor to approve a late submission.', 'The deadline has passed. Ask your instructor to reopen it.']
    if (expected.includes(msg)) return NextResponse.json({ error: msg }, { status: 400 })
    logError('api/group-presentations/[groupId] POST', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

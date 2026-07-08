import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { getPayload } from '@/lib/auth'
import { requireStudentAccess } from '@/lib/subscription'
import { saveMyContribution, attestMyContribution, submitGroupPresentation, reopenMyGroupSubmission } from '@/lib/group-presentations'

// POST { action: 'save' | 'attest' | 'submit', body?, aiDeclaration? } — a student's
// action on their group's presentation. All membership/deadline checks live in the lib.
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
        const s = await submitGroupPresentation(payload.sub, params.groupId)
        return NextResponse.json({ submittedAt: s.submittedAt })
      }
      case 'reopen': {
        const s = await reopenMyGroupSubmission(payload.sub, params.groupId)
        return NextResponse.json({ submittedAt: s.submittedAt })
      }
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (err) {
    // Membership/deadline/attestation errors are expected user-facing messages.
    const msg = err instanceof Error ? err.message : 'Server error.'
    const expected = ['Presentation not found', 'Not a member of this group', 'Not enrolled', 'Already submitted', 'Not submitted', 'Add your AI/sources statement before signing', 'The deadline has passed. Ask your instructor to approve a late submission.', 'The deadline has passed. Ask your instructor to reopen it.']
    if (expected.includes(msg)) return NextResponse.json({ error: msg }, { status: 400 })
    logError('api/group-presentations/[groupId] POST', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

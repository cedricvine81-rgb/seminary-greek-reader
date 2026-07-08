import { NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { getPayload } from '@/lib/auth'
import { requireStudentAccess } from '@/lib/subscription'
import { getGroupPresentationsForStudent } from '@/lib/group-presentations'

// GET: the signed-in student's Group Presentations (their group, their section, teammates'
// sections, submission status, deadline).
export async function GET() {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const gate = await requireStudentAccess(payload); if (gate) return gate
    return NextResponse.json({ entries: await getGroupPresentationsForStudent(payload.sub) })
  } catch (err) {
    logError('api/group-presentations GET', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

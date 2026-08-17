// End-to-end smoke test of the signed-in golden paths, using the standing TEST accounts
// (scripts/seed-test-accounts.mjs; credentials in .tmp/test-credentials.txt).
//
//   node scripts/smoke.mjs                        # against http://localhost:3000
//   node scripts/smoke.mjs https://seminarygreek.app
//
// This exists because every "I couldn't verify that — it's auth-gated" in the project's
// history was this script not existing yet. It signs in as the test student and the test
// instructor and walks the surfaces students hit in week one, failing loudly on anything
// that isn't a 200 with the content it should have.
import { readFileSync } from 'node:fs'

const BASE = process.argv[2] ?? 'http://localhost:3000'
const creds = readFileSync('.tmp/test-credentials.txt', 'utf8')
const line = role => creds.split('\n').find(l => l.startsWith(role))
const [, EMAIL_I, PW_I] = line('instructor').split(/\s+/)
const [, EMAIL_S, PW_S] = line('student').split(/\s+/)

let failures = 0
function report(ok, label, detail = '') {
  console.log(`${ok ? '  ok ' : 'FAIL '} ${label}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failures++
}

async function signin(email, password) {
  const res = await fetch(`${BASE}/api/auth`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'signin', email, password }),
  })
  const cookie = res.headers.getSetCookie?.().find(c => c.startsWith('sg_token=')) ?? ''
  report(res.ok && !!cookie, `sign in as ${email}`, res.ok ? '' : `status ${res.status}`)
  return cookie.split(';')[0]
}

async function check(cookie, path, mustContain, label) {
  try {
    const res = await fetch(`${BASE}${path}`, { headers: { cookie }, redirect: 'manual' })
    const body = res.status === 200 ? await res.text() : ''
    const ok = res.status === 200 && (!mustContain || body.includes(mustContain))
    report(ok, label ?? path, ok ? '' : `status ${res.status}${res.status === 200 ? `, missing "${mustContain}"` : ''}`)
    return body
  } catch (err) {
    report(false, label ?? path, String(err))
    return ''
  }
}

console.log(`Smoke test against ${BASE}\n— student —`)
const sc = await signin(EMAIL_S, PW_S)
await check(sc, '/student', 'TEST — Sandbox', 'student dashboard shows the sandbox course')
await check(sc, '/student/scores', null, 'grades page renders')
await check(sc, '/student/assignments', null, 'assignments list renders')
const hw = await fetch(`${BASE}/api/grammar-homework?chapter=prepositions`, { headers: { cookie: sc } })
report(hw.ok && (await hw.json()).role === 'student', 'grammar-homework API answers as student')

console.log('— instructor —')
const ic = await signin(EMAIL_I, PW_I)
await check(ic, '/instructor', 'TEST — Sandbox', 'instructor dashboard shows the sandbox course')
const ihw = await fetch(`${BASE}/api/grammar-homework?chapter=prepositions`, { headers: { cookie: ic } })
const ibody = ihw.ok ? await ihw.json() : {}
report(ihw.ok && ibody.role === 'instructor' && Array.isArray(ibody.sets) && ibody.sets.length > 0,
  'activation panel API lists homework sets', `sets=${ibody.sets?.length ?? 'none'}`)

console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} FAILURES`)
process.exit(failures === 0 ? 0 : 1)

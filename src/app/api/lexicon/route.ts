import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { logError } from '@/lib/logger'

// Strong's Greek lexicon, keyed by number: { [num]: { lemma, def, kjv } }.
let _strongs: Record<string, { lemma: string; def: string; kjv: string }> | null = null
function getStrongs() {
  if (_strongs) return _strongs
  try {
    _strongs = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'data', 'strongs-greek.json'), 'utf8'))
  } catch {
    _strongs = {}
  }
  return _strongs!
}

// GET /api/lexicon?strongs=976  → the Strong's lexical entry for that number.
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('strongs')
  if (!raw) return NextResponse.json({ error: 'Missing strongs' }, { status: 400 })
  const num = String(raw).replace(/^g/i, '').replace(/^0+/, '').trim()
  try {
    // strongs-greek.json is keyed "G<number>" (e.g. "G976").
    const s = getStrongs()
    const entry = s[`G${num}`] ?? s[num] ?? null
    return NextResponse.json({ strongs: num, entry })
  } catch (err) {
    logError('api/lexicon', err)
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
  }
}

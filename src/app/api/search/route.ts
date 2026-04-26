import { NextRequest, NextResponse } from 'next/server'
import { searchByGreekWord, searchByReference, type SearchCorpus } from '@/lib/search'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const q = searchParams.get('q')
  const type = searchParams.get('type') as 'word' | 'reference'
  const corpus = (searchParams.get('corpus') ?? 'BOTH') as SearchCorpus

  if (!q) return NextResponse.json({ error: 'Missing query' }, { status: 400 })

  try {
    const results = type === 'reference'
      ? await searchByReference(q, corpus)
      : await searchByGreekWord(q, corpus)

    return NextResponse.json({ results })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}

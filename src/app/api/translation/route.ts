import { NextRequest, NextResponse } from 'next/server'

// Standard Protestant book numbers (1-based). Deuterocanonical OSIS IDs
// that don't exist in Protestant Bibles are intentionally omitted.
const OSIS_TO_BOOK: Record<string, number> = {
  // OT
  Gen: 1, Exod: 2, Lev: 3, Num: 4, Deut: 5,
  JoshB: 6, Josh: 6, JudgB: 7, Judg: 7, Ruth: 8,
  '1Sam': 9, '2Sam': 10, '1Kgs': 11, '2Kgs': 12,
  '1Chr': 13, '2Chr': 14, Ezra: 15, Neh: 16,
  Esth: 17, EsthGr: 17, Job: 18, Ps: 19, Prov: 20,
  Eccl: 21, Song: 22, Isa: 23, Jer: 24, Lam: 25,
  Ezek: 26, Dan: 27, DanLXX: 27, Hos: 28, Joel: 29,
  Amos: 30, Obad: 31, Jonah: 32, Mic: 33, Nah: 34,
  Hab: 35, Zeph: 36, Hag: 37, Zech: 38, Mal: 39,
  // NT
  Matt: 40, Mark: 41, Luke: 42, John: 43, Acts: 44,
  Rom: 45, '1Cor': 46, '2Cor': 47, Gal: 48, Eph: 49,
  Phil: 50, Col: 51, '1Thess': 52, '2Thess': 53,
  '1Tim': 54, '2Tim': 55, Titus: 56, Phlm: 57, Heb: 58,
  Jas: 59, '1Pet': 60, '2Pet': 61, '1John': 62, '2John': 63,
  '3John': 64, Jude: 65, Rev: 66,
}

const LANG_TO_TRANSLATION: Record<string, string> = {
  en: 'web',       // World English Bible
  es: 'valera',    // Reina-Valera 1909
  fr: 'ls1910',    // Louis Segond 1910
  pt: 'almeida',   // Almeida Atualizada (closest available to ARC)
  ru: 'synodal',   // Russian Synodal Bible (1876)
  ko: 'korean',    // Korean Revised Version
  zh: 'cut',       // Chinese Union Version (Traditional)
}

// Simple in-memory cache: "translation.bookNr.chapter" → verse map
const _cache = new Map<string, Record<string, string>>()

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const osisId  = searchParams.get('book')
  const chapter = parseInt(searchParams.get('chapter') ?? '', 10)
  const lang    = searchParams.get('lang')

  if (!osisId || isNaN(chapter) || !lang) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  const bookNr = OSIS_TO_BOOK[osisId]
  const translation = LANG_TO_TRANSLATION[lang]

  if (!bookNr || !translation) {
    return NextResponse.json({ verses: {} })
  }

  const cacheKey = `${translation}.${bookNr}.${chapter}`
  if (_cache.has(cacheKey)) {
    return NextResponse.json({ verses: _cache.get(cacheKey) })
  }

  try {
    // Correct subdomain is api.getbible.net; verses field is an array, not a keyed object.
    const url = `https://api.getbible.net/v2/${translation}/${bookNr}/${chapter}.json`
    const res  = await fetch(url, { next: { revalidate: 86400 } })
    if (!res.ok) return NextResponse.json({ verses: {} })

    const data = await res.json()
    // api.getbible.net v2 shape: { verses: [{ chapter, verse, name, text }, ...] }
    const raw: { verse: number; text: string }[] = Array.isArray(data.verses) ? data.verses : []
    const verses: Record<string, string> = {}

    for (const v of raw) {
      const key = `${osisId}.${chapter}.${v.verse}`
      verses[key] = v.text.trim()
    }

    _cache.set(cacheKey, verses)
    return NextResponse.json({ verses })
  } catch {
    return NextResponse.json({ verses: {} })
  }
}

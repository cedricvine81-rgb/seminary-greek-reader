import type { OpenInTextsTarget } from '@/components/phrase/BackgroundsView'

// Shared result shapes for the background-sources search, importable by client code (the
// query lib src/lib/backgrounds-search.ts pulls in fs/zlib and must stay server-only).
// 'es' is the facet of works we translated ourselves (the Apocrypha collection + Josephus) —
// see src/lib/spanish-texts.ts. It is not a published Spanish edition of the library.
export type BgLang = 'en' | 'grc' | 'es'
// `trans` is the section's parallel English, set only for Greek hits whose work has an aligned
// English (Josephus/Whiston, Greco-Roman/Perseus) — so a Greek result can show its translation.
export interface BgHit { ref: string; text: string; target: OpenInTextsTarget; trans?: string }
export interface BgGroup { gid: string; name: string; count: number; hits: BgHit[] }
export interface BgResult { lang: BgLang; total: number; truncated: boolean; groups: BgGroup[] }

import type { OpenInTextsTarget } from '@/components/phrase/BackgroundsView'

// Shared result shapes for the background-sources search, importable by client code (the
// query lib src/lib/backgrounds-search.ts pulls in fs/zlib and must stay server-only).
export type BgLang = 'en' | 'grc'
// `trans` is the section's parallel English, set only for Greek hits whose work has an aligned
// English (Josephus/Whiston, Greco-Roman/Perseus) — so a Greek result can show its translation.
export interface BgHit { ref: string; text: string; target: OpenInTextsTarget; trans?: string }
export interface BgGroup { gid: string; name: string; count: number; hits: BgHit[] }
export interface BgResult { lang: BgLang; total: number; truncated: boolean; groups: BgGroup[] }

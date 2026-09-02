/**
 * A preface is chapter 0 — Quintilian's Institutio numbers it that way — and the notes and
 * highlights endpoints used to test `!chapter`, so every note and every highlight made in a
 * preface came back 400 and the page looked as though it simply had no notes or highlights.
 * These tests pin the distinction the guards now draw: chapter 0 is a chapter, a missing
 * chapter is not.
 */

const getPayload = jest.fn(() => ({ sub: 'u1' }))
const notesForPassage = jest.fn(async () => [])
const createNote = jest.fn(async () => ({ id: 'n1' }))
const highlightsForPassage = jest.fn(async () => [])
const createHighlight = jest.fn(async () => ({ id: 'h1' }))

jest.mock('@/lib/auth', () => ({ getPayload: () => getPayload() }))
jest.mock('@/lib/subscription', () => ({ requireStudentAccess: async () => null }))
jest.mock('@/lib/logger', () => ({ logError: jest.fn() }))
jest.mock('@/lib/notes', () => ({
  notesForPassage: (...a: unknown[]) => notesForPassage(...(a as [])),
  createNote: (...a: unknown[]) => createNote(...(a as [])),
  listNotebook: async () => ({}),
  updateNote: jest.fn(), deleteNote: jest.fn(),
}))
jest.mock('@/lib/highlights', () => ({
  highlightsForPassage: (...a: unknown[]) => highlightsForPassage(...(a as [])),
  createHighlight: (...a: unknown[]) => createHighlight(...(a as [])),
  updateHighlightColor: jest.fn(), deleteHighlight: jest.fn(),
}))

import { GET as notesGet, POST as notesPost } from '@/app/api/notes/route'
import { GET as hlGet, POST as hlPost } from '@/app/api/highlights/route'

type Req = import('next/server').NextRequest
const req = (qs: string): Req => ({ nextUrl: new URL(`http://x/api?${qs}`) } as unknown as Req)
const body = (b: unknown): Req => ({ json: async () => b } as unknown as Req)

const PREFACE = 'book=QuintInst1&chapter=0&verseStart=1&verseEnd=500'
const NO_CHAPTER = 'book=QuintInst1&verseStart=1&verseEnd=500'

describe('a preface is chapter 0, not a missing chapter', () => {
  it('reads notes for chapter 0', async () => {
    expect((await notesGet(req(PREFACE))).status).toBe(200)
    expect(notesForPassage).toHaveBeenCalledWith('u1', 'QuintInst1', 0, 1, 500)
  })

  it('reads highlights for chapter 0', async () => {
    expect((await hlGet(req(PREFACE))).status).toBe(200)
    expect(highlightsForPassage).toHaveBeenCalledWith('u1', 'QuintInst1', 0, 1, 500)
  })

  it('saves a note anchored in a preface', async () => {
    expect((await notesPost(body({ book: 'QuintInst1', chapter: 0, verse: 1, body: 'x' }))).status).toBe(201)
  })

  it('saves a highlight anchored in a preface', async () => {
    const r = await hlPost(body({ book: 'QuintInst1', chapter: 0, verse: 1, startOffset: 4, endOffset: 9, color: 'green' }))
    expect(r.status).toBe(201)
  })

  it('still rejects a passage with no chapter at all', async () => {
    expect((await notesGet(req(NO_CHAPTER))).status).toBe(400)
    expect((await hlGet(req(NO_CHAPTER))).status).toBe(400)
    expect((await notesPost(body({ book: 'QuintInst1', verse: 1 }))).status).toBe(400)
  })
})

// Word under a screen point, for right-click search on plain prose (no per-word spans).
// Selection-aware callers should prefer the current selection and fall back to this.

export const EDGE_PUNCT = /^[.,;:!?·"“”‘’'ʼ`()[\]{}<>«»…—–-]+|[.,;:!?·"“”‘’'ʼ`()[\]{}<>«»…—–-]+$/g

export function wordAtPoint(x: number, y: number): string {
  const doc = document as Document & {
    caretRangeFromPoint?: (x: number, y: number) => Range | null
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null
  }
  let node: Node | null = null, offset = 0
  if (doc.caretRangeFromPoint) {                       // WebKit / Blink (Safari, Chrome)
    const r = doc.caretRangeFromPoint(x, y)
    if (r) { node = r.startContainer; offset = r.startOffset }
  } else if (doc.caretPositionFromPoint) {             // standards / Firefox fallback
    const p = doc.caretPositionFromPoint(x, y)
    if (p) { node = p.offsetNode; offset = p.offset }
  }
  if (!node || node.nodeType !== Node.TEXT_NODE) return ''
  const text = node.textContent ?? ''
  let a = offset, b = offset
  while (a > 0 && !/\s/.test(text[a - 1])) a--
  while (b < text.length && !/\s/.test(text[b])) b++
  return text.slice(a, b)
}

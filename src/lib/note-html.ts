// Notes are stored as a small, safe subset of HTML so the editor can be WYSIWYG
// (Bold/Italic/lists actually format the text). Everything is sanitized to an
// allowlist of formatting tags with no attributes, so there's no XSS surface.

const ALLOWED = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'UL', 'OL', 'LI', 'BR', 'P', 'DIV'])

function clean(src: Node, dst: Node, doc: Document) {
  src.childNodes.forEach(child => {
    if (child.nodeType === 3) {
      dst.appendChild(doc.createTextNode(child.textContent ?? ''))
    } else if (child.nodeType === 1) {
      const el = child as HTMLElement
      if (ALLOWED.has(el.tagName)) {
        const fresh = doc.createElement(el.tagName.toLowerCase()) // drops all attributes
        clean(el, fresh, doc)
        dst.appendChild(fresh)
      } else {
        clean(el, dst, doc) // disallowed tag → unwrap, keep its (cleaned) contents
      }
    }
    // comments and everything else are dropped
  })
}

/** Reduce arbitrary HTML to the safe formatting subset (browser only). */
export function sanitizeNoteHtml(html: string): string {
  if (typeof document === 'undefined') return html.replace(/<[^>]*>/g, '') // SSR fallback: text only
  const src = document.createElement('div'); src.innerHTML = html
  const dst = document.createElement('div'); clean(src, dst, document)
  return dst.innerHTML
}

const looksLikeHtml = (s: string) => /<[a-z][\s\S]*>/i.test(s)

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Convert a stored note body to editable/display HTML. Legacy plain-text notes
 *  (and notes with no markup) are escaped with line breaks preserved. */
export function toNoteHtml(body: string): string {
  if (!body) return ''
  return looksLikeHtml(body) ? sanitizeNoteHtml(body) : escapeHtml(body).replace(/\n/g, '<br>')
}

/** True when the note has no visible text (so we can treat it as empty/delete). */
export function isHtmlEmpty(html: string): boolean {
  if (typeof document === 'undefined') return html.replace(/<[^>]*>/g, '').trim() === ''
  const d = document.createElement('div'); d.innerHTML = html
  return (d.textContent ?? '').trim() === ''
}

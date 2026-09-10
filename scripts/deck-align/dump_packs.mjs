// The .ts files cannot be imported (tsx reports "does not provide an export named
// GRAMMAR_HOMEWORK_SETS"), so slice the array literal out and eval it as plain JS.
import fs from 'node:fs'
const REPO = '/Users/cvine/dev/seminary-greek-reader/src/data/'
function slice(file, ident) {
  const src = fs.readFileSync(REPO + file, 'utf8')
  // Anchor on the DECLARATION, not the first mention — the identifier appears in the file's
  // header comment, and starting there finds a bracket inside the prose.
  const i = src.search(new RegExp('const\\s+' + ident + '\\s*:\\s*HomeworkSet\\[\\]\\s*='))
  if (i < 0) throw new Error('declaration not found: ' + ident)
  const start = src.indexOf('[', src.indexOf('=', i))
  let depth = 0, end = start
  for (let j = start; j < src.length; j++) {
    if (src[j] === '[') depth++
    else if (src[j] === ']') { depth--; if (!depth) { end = j; break } }
  }
  const ART = 'Article'   // the file's one shorthand, used inside template literals
  return eval(src.slice(start, end + 1))
}
const hand = slice('grammar-homework.ts', 'HAND_WRITTEN_SETS')
const slides = slice('grammar-homework-slides.ts', 'SLIDE_HOMEWORK_SETS')
const all = [...hand, ...slides]
fs.writeFileSync('packs.json', JSON.stringify(all, null, 1))
console.log('hand-written packs:', hand.length, '| slide packs:', slides.length, '| total:', all.length)
console.log('total sentences:', all.reduce((n, s) => n + s.sentences.length, 0))

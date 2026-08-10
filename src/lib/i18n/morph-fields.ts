/**
 * Which STRING PROPS of a morphology component are translatable, and what key each one gets.
 *
 * `<Tr>` handles prose, because prose is JSX children. It cannot reach the rest of a chapter:
 * a paradigm table's headers, a drill's options, a worked sentence's gloss are all passed as
 * plain strings and arrays, and a component cannot wrap what it was handed.
 *
 * So the key shapes live here, ONCE, and both callers derive from them — the build script (to
 * enumerate what needs translating) and the component (to look it up). Two hand-written key
 * schemes that agreed today would drift apart the first time one grew a field, and a drifted key
 * is invisible: it just reads as "not translated yet."
 *
 * NOT translatable, deliberately:
 *   · Greek in any cell or word — it is the subject, not the wording.
 *   · `parsing` strings ("Fut Act Ind 3 Pl"). The Reader's parsing pane, the Variants tab and the
 *     morphology quiz share this vocabulary and are still English; translating only here would
 *     show a student `Med` in the chapter and `Mid` in the Reader. They move together or not yet.
 */

export interface Field { key: string; english: string }

/* Key shapes. Components and the build script both call these — never build a key by hand. */
export const K = {
  title:  (id: string) => `${id}.title`,
  intro:  (id: string) => `${id}.intro`,
  header: (id: string, i: number) => `${id}.h${i}`,
  cell:   (id: string, r: number, c: number) => `${id}.c${r}.${c}`,
  note:   (id: string) => `${id}.note`,
  option: (id: string, i: number) => `${id}.o${i}`,
  lesson: (id: string) => `${id}.lesson`,
  sentence: (id: string, i: number) => `${id}.s${i}`,
  sentNote: (id: string, i: number) => `${id}.s${i}.note`,
  gloss:  (id: string, s: number, w: number) => `${id}.s${s}.w${w}.gloss`,
  syntax: (id: string, s: number, w: number) => `${id}.s${s}.w${w}.syntax`,
  catName: (id: string) => `${id}.name`,
  catEg:   (id: string) => `${id}.eg`,
  catEx:   (id: string, i: number) => `${id}.e${i}`,
}

const str = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0

type Props = Record<string, unknown>

/** Every translatable string a component was handed, with its key. Empty when it has no `id`. */
export function fieldsOf(name: string, props: Props): Field[] {
  const id = props.id
  if (!str(id)) return []
  const out: Field[] = []
  const add = (key: string, english: unknown) => { if (str(english)) out.push({ key, english }) }

  switch (name) {
    // ColsTable is MorphTable's sibling for parallel lists; its cells are ReactNode, so only the
    // ones that are actually strings can be enumerated here — JSX cells need <Tr> in the source.
    case 'ColsTable':
    case 'MorphTable': {
      add(K.title(id), props.title)
      add(K.note(id), props.note)
      const headers = (props.headers as unknown[]) ?? []
      headers.forEach((h, i) => add(K.header(id, i), h))
      // Only the columns the chapter marks as prose. Everything else is Greek or a paradigm slot.
      const tCols = (props.tCols as number[]) ?? []
      const rows = (props.rows as unknown[][]) ?? []
      rows.forEach((row, r) => tCols.forEach(c => add(K.cell(id, r, c), row?.[c])))
      break
    }
    case 'DropdownPractice': {
      add(K.title(id), props.title)
      // Answers are matched against options by value, so translating the options alone keeps the
      // two in step — the component maps each answer through the same table.
      const options = (props.options as unknown[]) ?? []
      options.forEach((o, i) => add(K.option(id, i), o))
      break
    }
    case 'Practice': {
      add(K.title(id), props.title)
      break
    }
    // One syntax category in a Getting Started card. `name`, `eg` and the description are
    // ReactNode, so a <Tr> could reach them — but the two NT examples arrive as {g,e,r} objects,
    // and `e` (the English rendering of the Greek clause) is a plain string nothing can wrap.
    // `g` stays Greek and `r` is a verse reference; only `e` is prose.
    case 'Cat': {
      add(K.catName(id), props.name)
      add(K.catEg(id), props.eg)
      const ex = (props.ex as Props[]) ?? []
      ex.forEach((x, i) => add(K.catEx(id, i), x?.e))
      break
    }
    case 'ClassSentences': {
      add(K.lesson(id), props.lesson)
      const items = (props.items as Props[]) ?? []
      items.forEach((it, s) => {
        add(K.sentence(id, s), it?.translation)
        add(K.sentNote(id, s), it?.note)
        const words = (it?.words as Props[]) ?? []
        words.forEach((w, i) => {
          add(K.gloss(id, s, i), w?.gloss)
          add(K.syntax(id, s, i), w?.syntax)
        })
      })
      break
    }
  }
  return out
}

/** Components whose `id` means "enumerate my props", not "serialize my children". */
export const FIELD_COMPONENTS = new Set(['MorphTable', 'ColsTable', 'DropdownPractice', 'Practice', 'ClassSentences', 'Cat'])

/**
 * Verse references inside the syntax cards ("Matt 8:15") are display-only strings, not lookup
 * keys, and there are ~164 of them. Putting each in the catalogue would be 164 entries of pure
 * book-name noise, so the book token is mapped here instead and the chapter numbers pass through.
 * Chapters localise book names in their prose, so leaving these English looked like a bug.
 */
const BOOKS_ES: Record<string, string> = {
  Matt: 'Mt', Mark: 'Mc', Luke: 'Lc', John: 'Jn', Acts: 'Hch', Rom: 'Ro',
  Gal: 'Gá', Eph: 'Ef', Phil: 'Fil', Phlm: 'Flm', Heb: 'He', Jas: 'Stg', Rev: 'Ap',
  Cor: 'Co', Tim: 'Ti', Pet: 'P',
}

/** "1 Cor 7:15" → "1 Co 7:15" for es; unchanged for any other locale. */
export function localizeRef(ref: string, locale: string): string {
  if (locale !== 'es' || !ref) return ref
  return ref.replace(/^(\d\s)?([A-Za-z]+)/, (_m, num: string | undefined, book: string) =>
    `${num ?? ''}${BOOKS_ES[book] ?? book}`)
}

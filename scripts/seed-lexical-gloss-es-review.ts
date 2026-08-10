/**
 * The 139 lemmas the exact-match seed held back, translated from the DATABASE's own English.
 *
 * These are the entries where the DB's wording differs from the static deck's — "I say, speak"
 * vs "say, tell", "God, god" vs "god", "in, within, by" vs "(with dat.) in". The deck's Spanish
 * was written from the deck's English, so reusing it here would be translating a sentence the DB
 * does not say. Each of these was written against the DB gloss instead.
 *
 * Verbs keep the Spanish INFINITIVE even though the DB glosses many as "I ...". The answer key is
 * what a student types; the infinitive is the lexical form, and the other 983 rows use it. Mixing
 * conventions inside one key would be worse than diverging from the English's form.
 *
 * Idempotent. Run after seed-lexical-gloss-es.ts.
 */
import { prisma } from '../src/lib/db'

const LOCALE = 'es'
const ES: Record<string, string> = {
  'ὁ': 'el, la, lo (artículo)', 'καί': 'y, también, incluso', 'αὐτός': 'él, ella, ello; mismo',
  'σύ': 'tú (singular)', 'δέ': 'pero, y, ahora', 'ἐν': 'en, dentro de, por',
  'εἰμί': 'ser, estar; existir', 'λέγω': 'decir, hablar', 'εἰς': 'a, hacia, para',
  'οὗτος': 'este, este mismo', 'ὅς': 'que, el cual, quien', 'θεός': 'Dios, dios',
  'ὅτι': 'que, porque', 'πᾶς': 'todo, cada, entero', 'μή': 'no (negación)',
  'γάρ': 'porque, pues', 'Ἰησοῦς': 'Jesús', 'ἐκ': 'de, desde, fuera de',
  'ἐπί': 'sobre, encima de', 'κύριος': 'Señor, amo', 'ἔχω': 'tener, sostener',
  'πρός': 'a, hacia, con', 'Χριστός': 'Cristo, el Ungido', 'ὡς': 'como, así como, cuando',
  'ἀλλά': 'pero, sino, sin embargo', 'διά': 'por medio de, a causa de', 'οὐ': 'no (negación)',
  'ἄνθρωπος': 'ser humano, persona, hombre', 'ἀγαπάω': 'amar', 'ἀκούω': 'oír, escuchar',
  'ἀπό': 'de, desde, lejos de', 'ἀποκρίνομαι': 'responder, contestar', 'βλέπω': 'ver, mirar',
  'γῆ': 'tierra, país, suelo', 'γίνομαι': 'llegar a ser, suceder', 'γινώσκω': 'conocer, entender',
  'γράφω': 'escribir', 'δίκαιος': 'justo, recto', 'δικαιοσύνη': 'justicia, rectitud',
  'δοῦλος': 'esclavo, siervo', 'δύναμις': 'poder, capacidad, milagro', 'ἐγείρω': 'levantar, despertar',
  'ἔθνος': 'nación; (pl.) los gentiles', 'ἐκεῖ': 'allí, en aquel lugar', 'ἐκκλησία': 'iglesia, asamblea',
  'ἐντολή': 'mandamiento', 'ἐξέρχομαι': 'salir', 'εὐαγγέλιον': 'buena noticia, evangelio',
  'ἵνα': 'para que, a fin de que', 'Ἰουδαῖος': 'judío', 'καθώς': 'así como, tal como',
  'κατά': 'según; contra', 'κόσμος': 'mundo, universo', 'λαμβάνω': 'tomar, recibir',
  'λόγος': 'palabra, mensaje, razón', 'μαθητής': 'discípulo, alumno', 'μέν': 'por una parte, en verdad',
  'νόμος': 'ley, Torá', 'νῦν': 'ahora, en este momento', 'ὁδός': 'camino, vía, viaje',
  'ὅταν': 'cuando, siempre que', 'οὐρανός': 'cielo', 'παρά': 'junto a, de parte de, con',
  'πατήρ': 'padre', 'περί': 'acerca de, sobre', 'πιστεύω': 'creer, confiar',
  'πίστις': 'fe, confianza, creencia', 'πνεῦμα': 'espíritu, Espíritu, viento', 'ποιέω': 'hacer, realizar',
  'πρῶτος': 'primero', 'σύν': 'con, juntamente con', 'τέκνον': 'hijo, niño',
  'τότε': 'entonces, en aquel tiempo', 'ὑπέρ': 'por, a favor de; por encima de', 'ὑπό': 'por; debajo de',
  'υἱός': 'hijo', 'χάρις': 'gracia, favor', 'ἀγαθός': 'bueno, provechoso',
  'ἄγω': 'conducir, llevar', 'αἰώνιος': 'eterno, perpetuo', 'αἰών': 'edad, eternidad, mundo',
  'ἁμαρτάνω': 'pecar, errar el blanco', 'ἀναβαίνω': 'subir, ascender', 'ἀνίστημι': 'levantar; levantarse',
  'ἄξιος': 'digno, merecedor', 'ἀρχή': 'principio; gobernante', 'ἄρχω': 'gobernar; comenzar',
  'ἄρχων': 'gobernante, jefe', 'βαπτίζω': 'bautizar, sumergir', 'βάλλω': 'arrojar, poner',
  'γεννάω': 'engendrar, dar a luz', 'δαιμόνιον': 'demonio', 'δεῖ': 'es necesario',
  'δέχομαι': 'recibir, aceptar', 'δικαιόω': 'justificar, declarar justo', 'δοξάζω': 'glorificar, honrar',
  'δόξα': 'gloria, honor', 'ἐκβάλλω': 'echar fuera, expulsar', 'ἑτοιμάζω': 'preparar, disponer',
  'εὐαγγελίζω': 'anunciar la buena noticia', 'ζητέω': 'buscar', 'θέλω': 'querer, desear',
  'ἰσχύω': 'ser fuerte, poder', 'καθαρός': 'limpio, puro', 'καλέω': 'llamar, nombrar, invitar',
  'καλός': 'bueno, hermoso, noble', 'κρίνω': 'juzgar, decidir', 'κρίσις': 'juicio, decisión',
  'μαρτυρέω': 'testificar, dar testimonio', 'μέλλω': 'estar a punto de, ir a', 'μένω': 'permanecer, quedarse',
  'μόνος': 'solo, único', 'νεκρός': 'muerto, cadáver', 'οἶκος': 'casa, hogar',
  'ὅλος': 'todo, entero', 'παιδίον': 'niño, criatura', 'παρακαλέω': 'exhortar, animar, consolar',
  'παρουσία': 'venida, presencia', 'πέμπω': 'enviar', 'πλήρης': 'lleno',
  'πληρόω': 'llenar, cumplir', 'πρεσβύτερος': 'anciano, mayor', 'προσέρχομαι': 'acercarse, aproximarse',
  'προσεύχομαι': 'orar', 'προσκυνέω': 'adorar, postrarse', 'σωτηρία': 'salvación, liberación',
  'τηρέω': 'guardar, custodiar, observar', 'ὑπάρχω': 'ser, existir', 'φέρω': 'llevar, traer, soportar',
  'φοβέομαι': 'temer, tener miedo', 'τίθημι': 'poner, colocar', 'φυλακή': 'cárcel, guardia, vigilia',
  'φωνή': 'voz, sonido', 'φῶς': 'luz', 'χαίρω': 'alegrarse, regocijarse',
  'ὥρα': 'hora, tiempo, momento', 'σῴζω': 'salvar, rescatar', 'πολύς': 'mucho, muchos, grande',
  'μετά': 'con; después de',
}

async function main() {
  const dry = process.argv.includes('--dry')
  const norm = (s: string) => s.normalize('NFC')
  const entries = await prisma.lexicalEntry.findMany({ select: { id: true, lexeme: true } })
  const byLemma = new Map(entries.map(e => [norm(e.lexeme), e.id]))

  const hits: { id: string; lemma: string; gloss: string }[] = []
  const missing: string[] = []
  for (const [lemma, gloss] of Object.entries(ES)) {
    const id = byLemma.get(norm(lemma))
    if (!id) { missing.push(lemma); continue }
    hits.push({ id, lemma, gloss })
  }
  console.log(`to write: ${hits.length}`)
  if (missing.length) console.log(`no lexicon entry for: ${missing.join(' ')}`)
  if (dry) { console.log('--dry: nothing written'); await prisma.$disconnect(); return }

  for (const h of hits) {
    await prisma.lexicalGloss.upsert({
      where: { lexemeId_locale: { lexemeId: h.id, locale: LOCALE } },
      update: { gloss: h.gloss },
      create: { lexemeId: h.id, locale: LOCALE, gloss: h.gloss },
    })
  }
  console.log(`written: ${hits.length}`)
  console.log(`LexicalGloss es rows now: ${await prisma.lexicalGloss.count({ where: { locale: LOCALE } })}`)
  await prisma.$disconnect()
}
main().catch(e => { console.error('ERROR:', e.message); process.exit(1) })

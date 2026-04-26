import type { BiblicalVerse } from '@/types/biblical-text'

/** Fallback data used when the database is unavailable (e.g. dev without DB) */
export const SAMPLE_JOHN_1: BiblicalVerse[] = [
  {
    id: 'sample-jn-1-1',
    bookId: 'sample-john',
    chapter: 1,
    verse: 1,
    reference: 'John 1:1',
    text: 'Ἐν ἀρχῇ ἦν ὁ λόγος, καὶ ὁ λόγος ἦν πρὸς τὸν θεόν, καὶ θεὸς ἦν ὁ λόγος.',
  },
  {
    id: 'sample-jn-1-2',
    bookId: 'sample-john',
    chapter: 1,
    verse: 2,
    reference: 'John 1:2',
    text: 'Οὗτος ἦν ἐν ἀρχῇ πρὸς τὸν θεόν.',
  },
  {
    id: 'sample-jn-1-3',
    bookId: 'sample-john',
    chapter: 1,
    verse: 3,
    reference: 'John 1:3',
    text: 'πάντα δι᾽ αὐτοῦ ἐγένετο, καὶ χωρὶς αὐτοῦ ἐγένετο οὐδὲ ἕν ὃ γέγονεν.',
  },
  {
    id: 'sample-jn-1-4',
    bookId: 'sample-john',
    chapter: 1,
    verse: 4,
    reference: 'John 1:4',
    text: 'ἐν αὐτῷ ζωὴ ἦν, καὶ ἡ ζωὴ ἦν τὸ φῶς τῶν ἀνθρώπων.',
  },
  {
    id: 'sample-jn-1-5',
    bookId: 'sample-john',
    chapter: 1,
    verse: 5,
    reference: 'John 1:5',
    text: 'καὶ τὸ φῶς ἐν τῇ σκοτίᾳ φαίνει, καὶ ἡ σκοτία αὐτὸ οὐ κατέλαβεν.',
  },
]

export const SAMPLE_GEN_1: BiblicalVerse[] = [
  {
    id: 'sample-gen-1-1',
    bookId: 'sample-gen',
    chapter: 1,
    verse: 1,
    reference: 'Gen 1:1',
    text: 'Ἐν ἀρχῇ ἐποίησεν ὁ θεὸς τὸν οὐρανὸν καὶ τὴν γῆν.',
  },
  {
    id: 'sample-gen-1-2',
    bookId: 'sample-gen',
    chapter: 1,
    verse: 2,
    reference: 'Gen 1:2',
    text: 'ἡ δὲ γῆ ἦν ἀόρατος καὶ ἀκατασκεύαστος, καὶ σκότος ἐπάνω τῆς ἀβύσσου.',
  },
  {
    id: 'sample-gen-1-3',
    bookId: 'sample-gen',
    chapter: 1,
    verse: 3,
    reference: 'Gen 1:3',
    text: 'καὶ εἶπεν ὁ θεός Γενηθήτω φῶς· καὶ ἐγένετο φῶς.',
  },
]

import { prisma } from './db'
import type { CourseLevel } from '@/types/course'
import type { QuestionType } from '@/types/assignment'

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function pickDistractors(correct: string, pool: string[], count = 3): string[] {
  return shuffle(pool.filter(s => s !== correct)).slice(0, count)
}

export async function generateVocabQuestions(
  level: CourseLevel,
  type: QuestionType,
  count: number
) {
  const freqLevel = level === 'BEGINNING' ? 'BEGINNING' : 'INTERMEDIATE'
  const items = await prisma.vocabularyItem.findMany({
    where: { level: freqLevel },
    include: { lexeme: true },
    take: count * 4,
  })

  const picked = shuffle(items).slice(0, count)
  const allGlosses = items.map(i => i.lexeme.gloss)
  const allLexemes = items.map(i => i.lexeme.lexeme)

  return picked.map((item, idx) => {
    if (type === 'GREEK_TO_ENGLISH') {
      const distractors = pickDistractors(item.lexeme.gloss, allGlosses)
      const options = shuffle([item.lexeme.gloss, ...distractors])
      return {
        position: idx + 1,
        type: 'MULTIPLE_CHOICE' as QuestionType,
        prompt: item.lexeme.lexeme,
        correctAnswer: item.lexeme.gloss,
        options,
        points: 1,
      }
    } else {
      const distractors = pickDistractors(item.lexeme.lexeme, allLexemes)
      const options = shuffle([item.lexeme.lexeme, ...distractors])
      return {
        position: idx + 1,
        type: 'MULTIPLE_CHOICE' as QuestionType,
        prompt: item.lexeme.gloss,
        correctAnswer: item.lexeme.lexeme,
        options,
        points: 1,
      }
    }
  })
}

export async function generateMorphologyQuestions(count: number) {
  const parses = await prisma.morphParse.findMany({
    include: { word: true, lexeme: true },
    take: count * 4,
  })

  return shuffle(parses).slice(0, count).map((parse, idx) => ({
    position: idx + 1,
    type: 'MORPHOLOGY_IDENTIFY' as QuestionType,
    prompt: parse.surface,
    correctAnswer: JSON.stringify({
      partOfSpeech: parse.partOfSpeech,
      tense: parse.tense,
      voice: parse.voice,
      mood: parse.mood,
      person: parse.person,
      number: parse.number,
      casus: parse.casus,
      gender: parse.gender,
    }),
    options: [],
    points: 5,
  }))
}

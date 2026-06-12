-- Repopulate the Flashcard table from existing vocabulary (one card per vocab item).
-- Mirrors prisma/seed.ts: front = Greek lexeme, back = lexeme + gloss + part of speech.
-- Safe to re-run: ON CONFLICT skips cards that already exist for a (lexeme, level).
-- Run in the Supabase SQL editor.

INSERT INTO "Flashcard" (id, "lexemeId", "vocabItemId", level, front, "backLexeme", "backGloss", "backParsing")
SELECT gen_random_uuid()::text,
       le.id,
       vi.id,
       vi.level,
       le.lexeme,
       le.lexeme,
       le.gloss,
       le."partOfSpeech"
FROM "VocabularyItem" vi
JOIN "LexicalEntry" le ON le.id = vi."lexemeId"
ON CONFLICT ("lexemeId", level) DO NOTHING;

-- Show the resulting counts per deck so we can confirm it worked:
SELECT level, COUNT(*) AS cards
FROM "Flashcard"
GROUP BY level
ORDER BY level;

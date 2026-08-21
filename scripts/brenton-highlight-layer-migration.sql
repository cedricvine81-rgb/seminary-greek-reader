-- Move /texts highlights on the Septuagint's English from layer 'en' to 'brenton'.
--
-- WHY. Highlight.layer says which text a highlight's character offsets are into. Two surfaces
-- can show a DIFFERENT English for the same LXX verse:
--
--     /texts  (TextsReader)   Brenton's translation of the Septuagint
--     Reader  (GreekReader)   the World English Bible  (LANG_TO_TRANSLATION.en = 'web')
--
-- Both wrote layer 'en', so a highlight drawn in one surface reappeared in the other at offsets
-- into a different string, landing on the wrong words. TextsReader now writes the EDITION for
-- Septuagint/Apocrypha works (see `transLayer`); the Reader keeps 'en' for the WEB. This moves
-- the rows written by /texts under the old scheme.
--
-- WHICH ROWS, AND HOW WE KNOW. There were 57 highlights on layer 'en' against a
-- Septuagint/Apocrypha book:
--
--   * 53 on DEUTEROCANONICAL books. The Reader cannot show an English column for these at all —
--     /api/translation maps OSIS ids to Protestant book numbers and returns no verses without
--     one — so every one was made in /texts and is Brenton. Those are the rows moved here.
--     (Observed: 1Macc 23, 2Macc 13, Sir 7, Wis 7, Tob 3.)
--
--   * 4 on PROTOCANONICAL books (Jer 4:3, Isa 55:10, Isa 55:11, 2Kgs 19:26), where either
--     surface could have made them. Each was checked against BOTH texts: all four end exactly at
--     the length of the WEB verse (116, 180, 174, 227 characters), and none matches Brenton —
--     2Kgs 19:26 runs to 227 where Brenton has only 224, so it cannot be Brenton at all. They
--     are Reader highlights and are deliberately LEFT on 'en'.
--
-- So the rule is "deuterocanonical Brenton books only", which is exactly the set that cannot be
-- ambiguous. The list is not hand-written: it is every work in the Septuagint and Apocrypha
-- catalogues carrying english === 'brenton' whose osisId has no Protestant book number. Writing
-- it out by hand first produced a WRONG list — it included 2Esdras, which is a KJV prose work
-- with no osisId and no Brenton text at all, and would have mislabelled its 6 highlights.
--
-- Scoped to layer = 'en', so running it twice is a no-op.
-- Run in the Supabase SQL editor BEFORE deploying the code change (deploy-migrations-first).

BEGIN;

-- What is about to change — read this before committing.
SELECT book, COUNT(*) AS rows_to_move
FROM "Highlight"
WHERE layer = 'en'
  AND book IN ('1Esd','1Macc','2Macc','3Macc','4Macc','Bar','Bel','EpJer','Jdt',
               'Odes','PsSol','Sir','Sus','Tob','Wis')
GROUP BY book
ORDER BY rows_to_move DESC;

UPDATE "Highlight"
SET layer = 'brenton'
WHERE layer = 'en'
  AND book IN ('1Esd','1Macc','2Macc','3Macc','4Macc','Bar','Bel','EpJer','Jdt',
               'Odes','PsSol','Sir','Sus','Tob','Wis');

-- Expect: brenton 53, grc unchanged, and NO 'en' left on these books.
SELECT layer, COUNT(*) AS remaining
FROM "Highlight"
WHERE book IN ('1Esd','1Macc','2Macc','3Macc','4Macc','Bar','Bel','EpJer','Jdt',
               'Odes','PsSol','Sir','Sus','Tob','Wis')
GROUP BY layer
ORDER BY layer;

-- The four Reader rows that must NOT have moved.
SELECT book, chapter, verse, layer
FROM "Highlight"
WHERE (book, chapter, verse) IN (('Jer',4,3), ('Isa',55,10), ('Isa',55,11), ('2Kgs',19,26))
ORDER BY book, chapter, verse;

COMMIT;

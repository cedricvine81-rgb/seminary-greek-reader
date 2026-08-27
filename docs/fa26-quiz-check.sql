-- ============================================================================
--  Beginning Greek FA26 — are the quizzes actually usable?
--  Read-only. Run in the Supabase SQL editor.
--
--  ⚠ RUN ONE STATEMENT AT A TIME. The editor shows only the LAST result set when
--    several are submitted together, so running the whole file returns the
--    enrolment count and hides everything that matters. Query 0 below is
--    self-contained and answers the whole question in one run — start there.
--
--  Questions are generated when the assignment is CREATED and stored as rows, so a
--  quiz that generated short or empty is already short or empty in the database —
--  this finds them without waiting for a student to hit one.
-- ============================================================================

-- 0. START HERE. One row per quiz, worst first, with a verdict.
--    EMPTY   = opens with no questions; a student submitting it records 0%.
--    SHORT   = fewer questions than a normal quiz; usually a vocabulary cap that
--              starved a narrow filter (1st/3rd-declension nouns at cap 1-4,
--              perfect-tense verbs at cap 1).
SELECT
  CASE WHEN count(q.id) = 0 THEN 'EMPTY'
       WHEN count(q.id) < 10 THEN 'SHORT'
       ELSE 'ok' END                                AS verdict,
  count(q.id)                                       AS questions,
  a."weekNumber"                                    AS wk,
  a."type",
  a."title",
  a."isPublished"                                   AS published,
  count(DISTINCT att.id)                            AS attempts,
  a."vocabThruLesson"                               AS vocab_cap,
  a."morphSubtype"                                  AS subtype,
  a."morphConfig" -> 'declensions'                  AS declensions,
  a."morphConfig" -> 'parseFilter' -> 'tenses'      AS tenses,
  a."vocabReviewPct"                                AS review_pct,
  a."dueDate"::date                                 AS due
FROM "Assignment" a
JOIN "Course" c             ON c.id = a."courseId"
LEFT JOIN "Question" q      ON q."assignmentId" = a.id
LEFT JOIN "QuizAttempt" att ON att."assignmentId" = a.id
WHERE c."name" ILIKE '%FA26%'
  AND a."type" IN ('VOCABULARY_QUIZ', 'MORPHOLOGY_QUIZ')
GROUP BY a.id
ORDER BY count(q.id), a."weekNumber";

-- 1. THE HEADLINE: every quiz, how many questions it actually holds, and whether
--    anyone has sat it yet. A row with questions = 0 is a quiz that opens empty and
--    records 0% on submit (grading guards the divide, so it does not error).
SELECT a."weekNumber",
       a."type",
       a."title",
       a."isPublished",
       a."assessed",
       count(q.id)                         AS questions,
       count(DISTINCT att.id)              AS attempts_so_far,
       a."vocabThruLesson",
       a."morphSubtype",
       a."morphConfig" -> 'declensions'    AS declensions,
       a."vocabReviewPct",
       a."dueDate"
FROM "Assignment" a
JOIN "Course" c            ON c.id = a."courseId"
LEFT JOIN "Question" q     ON q."assignmentId" = a.id
LEFT JOIN "QuizAttempt" att ON att."assignmentId" = a.id
WHERE c."name" ILIKE '%FA26%'
  AND a."type" IN ('VOCABULARY_QUIZ', 'MORPHOLOGY_QUIZ')
GROUP BY a.id, c.id
ORDER BY a."weekNumber", a."dueDate";


-- 2. THE ONES TO LOOK AT FIRST: fewer than 10 questions, or none at all.
SELECT a."weekNumber", a."type", a."title", count(q.id) AS questions,
       a."vocabThruLesson", a."morphSubtype",
       a."morphConfig" -> 'declensions' AS declensions, a."isPublished"
FROM "Assignment" a
JOIN "Course" c        ON c.id = a."courseId"
LEFT JOIN "Question" q ON q."assignmentId" = a.id
WHERE c."name" ILIKE '%FA26%'
  AND a."type" IN ('VOCABULARY_QUIZ', 'MORPHOLOGY_QUIZ')
GROUP BY a.id
HAVING count(q.id) < 10
ORDER BY count(q.id), a."weekNumber";


-- 3. THE COMBINATION THAT PRODUCES NOTHING. Measured against the real generator:
--    a noun quiz restricted to 1st or 3rd declension yields ZERO questions at a
--    vocabulary cap of 1-2, and 3 of 10 at cap 4. 2nd declension is fine throughout.
--    Verb quizzes restricted to the perfect yield zero at cap 1.
SELECT a."weekNumber", a."title", a."vocabThruLesson",
       a."morphConfig" -> 'declensions' AS declensions,
       a."morphConfig" -> 'parseFilter' -> 'tenses' AS tenses,
       count(q.id) AS questions
FROM "Assignment" a
JOIN "Course" c        ON c.id = a."courseId"
LEFT JOIN "Question" q ON q."assignmentId" = a.id
WHERE c."name" ILIKE '%FA26%'
  AND a."type" = 'MORPHOLOGY_QUIZ'
  AND a."vocabThruLesson" IS NOT NULL
  AND a."vocabThruLesson" <= 5
GROUP BY a.id
ORDER BY a."vocabThruLesson";


-- 4. DID ANYONE ALREADY SIT A BROKEN ONE? If a student has an attempt on a quiz with
--    no questions, they have a recorded zero that is not their fault.
SELECT u.email, a."title", a."weekNumber", att."percentage", att."totalPoints",
       att."completedAt", count(q.id) AS questions_on_quiz
FROM "QuizAttempt" att
JOIN "Assignment" a ON a.id = att."assignmentId"
JOIN "Course" c     ON c.id = a."courseId"
JOIN "User" u       ON u.id = att."userId"
LEFT JOIN "Question" q ON q."assignmentId" = a.id
WHERE c."name" ILIKE '%FA26%'
GROUP BY att.id, u.email, a."title", a."weekNumber", a.id
HAVING count(q.id) = 0 OR att."totalPoints" = 0
ORDER BY att."completedAt";


-- 5. Sanity: enrolment, so the numbers above have a denominator.
SELECT c."name", c."level", c."startDate", c."endDate",
       count(*) FILTER (WHERE e.status = 'APPROVED') AS approved_students,
       count(*) FILTER (WHERE e.status <> 'APPROVED') AS other_enrolments
FROM "Course" c
LEFT JOIN "Enrollment" e ON e."courseId" = c.id
WHERE c."name" ILIKE '%FA26%'
GROUP BY c.id;


-- ============================================================================
-- 6. DUPLICATE ASSIGNMENTS
--    Query 0 showed the same quiz twice for weeks 1-4 — same title, same week,
--    both published. Students see it twice, and attempts split between the copies,
--    so one copy can sit ungraded and drag the average down.
--    Run this alone. It shows every copy so you can decide which to keep.
-- ============================================================================
SELECT a."weekNumber"                        AS wk,
       a."type",
       a."title",
       a.id                                  AS assignment_id,
       a."isPublished"                       AS published,
       a."assessed",
       a."createdAt",
       count(DISTINCT q.id)                  AS questions,
       count(DISTINCT att.id)                AS attempts,
       count(DISTINCT r.id)                  AS responses
FROM "Assignment" a
JOIN "Course" c             ON c.id = a."courseId"
LEFT JOIN "Question" q      ON q."assignmentId" = a.id
LEFT JOIN "QuizAttempt" att ON att."assignmentId" = a.id
LEFT JOIN "Response" r      ON r."assignmentId" = a.id
WHERE c."name" ILIKE '%FA26%'
  AND (a."weekNumber", a."type", a."title") IN (
        SELECT a2."weekNumber", a2."type", a2."title"
        FROM "Assignment" a2
        JOIN "Course" c2 ON c2.id = a2."courseId"
        WHERE c2."name" ILIKE '%FA26%'
        GROUP BY a2."weekNumber", a2."type", a2."title"
        HAVING count(*) > 1)
GROUP BY a.id
ORDER BY a."weekNumber", a."type", a."title", a."createdAt";


-- 7. HOW MANY DUPLICATES, AND DO ANY HAVE STUDENT WORK ON BOTH COPIES?
--    A pair where both copies have attempts cannot simply be deleted — the work
--    on the discarded copy would go with it.
SELECT a."weekNumber" AS wk, a."type", a."title",
       count(*)                                            AS copies,
       count(*) FILTER (WHERE att.n > 0)                    AS copies_with_attempts,
       sum(att.n)                                           AS total_attempts
FROM "Assignment" a
JOIN "Course" c ON c.id = a."courseId"
LEFT JOIN LATERAL (
  SELECT count(*) AS n FROM "QuizAttempt" x WHERE x."assignmentId" = a.id
) att ON TRUE
WHERE c."name" ILIKE '%FA26%'
GROUP BY a."weekNumber", a."type", a."title"
HAVING count(*) > 1
ORDER BY count(*) FILTER (WHERE att.n > 0) DESC, a."weekNumber";

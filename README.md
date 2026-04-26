# Seminary Greek

A full-stack web application for seminary students learning biblical Greek.

## Features

- **Greek Text Reader** — Scrollable reader for the Septuagint (LXX) and Greek New Testament (GNT) with word-hover parsing panels
- **Authentication** — Role-based sign-up / sign-in for Instructors and Students
- **Instructor Dashboard** — Create courses, build vocabulary/morphology/translation assignments, track student progress
- **Student Dashboard** — View assignments, take quizzes, practice flashcards, track progress
- **Vocabulary Quizzes** — Graded by NT word frequency (50+ for Beginning, 30+ for Intermediate)
- **Morphology Quizzes** — Case, number, gender, tense, voice, mood, person, and more via dropdown menus
- **Translation Exercises** — Translate passages, identify morphology and syntax with dropdown categories
- **Flashcards** — Spaced-repetition flashcard system with shuffle mode

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL via Prisma |
| Auth | Supabase Auth (or custom JWT) |
| ORM | Prisma |

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Edit .env.local with your database credentials
```

### 3. Set up the database

```bash
npm run db:generate   # generate Prisma client
npm run db:push       # push schema to database
npm run db:seed       # seed sample data
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
seminary-greek-reader/
├── prisma/              # Schema, migrations, seed data
├── src/
│   ├── app/             # Next.js App Router pages & API routes
│   ├── components/      # React components
│   ├── lib/             # Business logic & utilities
│   ├── types/           # TypeScript types
│   └── data/            # Static reference data
├── tests/               # Jest tests
└── docs/                # Documentation
```

## Copyright Notice

All biblical texts used in this application are public domain. No copyrighted lexicons, commentaries, or grammar books are reproduced. Vocabulary and parsing data are based on open scholarly resources. See [docs/copyright-notes.md](docs/copyright-notes.md) for details.

## License

MIT

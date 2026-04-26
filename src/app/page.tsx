import Link from 'next/link'
import { BookOpen, GraduationCap, FlipHorizontal, BarChart2 } from 'lucide-react'

export default function HomePage() {
  const features = [
    {
      icon: <BookOpen size={24} className="text-brand-600" />,
      title: 'Greek Text Reader',
      desc: 'Read the Septuagint (LXX) and Greek New Testament with word-hover parsing and lexical information.',
    },
    {
      icon: <GraduationCap size={24} className="text-brand-600" />,
      title: 'Vocabulary & Morphology',
      desc: 'Study NT vocabulary by frequency. Practice morphological parsing with dropdown menus.',
    },
    {
      icon: <FlipHorizontal size={24} className="text-brand-600" />,
      title: 'Spaced Repetition Flashcards',
      desc: 'Study Greek vocabulary with a smart SM-2 spaced repetition system. Know it or review it.',
    },
    {
      icon: <BarChart2 size={24} className="text-brand-600" />,
      title: 'Instructor Assignments',
      desc: 'Instructors build vocabulary quizzes, morphology drills, and translation exercises with auto-grading.',
    },
  ]

  return (
    <main>
      {/* Hero */}
      <section className="bg-brand-900 text-white py-20 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-brand-800 text-brand-200 text-sm px-4 py-1.5 rounded-full">
            <span className="greek-text text-base">Ἐν ἀρχῇ ἦν ὁ λόγος</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
            Seminary Greek
          </h1>
          <p className="text-lg text-brand-200 max-w-xl mx-auto">
            Read the Septuagint and Greek New Testament, master vocabulary, practice morphology,
            and complete instructor-created assignments — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/reader" className="btn bg-white text-brand-800 hover:bg-brand-50 px-6 py-3 font-semibold text-base">
              Open Reader
            </Link>
            <Link href="/auth/sign-up" className="btn bg-brand-700 border border-brand-500 text-white hover:bg-brand-600 px-6 py-3 font-semibold text-base">
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Everything you need to learn biblical Greek</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(f => (
              <div key={f.title} className="flex flex-col gap-3 p-5 rounded-xl border border-gray-100 bg-gray-50">
                {f.icon}
                <h3 className="font-semibold text-gray-900">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sample text */}
      <section className="py-16 px-6 bg-parchment-50">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-xl font-bold text-gray-900">Hover any word to see its parsing</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-parchment-200 p-8">
            <p className="greek-text text-2xl text-gray-900 leading-loose">
              Ἐν ἀρχῇ ἦν ὁ λόγος, καὶ ὁ λόγος ἦν πρὸς τὸν θεόν, καὶ θεὸς ἦν ὁ λόγος.
            </p>
            <p className="text-sm text-gray-500 mt-3">John 1:1 (GNT)</p>
          </div>
          <Link href="/reader" className="inline-block btn-primary px-6 py-2.5 text-sm">
            Open the full reader →
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-brand-800 text-white">
        <div className="max-w-xl mx-auto text-center space-y-4">
          <h2 className="text-2xl font-bold">Ready to start?</h2>
          <p className="text-brand-200">Create a free account as a student or instructor.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/auth/sign-up?role=STUDENT" className="btn bg-white text-brand-800 hover:bg-brand-50 px-6 py-2.5 font-semibold text-sm">
              Sign up as Student
            </Link>
            <Link href="/auth/sign-up?role=INSTRUCTOR" className="btn bg-brand-600 border border-brand-400 text-white hover:bg-brand-500 px-6 py-2.5 font-semibold text-sm">
              Sign up as Instructor
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

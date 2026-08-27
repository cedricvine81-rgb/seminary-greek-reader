import { personName, teachingTeamName, teachingTeamEmails } from '@/lib/teaching-team'

/**
 * A co-taught course showed only whoever holds Course.instructorId, and on these courses that is
 * frequently the administrative owner rather than the person running the class. So a student
 * choosing a course, or looking at the one they are enrolled in, saw a name that was not the
 * person they would actually be dealing with — and "Message instructor" reached only that person.
 */
const vine = { title: 'Dr', firstName: 'Cedric', surname: 'Vine', email: 'cv@example.edu' }
const smith = { title: 'Dr', firstName: 'Jane', surname: 'Smith', email: 'js@example.edu' }

describe('naming the teaching team', () => {
  it('names one instructor plainly', () => {
    expect(teachingTeamName(vine, [])).toBe('Dr Cedric Vine')
  })

  it('names a co-instructor alongside, lead first', () => {
    expect(teachingTeamName(vine, [smith])).toBe('Dr Cedric Vine and Dr Jane Smith')
  })

  it('joins three the way a reader would', () => {
    const brown = { title: '', firstName: 'Sam', surname: 'Brown' }
    expect(teachingTeamName(vine, [smith, brown])).toBe('Dr Cedric Vine, Dr Jane Smith, and Sam Brown')
  })

  it('reads naturally in Spanish', () => {
    expect(teachingTeamName(vine, [smith], 'es')).toContain(' y ')
  })

  it('does not repeat someone listed as both lead and co-instructor', () => {
    expect(teachingTeamName(vine, [vine])).toBe('Dr Cedric Vine')
  })

  it('leaves no stray spaces when a title or first name is missing', () => {
    expect(personName({ title: null, firstName: 'Sam', surname: 'Brown' })).toBe('Sam Brown')
    expect(personName({ title: 'Dr', firstName: '', surname: 'Brown' })).toBe('Dr Brown')
  })

  it('survives having no one at all', () => {
    expect(teachingTeamName(null, [])).toBe('')
    expect(personName(undefined)).toBe('')
  })

  it('collects every teaching email, lead first and no duplicates', () => {
    expect(teachingTeamEmails(vine, [smith])).toEqual(['cv@example.edu', 'js@example.edu'])
    expect(teachingTeamEmails(vine, [vine])).toEqual(['cv@example.edu'])
    expect(teachingTeamEmails(vine, [{ email: null }])).toEqual(['cv@example.edu'])
  })
})

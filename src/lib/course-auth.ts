import { prisma } from '@/lib/db'

/** Returns true if userId is the primary instructor or a co-instructor of courseId. */
export async function isInstructorOfCourse(courseId: string, userId: string): Promise<boolean> {
  const count = await prisma.course.count({
    where: {
      id: courseId,
      OR: [
        { instructorId: userId },
        { coInstructors: { some: { userId } } },
      ],
    },
  })
  return count > 0
}

/** Returns true if userId can manage the given assignment (creator or co-instructor of its course). */
export async function isAuthorizedForAssignment(assignmentId: string, userId: string): Promise<boolean> {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { courseId: true, createdById: true },
  })
  if (!assignment) return false
  if (assignment.createdById === userId) return true
  return isInstructorOfCourse(assignment.courseId, userId)
}

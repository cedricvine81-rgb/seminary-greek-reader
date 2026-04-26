import { prisma } from './db'

export async function getMaterialsByCourse(courseId: string) {
  return prisma.material.findMany({
    where: { courseId },
    orderBy: [{ weekNumber: 'asc' }, { createdAt: 'desc' }],
  })
}

export async function getMaterial(id: string) {
  return prisma.material.findUnique({ where: { id } })
}

export async function createMaterial(data: {
  courseId: string
  title: string
  description?: string
  content?: string
  fileUrl?: string
  weekNumber?: number
}) {
  return prisma.material.create({ data })
}

export async function updateMaterial(id: string, data: {
  title?: string
  description?: string
  content?: string
  fileUrl?: string
  weekNumber?: number
}) {
  return prisma.material.update({ where: { id }, data })
}

export async function deleteMaterial(id: string) {
  return prisma.material.delete({ where: { id } })
}

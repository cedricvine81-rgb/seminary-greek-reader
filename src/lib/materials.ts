import { prisma } from './db'
import { deleteObjects } from './storage'

/* ───────────────────────── Legacy (per-course) ───────────────────────── */

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
  courseId?: string
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

/* ───────────────────────── Folder tree ───────────────────────── */

export async function createFolder(instructorId: string, name: string, parentId: string | null) {
  // A child folder must belong to the same instructor as its parent.
  if (parentId) {
    const parent = await prisma.materialFolder.findUnique({ where: { id: parentId }, select: { instructorId: true } })
    if (!parent || parent.instructorId !== instructorId) throw new Error('Parent folder not found')
  }
  return prisma.materialFolder.create({ data: { instructorId, name: name.trim() || 'Untitled folder', parentId } })
}

export async function renameFolder(instructorId: string, id: string, name: string) {
  const folder = await prisma.materialFolder.findUnique({ where: { id }, select: { instructorId: true } })
  if (!folder || folder.instructorId !== instructorId) throw new Error('Folder not found')
  return prisma.materialFolder.update({ where: { id }, data: { name: name.trim() || 'Untitled folder' } })
}

/** Collect a folder plus all of its descendants. */
async function folderAndDescendants(rootId: string): Promise<string[]> {
  const all = new Set<string>([rootId])
  let frontier = [rootId]
  while (frontier.length) {
    const kids = await prisma.materialFolder.findMany({ where: { parentId: { in: frontier } }, select: { id: true } })
    frontier = kids.map(k => k.id).filter(id => !all.has(id))
    frontier.forEach(id => all.add(id))
  }
  return Array.from(all)
}

/** Delete a folder, its subfolders, and all contained files — including the
 *  physical storage objects. DB rows cascade from the folder row. */
export async function deleteFolder(instructorId: string, id: string) {
  const folder = await prisma.materialFolder.findUnique({ where: { id }, select: { instructorId: true } })
  if (!folder || folder.instructorId !== instructorId) throw new Error('Folder not found')

  const ids = await folderAndDescendants(id)
  const files = await prisma.material.findMany({
    where: { folderId: { in: ids }, storagePath: { not: null } },
    select: { storagePath: true },
  })
  await deleteObjects(files.map(f => f.storagePath!).filter(Boolean))
  await prisma.materialFolder.delete({ where: { id } }) // cascades to subfolders + materials
}

/* ───────────────────────── Files ───────────────────────── */

/** Record a file after the browser has uploaded its bytes straight to storage. */
export async function createFileRecord(instructorId: string, data: {
  folderId: string | null
  title: string
  description?: string
  storagePath: string
  mimeType?: string
  sizeBytes?: number
  originalName?: string
}) {
  if (data.folderId) {
    const folder = await prisma.materialFolder.findUnique({ where: { id: data.folderId }, select: { instructorId: true } })
    if (!folder || folder.instructorId !== instructorId) throw new Error('Folder not found')
  }
  return prisma.material.create({
    data: {
      instructorId,
      folderId: data.folderId,
      title: data.title,
      description: data.description,
      storagePath: data.storagePath,
      mimeType: data.mimeType,
      sizeBytes: data.sizeBytes,
      originalName: data.originalName,
    },
  })
}

export async function deleteFile(instructorId: string, id: string) {
  const file = await prisma.material.findUnique({
    where: { id },
    select: { instructorId: true, storagePath: true, course: { select: { instructorId: true } } },
  })
  if (!file) throw new Error('File not found')
  const owns = file.instructorId === instructorId || file.course?.instructorId === instructorId
  if (!owns) throw new Error('File not found')
  if (file.storagePath) await deleteObjects([file.storagePath])
  await prisma.material.delete({ where: { id } })
}

/* ───────────────────────── Sharing ───────────────────────── */

async function assertOwnsCourse(instructorId: string, courseId: string) {
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { instructorId: true } })
  if (!course || course.instructorId !== instructorId) throw new Error('Course not found')
}

export async function shareFile(instructorId: string, materialId: string, courseId: string) {
  await assertOwnsCourse(instructorId, courseId)
  const file = await prisma.material.findUnique({ where: { id: materialId }, select: { instructorId: true } })
  if (!file || file.instructorId !== instructorId) throw new Error('File not found')
  return prisma.materialShare.upsert({
    where: { materialId_courseId: { materialId, courseId } },
    create: { materialId, courseId },
    update: {},
  })
}

export async function unshareFile(instructorId: string, materialId: string, courseId: string) {
  const file = await prisma.material.findUnique({ where: { id: materialId }, select: { instructorId: true } })
  if (!file || file.instructorId !== instructorId) throw new Error('File not found')
  await prisma.materialShare.deleteMany({ where: { materialId, courseId } })
}

export async function shareFolder(instructorId: string, folderId: string, courseId: string) {
  await assertOwnsCourse(instructorId, courseId)
  const folder = await prisma.materialFolder.findUnique({ where: { id: folderId }, select: { instructorId: true } })
  if (!folder || folder.instructorId !== instructorId) throw new Error('Folder not found')
  return prisma.folderShare.upsert({
    where: { folderId_courseId: { folderId, courseId } },
    create: { folderId, courseId },
    update: {},
  })
}

export async function unshareFolder(instructorId: string, folderId: string, courseId: string) {
  const folder = await prisma.materialFolder.findUnique({ where: { id: folderId }, select: { instructorId: true } })
  if (!folder || folder.instructorId !== instructorId) throw new Error('Folder not found')
  await prisma.folderShare.deleteMany({ where: { folderId, courseId } })
}

/* ───────────────────────── Instructor browsing ───────────────────────── */

/** One level of an instructor's library: the subfolders and files directly under
 *  `parentId` (null = root), each annotated with the courses it's shared to. */
export async function listFolder(instructorId: string, parentId: string | null) {
  // Guard: a non-root folder must belong to this instructor.
  if (parentId) {
    const f = await prisma.materialFolder.findUnique({ where: { id: parentId }, select: { instructorId: true } })
    if (!f || f.instructorId !== instructorId) throw new Error('Folder not found')
  }
  const [folders, files, breadcrumb] = await Promise.all([
    prisma.materialFolder.findMany({
      where: { instructorId, parentId },
      orderBy: { name: 'asc' },
      include: { shares: { select: { courseId: true } }, _count: { select: { children: true, materials: true } } },
    }),
    prisma.material.findMany({
      where: { instructorId, folderId: parentId },
      orderBy: { createdAt: 'desc' },
      include: { shares: { select: { courseId: true } } },
    }),
    parentId ? breadcrumbFor(parentId) : Promise.resolve([]),
  ])
  return { folders, files, breadcrumb }
}

/** Ancestor chain (root → current) for breadcrumb display. */
async function breadcrumbFor(folderId: string): Promise<{ id: string; name: string }[]> {
  const chain: { id: string; name: string }[] = []
  let cur: string | null = folderId
  const seen = new Set<string>()
  while (cur && !seen.has(cur)) {
    seen.add(cur)
    const f: { id: string; name: string; parentId: string | null } | null =
      await prisma.materialFolder.findUnique({ where: { id: cur }, select: { id: true, name: true, parentId: true } })
    if (!f) break
    chain.unshift({ id: f.id, name: f.name })
    cur = f.parentId
  }
  return chain
}

/* ───────────────────────── Student access ───────────────────────── */

async function approvedCourseIds(userId: string): Promise<string[]> {
  const rows = await prisma.enrollment.findMany({
    where: { userId, status: 'APPROVED' },
    select: { courseId: true },
  })
  return rows.map(r => r.courseId)
}

/** All folder ids a set of courses can see: the directly-shared folders plus all
 *  their descendants. */
async function sharedFolderIds(courseIds: string[]): Promise<string[]> {
  if (courseIds.length === 0) return []
  const roots = await prisma.folderShare.findMany({ where: { courseId: { in: courseIds } }, select: { folderId: true } })
  const out = new Set<string>()
  for (const r of roots) (await folderAndDescendants(r.folderId)).forEach(id => out.add(id))
  return Array.from(out)
}

/** Files a student can see: shared directly, shared via a folder, or attached to
 *  one of their courses (legacy). */
export async function getAccessibleFiles(userId: string) {
  const courseIds = await approvedCourseIds(userId)
  if (courseIds.length === 0) return []
  const folderIds = await sharedFolderIds(courseIds)
  return prisma.material.findMany({
    where: {
      OR: [
        { shares: { some: { courseId: { in: courseIds } } } },
        folderIds.length ? { folderId: { in: folderIds } } : { id: '' },
        { courseId: { in: courseIds } },
      ],
    },
    orderBy: { createdAt: 'desc' },
  })
}

/** Whether a given user may download a specific file. */
export async function canAccessFile(userId: string, role: string, fileId: string): Promise<boolean> {
  const file = await prisma.material.findUnique({
    where: { id: fileId },
    select: { instructorId: true, folderId: true, courseId: true, course: { select: { instructorId: true } }, shares: { select: { courseId: true } } },
  })
  if (!file) return false
  if ((role === 'INSTRUCTOR' || role === 'ADMIN') && (file.instructorId === userId || file.course?.instructorId === userId)) return true

  const courseIds = await approvedCourseIds(userId)
  if (courseIds.length === 0) return false
  if (file.courseId && courseIds.includes(file.courseId)) return true
  if (file.shares.some(s => courseIds.includes(s.courseId))) return true
  if (file.folderId) {
    const accessible = await sharedFolderIds(courseIds)
    if (accessible.includes(file.folderId)) return true
  }
  return false
}

export async function getFileStoragePath(fileId: string) {
  return prisma.material.findUnique({ where: { id: fileId }, select: { storagePath: true, fileUrl: true, originalName: true } })
}

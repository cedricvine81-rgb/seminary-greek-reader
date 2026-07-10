import { prisma } from './db'

// The single AppSetting row's fixed id (see prisma schema).
const APP_SETTINGS_ID = 'app'

export async function getAppSettings() {
  return prisma.appSetting.findUnique({ where: { id: APP_SETTINGS_ID } })
}

export async function updateAppSettings(data: {
  instructorNotifyEmail?: string | null
  instructorNotifyEmail2?: string | null
}) {
  return prisma.appSetting.upsert({
    where: { id: APP_SETTINGS_ID },
    create: { id: APP_SETTINGS_ID, ...data },
    update: data,
  })
}

/** The (0–2) addresses to notify when a new instructor registers. */
export async function instructorNotifyRecipients(): Promise<string[]> {
  const s = await getAppSettings()
  return [s?.instructorNotifyEmail, s?.instructorNotifyEmail2]
    .map(e => e?.trim())
    .filter((e): e is string => !!e)
}

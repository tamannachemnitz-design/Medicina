import { prisma } from './db.js'
import { sendMessage } from './sms.js'

export const ESCALATION_WINDOW_MS = 15 * 60 * 1000
export const MISSED_WINDOW_MS = 60 * 60 * 1000

function scheduledDateTime(day: Date, time: string): Date {
  const [h, m] = time.split(':').map(Number)
  const d = new Date(day)
  d.setHours(h, m, 0, 0)
  return d
}

/** Creates today's pending DoseEvent rows for every active medication, across all users. */
export async function ensureAllTodayEvents(now = new Date()): Promise<void> {
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(todayStart)
  todayEnd.setDate(todayEnd.getDate() + 1)

  const [medications, existing] = await Promise.all([
    prisma.medication.findMany({ where: { active: true } }),
    prisma.doseEvent.findMany({
      where: { scheduledFor: { gte: todayStart, lt: todayEnd } },
      select: { medicationId: true, scheduledFor: true },
    }),
  ])

  const seen = new Set(existing.map((e) => `${e.medicationId}|${e.scheduledFor.toISOString()}`))
  const toCreate: { userId: string; medicationId: string; scheduledFor: Date }[] = []

  for (const med of medications) {
    const times = JSON.parse(med.times) as string[]
    for (const time of times) {
      const scheduledFor = scheduledDateTime(now, time)
      const key = `${med.id}|${scheduledFor.toISOString()}`
      if (seen.has(key)) continue
      toCreate.push({ userId: med.userId, medicationId: med.id, scheduledFor })
    }
  }

  if (toCreate.length) await prisma.doseEvent.createMany({ data: toCreate })
}

/** Marks doses that have been pending for over an hour as missed. */
export async function sweepAllMissed(now = new Date()): Promise<void> {
  const cutoff = new Date(now.getTime() - MISSED_WINDOW_MS)
  await prisma.doseEvent.updateMany({
    where: { status: 'pending', scheduledFor: { lt: cutoff } },
    data: { status: 'missed' },
  })
}

/**
 * Escalates doses that are still pending 15+ minutes after their scheduled time:
 * an SMS/WhatsApp fallback to the patient and/or a text to consenting caregivers.
 * Runs server-side so it fires even if no device has the app open — the exact
 * "notification reliability" gap the competitive analysis flagged (§3, §6.5).
 */
export async function escalateOverdue(now = new Date()): Promise<void> {
  const cutoff = new Date(now.getTime() - ESCALATION_WINDOW_MS)
  const overdue = await prisma.doseEvent.findMany({
    where: { status: 'pending', escalatedAt: null, scheduledFor: { lt: cutoff } },
    include: { medication: true, user: { include: { caregivers: true } } },
  })

  for (const event of overdue) {
    const { medication, user } = event

    if (user.consentSmsWhatsappFallback) {
      const message = `Reminder: take ${medication.name} (${medication.dose}). Reply DONE once taken.`
      const target = user.phone ?? '(no phone on file)'
      const delivery = user.phone ? await sendMessage(user.phone, message) : 'logged'
      await prisma.alertLog.create({
        data: {
          userId: user.id,
          channel: 'sms-whatsapp-fallback',
          medicationId: medication.id,
          doseEventId: event.id,
          target,
          message,
          delivery,
        },
      })
    }

    if (user.consentCaregiverAlerts) {
      for (const caregiver of user.caregivers.filter((c) => c.consentGiven)) {
        const message = `${medication.name} dose scheduled for ${event.scheduledFor.toLocaleTimeString()} has not been confirmed yet.`
        const delivery = await sendMessage(caregiver.phone, message)
        await prisma.alertLog.create({
          data: {
            userId: user.id,
            channel: 'caregiver-alert',
            medicationId: medication.id,
            doseEventId: event.id,
            target: caregiver.phone,
            message,
            delivery,
          },
        })
      }
    }

    await prisma.doseEvent.update({ where: { id: event.id }, data: { escalatedAt: now } })
  }
}

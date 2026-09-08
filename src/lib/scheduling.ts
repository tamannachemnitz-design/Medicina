import type { DoseEvent, Medication } from '../types'
import { newId } from './storage'

export const ESCALATION_WINDOW_MS = 15 * 60 * 1000
export const MISSED_WINDOW_MS = 60 * 60 * 1000

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function scheduledDateTime(day: Date, time: string): Date {
  const [h, m] = time.split(':').map(Number)
  const d = new Date(day)
  d.setHours(h, m, 0, 0)
  return d
}

/** Ensures every active medication has a pending DoseEvent for each of today's scheduled times. */
export function ensureTodayEvents(medications: Medication[], existing: DoseEvent[], now = new Date()): DoseEvent[] {
  const today = dateKey(now)
  const seen = new Set(
    existing.filter((e) => e.scheduledFor.slice(0, 10) === today).map((e) => `${e.medicationId}|${e.scheduledFor}`),
  )
  const created: DoseEvent[] = []
  for (const med of medications) {
    if (!med.active) continue
    for (const time of med.times) {
      const scheduledFor = scheduledDateTime(now, time).toISOString()
      const key = `${med.id}|${scheduledFor}`
      if (seen.has(key)) continue
      created.push({
        id: newId(),
        medicationId: med.id,
        scheduledFor,
        status: 'pending',
      })
    }
  }
  return created.length ? [...existing, ...created] : existing
}

/** Marks long-overdue pending doses as missed. Returns the updated list (same reference if nothing changed). */
export function sweepMissedDoses(events: DoseEvent[], now = new Date()): DoseEvent[] {
  let changed = false
  const updated = events.map((e) => {
    if (e.status !== 'pending') return e
    const due = new Date(e.scheduledFor).getTime()
    if (now.getTime() - due > MISSED_WINDOW_MS) {
      changed = true
      return { ...e, status: 'missed' as const }
    }
    return e
  })
  return changed ? updated : events
}

export function isDueForNotification(e: DoseEvent, now = new Date()): boolean {
  return e.status === 'pending' && !e.notifiedAt && new Date(e.scheduledFor).getTime() <= now.getTime()
}

export function isDueForEscalation(e: DoseEvent, now = new Date()): boolean {
  if (e.status !== 'pending' || !e.notifiedAt || e.escalatedAt) return false
  return now.getTime() - new Date(e.scheduledFor).getTime() > ESCALATION_WINDOW_MS
}

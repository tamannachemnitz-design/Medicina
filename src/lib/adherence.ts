import type { DoseEvent } from '../types'

function dateKey(iso: string): string {
  return iso.slice(0, 10)
}

interface DayGroup {
  date: string
  events: DoseEvent[]
}

function groupByDay(events: DoseEvent[]): DayGroup[] {
  const map = new Map<string, DoseEvent[]>()
  for (const e of events) {
    const k = dateKey(e.scheduledFor)
    if (!map.has(k)) map.set(k, [])
    map.get(k)!.push(e)
  }
  return [...map.entries()]
    .map(([date, events]) => ({ date, events }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/** A day "succeeds" once every dose scheduled that day was taken (missed/skipped/unresolved-pending breaks it). */
function daySucceeded(day: DayGroup): boolean {
  return day.events.length > 0 && day.events.every((e) => e.status === 'taken')
}

/** Consecutive fully-adhered days, walking back from today. Today itself only counts once resolved. */
export function currentStreak(events: DoseEvent[], now = new Date()): number {
  const today = now.toISOString().slice(0, 10)
  const byDay = new Map(groupByDay(events).map((d) => [d.date, d]))
  let streak = 0
  const cursor = new Date(now)
  cursor.setHours(0, 0, 0, 0)

  for (let i = 0; i < 3650; i++) {
    const key = cursor.toISOString().slice(0, 10)
    const day = byDay.get(key)
    if (key === today) {
      if (day && day.events.every((e) => e.status === 'taken') && day.events.length > 0) {
        streak += 1
      } else if (!day) {
        // no doses scheduled today yet — skip without breaking the streak
      } else {
        break
      }
    } else if (day) {
      if (daySucceeded(day)) streak += 1
      else break
    }
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function adherenceRate(events: DoseEvent[], now = new Date()): number {
  const resolved = events.filter((e) => new Date(e.scheduledFor).getTime() <= now.getTime())
  if (resolved.length === 0) return 1
  const taken = resolved.filter((e) => e.status === 'taken').length
  return taken / resolved.length
}

export function historyByDay(events: DoseEvent[]): DayGroup[] {
  return groupByDay(events).sort((a, b) => b.date.localeCompare(a.date))
}

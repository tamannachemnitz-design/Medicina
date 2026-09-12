import { ensureAllTodayEvents, escalateOverdue, sweepAllMissed } from './scheduling.js'

const TICK_MS = 30_000

async function tick() {
  try {
    await ensureAllTodayEvents()
    // Escalate before sweeping to 'missed' — otherwise a dose that's overdue
    // past both windows at once (e.g. after the server was down a while)
    // would flip to 'missed' first and never get its escalation alert.
    await escalateOverdue()
    await sweepAllMissed()
  } catch (err) {
    console.error('Scheduler tick failed:', err)
  }
}

export function startScheduler(): void {
  tick()
  setInterval(tick, TICK_MS)
}

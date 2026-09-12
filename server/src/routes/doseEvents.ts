import { Router } from 'express'
import { prisma } from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { serializeDoseEvent } from '../serialize.js'

export const doseEventsRouter = Router()
doseEventsRouter.use(requireAuth)

doseEventsRouter.get('/', async (req, res) => {
  const range = req.query.range === 'all' ? 'all' : 'today'
  const where: Record<string, unknown> = { userId: req.userId }
  if (range === 'today') {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    where.scheduledFor = { gte: start, lt: end }
  }
  const events = await prisma.doseEvent.findMany({ where, orderBy: { scheduledFor: 'asc' } })
  res.json(events.map(serializeDoseEvent))
})

doseEventsRouter.get('/history', async (req, res) => {
  const days = Math.min(Number(req.query.days ?? 30), 365)
  const since = new Date()
  since.setDate(since.getDate() - days)
  const events = await prisma.doseEvent.findMany({
    where: { userId: req.userId, scheduledFor: { gte: since } },
    orderBy: { scheduledFor: 'asc' },
  })
  res.json(events.map(serializeDoseEvent))
})

const VALID_STATUSES = ['taken', 'skipped', 'snoozed']

doseEventsRouter.patch('/:id', async (req, res) => {
  const existing = await prisma.doseEvent.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!existing) return res.status(404).json({ error: 'Not found' })

  const body = req.body as { status?: string; notifiedAt?: boolean }

  if (body.notifiedAt) {
    const updated = await prisma.doseEvent.update({ where: { id: existing.id }, data: { notifiedAt: new Date() } })
    return res.json(serializeDoseEvent(updated))
  }

  if (body.status && !VALID_STATUSES.includes(body.status)) {
    return res.status(400).json({ error: `status must be one of ${VALID_STATUSES.join(', ')}` })
  }

  if (body.status === 'snoozed') {
    const next = new Date(Date.now() + 10 * 60 * 1000)
    const updated = await prisma.doseEvent.update({
      where: { id: existing.id },
      data: { status: 'pending', scheduledFor: next, notifiedAt: null, escalatedAt: null },
    })
    return res.json(serializeDoseEvent(updated))
  }

  if (body.status) {
    const updated = await prisma.doseEvent.update({
      where: { id: existing.id },
      data: { status: body.status, actedAt: new Date() },
    })
    return res.json(serializeDoseEvent(updated))
  }

  res.status(400).json({ error: 'No recognized fields to update' })
})

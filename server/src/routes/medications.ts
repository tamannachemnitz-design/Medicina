import { Router } from 'express'
import { prisma } from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { serializeMedication } from '../serialize.js'
import { ensureAllTodayEvents } from '../scheduling.js'

export const medicationsRouter = Router()
medicationsRouter.use(requireAuth)

medicationsRouter.get('/', async (req, res) => {
  const meds = await prisma.medication.findMany({ where: { userId: req.userId }, orderBy: { createdAt: 'asc' } })
  res.json(meds.map(serializeMedication))
})

interface MedicationBody {
  name?: string
  dose?: string
  frequency?: string
  times?: string[]
  notes?: string
  active?: boolean
}

medicationsRouter.post('/', async (req, res) => {
  const body = req.body as MedicationBody
  if (!body.name || !body.dose || !body.times?.length) {
    return res.status(400).json({ error: 'name, dose, and at least one time are required' })
  }
  const med = await prisma.medication.create({
    data: {
      userId: req.userId!,
      name: body.name,
      dose: body.dose,
      frequency: body.frequency ?? 'custom',
      times: JSON.stringify(body.times),
      notes: body.notes || null,
      active: body.active ?? true,
    },
  })
  await ensureAllTodayEvents()
  res.status(201).json(serializeMedication(med))
})

medicationsRouter.patch('/:id', async (req, res) => {
  const existing = await prisma.medication.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!existing) return res.status(404).json({ error: 'Not found' })

  const body = req.body as MedicationBody
  const data: Record<string, unknown> = {}
  if (body.name !== undefined) data.name = body.name
  if (body.dose !== undefined) data.dose = body.dose
  if (body.frequency !== undefined) data.frequency = body.frequency
  if (body.times !== undefined) data.times = JSON.stringify(body.times)
  if (body.notes !== undefined) data.notes = body.notes || null
  if (body.active !== undefined) data.active = body.active

  const med = await prisma.medication.update({ where: { id: existing.id }, data })
  await ensureAllTodayEvents()
  res.json(serializeMedication(med))
})

medicationsRouter.delete('/:id', async (req, res) => {
  const existing = await prisma.medication.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!existing) return res.status(404).json({ error: 'Not found' })
  await prisma.medication.delete({ where: { id: existing.id } })
  res.status(204).end()
})

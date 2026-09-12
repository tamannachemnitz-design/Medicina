import { Router } from 'express'
import { prisma } from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { serializeCaregiver } from '../serialize.js'

export const caregiversRouter = Router()
caregiversRouter.use(requireAuth)

caregiversRouter.get('/', async (req, res) => {
  const caregivers = await prisma.caregiver.findMany({ where: { userId: req.userId }, orderBy: { createdAt: 'asc' } })
  res.json(caregivers.map(serializeCaregiver))
})

caregiversRouter.post('/', async (req, res) => {
  const { name, phone } = req.body as { name?: string; phone?: string }
  if (!name || !phone) return res.status(400).json({ error: 'name and phone are required' })
  const caregiver = await prisma.caregiver.create({ data: { userId: req.userId!, name, phone, consentGiven: false } })
  res.status(201).json(serializeCaregiver(caregiver))
})

caregiversRouter.patch('/:id', async (req, res) => {
  const existing = await prisma.caregiver.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!existing) return res.status(404).json({ error: 'Not found' })
  const { name, phone, consentGiven } = req.body as { name?: string; phone?: string; consentGiven?: boolean }
  const data: Record<string, unknown> = {}
  if (name !== undefined) data.name = name
  if (phone !== undefined) data.phone = phone
  if (consentGiven !== undefined) data.consentGiven = consentGiven
  const caregiver = await prisma.caregiver.update({ where: { id: existing.id }, data })
  res.json(serializeCaregiver(caregiver))
})

caregiversRouter.delete('/:id', async (req, res) => {
  const existing = await prisma.caregiver.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!existing) return res.status(404).json({ error: 'Not found' })
  await prisma.caregiver.delete({ where: { id: existing.id } })
  res.status(204).end()
})

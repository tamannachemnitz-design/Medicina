import { Router } from 'express'
import { prisma } from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { serializeUser } from '../serialize.js'

export const meRouter = Router()
meRouter.use(requireAuth)

meRouter.get('/', async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } })
  res.json(serializeUser(user))
})

interface ConsentBody {
  essentialStorage?: boolean
  reminders?: boolean
  caregiverAlerts?: boolean
  smsWhatsappFallback?: boolean
}

meRouter.patch('/', async (req, res) => {
  const body = req.body as { phone?: string; consents?: ConsentBody }
  const data: Record<string, unknown> = {}
  if (body.phone !== undefined) data.phone = body.phone || null
  if (body.consents) {
    const c = body.consents
    if (c.essentialStorage !== undefined) data.consentEssentialStorage = c.essentialStorage
    if (c.reminders !== undefined) data.consentReminders = c.reminders
    if (c.caregiverAlerts !== undefined) data.consentCaregiverAlerts = c.caregiverAlerts
    if (c.smsWhatsappFallback !== undefined) data.consentSmsWhatsappFallback = c.smsWhatsappFallback
    data.consentedAt = new Date()
  }
  const user = await prisma.user.update({ where: { id: req.userId }, data })
  res.json(serializeUser(user))
})

meRouter.delete('/', async (req, res) => {
  await prisma.user.delete({ where: { id: req.userId } })
  res.status(204).end()
})

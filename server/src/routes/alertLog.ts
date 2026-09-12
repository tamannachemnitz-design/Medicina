import { Router } from 'express'
import { prisma } from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { serializeAlert } from '../serialize.js'

export const alertLogRouter = Router()
alertLogRouter.use(requireAuth)

alertLogRouter.get('/', async (req, res) => {
  const alerts = await prisma.alertLog.findMany({ where: { userId: req.userId }, orderBy: { sentAt: 'desc' }, take: 200 })
  res.json(alerts.map(serializeAlert))
})

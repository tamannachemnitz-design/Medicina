import { Router } from 'express'
import { prisma } from '../db.js'
import { hashPassword, signToken, verifyPassword } from '../auth.js'
import { serializeUser } from '../serialize.js'

export const authRouter = Router()

authRouter.post('/signup', async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string }
  if (!email || !password || password.length < 8) {
    return res.status(400).json({ error: 'Email and a password of at least 8 characters are required' })
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (existing) return res.status(409).json({ error: 'An account with that email already exists' })

  const user = await prisma.user.create({
    data: { email: email.toLowerCase(), passwordHash: await hashPassword(password) },
  })
  res.status(201).json({ token: signToken({ userId: user.id }), user: serializeUser(user) })
})

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string }
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }
  res.json({ token: signToken({ userId: user.id }), user: serializeUser(user) })
})

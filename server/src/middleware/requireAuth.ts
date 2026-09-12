import type { NextFunction, Request, Response } from 'express'
import { verifyToken } from '../auth.js'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined
  if (!token) return res.status(401).json({ error: 'Missing bearer token' })
  try {
    const { userId } = verifyToken(token)
    req.userId = userId
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

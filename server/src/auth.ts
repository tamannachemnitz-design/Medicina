import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { env } from './env.js'

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export interface TokenPayload {
  userId: string
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: '30d' })
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.jwtSecret) as TokenPayload
}

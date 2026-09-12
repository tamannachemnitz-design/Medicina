import express from 'express'
import cors from 'cors'
import { env } from './env.js'
import { authRouter } from './routes/auth.js'
import { meRouter } from './routes/me.js'
import { medicationsRouter } from './routes/medications.js'
import { doseEventsRouter } from './routes/doseEvents.js'
import { caregiversRouter } from './routes/caregivers.js'
import { alertLogRouter } from './routes/alertLog.js'
import { startScheduler } from './scheduler.js'

const app = express()
app.use(cors({ origin: env.webOrigin }))
app.use(express.json())

app.get('/health', (_req, res) => res.json({ ok: true }))

app.use('/api/auth', authRouter)
app.use('/api/me', meRouter)
app.use('/api/medications', medicationsRouter)
app.use('/api/dose-events', doseEventsRouter)
app.use('/api/caregivers', caregiversRouter)
app.use('/api/alert-log', alertLogRouter)

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(env.port, () => {
  console.log(`Medicina API listening on http://localhost:${env.port}`)
  startScheduler()
})

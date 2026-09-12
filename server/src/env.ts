import 'dotenv/config'

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback
  if (!v) throw new Error(`Missing required env var: ${name}`)
  return v
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: required('JWT_SECRET', 'dev-only-insecure-secret-change-me'),
  webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    smsFrom: process.env.TWILIO_SMS_FROM,
    whatsappFrom: process.env.TWILIO_WHATSAPP_FROM,
  },
}

export const twilioConfigured = Boolean(env.twilio.accountSid && env.twilio.authToken && env.twilio.smsFrom)

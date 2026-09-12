import twilio from 'twilio'
import { env, twilioConfigured } from './env.js'

let client: ReturnType<typeof twilio> | null = null

function getClient() {
  if (!client && twilioConfigured) {
    client = twilio(env.twilio.accountSid!, env.twilio.authToken!)
  }
  return client
}

export type DeliveryResult = 'sent' | 'failed' | 'logged'

/**
 * Sends a real message via Twilio when credentials are configured; otherwise
 * a no-op that reports 'logged' so callers still record the alert in
 * AlertLog. This is the swap-in point for going from MVP demo to live SMS.
 */
export async function sendMessage(to: string, body: string, channel: 'sms' | 'whatsapp' = 'sms'): Promise<DeliveryResult> {
  if (!twilioConfigured) return 'logged'
  const from = channel === 'whatsapp' ? env.twilio.whatsappFrom : env.twilio.smsFrom
  if (!from) return 'logged'
  try {
    const c = getClient()!
    await c.messages.create({ to: channel === 'whatsapp' ? `whatsapp:${to}` : to, from, body })
    return 'sent'
  } catch (err) {
    console.error('Twilio send failed:', err)
    return 'failed'
  }
}

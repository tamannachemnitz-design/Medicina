export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return 'denied'
  if (Notification.permission !== 'default') return Notification.permission
  return Notification.requestPermission()
}

export function showReminderNotification(title: string, body: string): void {
  if (!notificationsSupported() || Notification.permission !== 'granted') return
  try {
    new Notification(title, { body, tag: title, icon: '/favicon.svg' })
  } catch {
    // Some browsers (e.g. iOS Safari without an installed PWA) throw here — the
    // in-app "Today" reminder list is the fallback UI for taken/skip/snooze.
  }
}

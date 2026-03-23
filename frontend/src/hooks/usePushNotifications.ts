import { useState, useEffect } from 'react'

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    setIsSupported('Notification' in window && 'serviceWorker' in navigator)
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) return false
    const result = await Notification.requestPermission()
    setPermission(result)
    return result === 'granted'
  }

  const showNotification = (title: string, body: string): void => {
    if (permission !== 'granted') return
    const notification = new Notification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-72.png',
    })
    notification.onclick = () => {
      window.focus()
      notification.close()
    }
  }

  return { isSupported, permission, requestPermission, showNotification }
}

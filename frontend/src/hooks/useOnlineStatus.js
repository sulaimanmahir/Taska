import { useState, useEffect } from 'react'

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      if (wasOffline) {
        window.dispatchEvent(new CustomEvent('app:back-online'))
      }
      setWasOffline(false)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setWasOffline(true)
      window.dispatchEvent(new CustomEvent('app:offline'))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [wasOffline])

  return { isOnline, wasOffline }
}

export function useOfflineAware() {
  const { isOnline, wasOffline } = useOnlineStatus()

  useEffect(() => {
    if (!isOnline) {
      console.log('App is offline - data will be cached')
    }
  }, [isOnline])

  return { isOnline, wasOffline }
}
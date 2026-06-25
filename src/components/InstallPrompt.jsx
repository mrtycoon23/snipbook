import { useState, useEffect } from 'react'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showIOSHint, setShowIOSHint] = useState(false)
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem('pwa_install_dismissed') === '1'
  )

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    if (isStandalone) return

    const isIOS = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase())
    if (isIOS) {
      setShowIOSHint(true)
      return
    }

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    sessionStorage.setItem('pwa_install_dismissed', '1')
    setDismissed(true)
  }

  if (dismissed) return null
  if (!deferredPrompt && !showIOSHint) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        right: 16,
        zIndex: 9999,
        background: '#2d1b69',
        color: '#fff',
        borderRadius: 14,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
        fontSize: 14,
      }}
    >
      <span>
        {showIOSHint
          ? 'App install karo — Share button dabao, phir "Add to Home Screen"'
          : 'SnipBook ko apne phone pe install karo'}
      </span>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {!showIOSHint && (
          <button
            onClick={handleInstall}
            style={{
              background: '#fff',
              color: '#2d1b69',
              border: 'none',
              borderRadius: 8,
              padding: '6px 12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Install
          </button>
        )}
        <button
          onClick={handleDismiss}
          style={{
            background: 'transparent',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.4)',
            borderRadius: 8,
            padding: '6px 10px',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}

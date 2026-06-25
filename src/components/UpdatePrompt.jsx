import { useRegisterSW } from 'virtual:pwa-register/react'

export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (registration) {
        // har ghante check karo naya version hai ya nahi
        setInterval(() => {
          registration.update()
        }, 60 * 60 * 1000)
      }
    },
  })

  if (!needRefresh) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
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
      <span>Naya version aaya hai</span>
      <button
        onClick={() => updateServiceWorker(true)}
        style={{
          background: '#fff',
          color: '#2d1b69',
          border: 'none',
          borderRadius: 8,
          padding: '6px 14px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Refresh karo
      </button>
    </div>
  )
}

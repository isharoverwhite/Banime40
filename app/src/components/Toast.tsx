import { useEffect, useRef } from 'react'
import anime from 'animejs'

interface ToastProps {
  message: string
  onDismiss: () => void
}

export function Toast({ message, onDismiss }: ToastProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    anime({ targets: ref.current, translateY: [20, 0], opacity: [0, 1], duration: 220, easing: 'easeOutExpo' })
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div
      ref={ref}
      className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-mono max-w-xs"
      style={{
        background: 'linear-gradient(135deg, #2a1428 0%, #1a0e1e 100%)',
        border: '1px solid rgba(248,113,113,0.45)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.6), 0 0 16px rgba(248,113,113,0.2)',
        color: '#fca5a5',
      }}
    >
      <span
        className="material-symbols-outlined shrink-0"
        style={{ fontSize: '16px', fontVariationSettings: "'FILL' 0, 'wght' 500, 'GRAD' 0, 'opsz' 20", color: '#f87171' }}
      >
        error
      </span>
      <span className="flex-1">{message}</span>
      <button
        onClick={onDismiss}
        className="shrink-0 ml-1 transition-colors hover:text-on-surface"
        style={{ color: '#7880a8' }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: '14px', fontVariationSettings: "'FILL' 0, 'wght' 500, 'GRAD' 0, 'opsz' 20" }}
        >
          close
        </span>
      </button>
    </div>
  )
}

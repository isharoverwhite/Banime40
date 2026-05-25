import { useRef, useEffect, useState } from 'react'
import anime from 'animejs'
import type { Keymap } from '../types/keymap'
import { generateKeymapFile } from '../utils/exporter'

interface Props {
  keymap: Keymap
  onClose: () => void
}

const ICON_STYLE = { fontSize: '14px', fontVariationSettings: "'FILL' 0, 'wght' 500, 'GRAD' 0, 'opsz' 20" }

export function ExportModal({ keymap, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  const content = generateKeymapFile(keymap)

  useEffect(() => {
    if (ref.current) {
      anime({ targets: ref.current, opacity: [0, 1], translateY: [12, 0], duration: 200, easing: 'easeOutExpo' })
    }
  }, [])

  const copy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const download = () => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'banime40_remap.keymap'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        ref={ref}
        className="w-[660px] max-h-[80vh] rounded-2xl flex flex-col overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #1a1c35 0%, #111228 100%)',
          border: '1px solid rgba(167,139,250,0.25)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(167,139,250,0.08)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{
            background: 'linear-gradient(90deg, rgba(167,139,250,0.1) 0%, rgba(56,189,248,0.04) 100%)',
            borderBottom: '1px solid rgba(167,139,250,0.15)',
          }}
        >
          <div>
            <p className="text-on-surface font-sans font-semibold text-sm">Export Keymap</p>
            <p className="text-on-surface-variant text-[11px] font-mono mt-0.5">banime40_remap.keymap</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={copy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-sans font-medium transition-all duration-200"
              style={copied
                ? { border: '1px solid rgba(52,211,153,0.6)', color: '#34d399', background: 'rgba(52,211,153,0.1)', boxShadow: '0 0 10px rgba(52,211,153,0.2)' }
                : { border: '1px solid rgba(46,48,96,0.8)', color: '#a8aacc' }
              }
            >
              <span className="material-symbols-outlined" style={ICON_STYLE}>
                {copied ? 'check' : 'content_copy'}
              </span>
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={download}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-sans font-medium transition-all duration-200 hover:brightness-110"
              style={{
                background: 'linear-gradient(135deg, #a78bfa, #8b6cf7)',
                color: '#0f0a2a',
                boxShadow: '0 0 12px rgba(167,139,250,0.35)',
              }}
            >
              <span className="material-symbols-outlined" style={ICON_STYLE}>download</span>
              Download
            </button>
          </div>
        </div>

        {/* Code block */}
        <pre
          className="flex-1 overflow-auto p-6 text-[11px] font-mono leading-relaxed rounded-b-2xl"
          style={{ background: '#070810', color: 'rgba(232,233,248,0.75)' }}
        >
          {content}
        </pre>
      </div>
    </div>
  )
}

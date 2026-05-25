import { useRef, useEffect, useLayoutEffect, useState } from 'react'
import anime from 'animejs'
import type { Binding } from '../types/keymap'
import { LAYER_NAMES } from '../types/keymap'
import { ZMK_KEYCODE_GROUPS, MODIFIER_KEYS, ALL_KEYCODES } from '../data/zmkKeycodes'
import { getDisplayLabel } from '../utils/keyDisplay'
import type { StudioState } from '../studio/useStudioConnection'

const BINDING_TYPES = [
  { value: 'kp',      label: 'Key Press',         hint: '&kp' },
  { value: 'lt',      label: 'Layer Tap',         hint: '&lt' },
  { value: 'mo',      label: 'Momentary Layer',   hint: '&mo' },
  { value: 'mt',      label: 'Mod Tap',           hint: '&mt' },
  { value: 'bt_sel',  label: 'Bluetooth Profile', hint: '&bt BT_SEL' },
  { value: 'bt_clr',  label: 'Clear BT Bond',     hint: '&bt BT_CLR' },
  { value: 'out_usb', label: 'Output: USB',       hint: '&out OUT_USB' },
  { value: 'out_ble', label: 'Output: BLE',       hint: '&out OUT_BLE' },
  { value: 'out_tog', label: 'Output: Toggle',    hint: '&out OUT_TOG' },
  { value: 'none',    label: 'Blocked',           hint: '&none' },
  { value: 'trans',   label: 'Transparent',       hint: '&trans' },
]

const LABEL_STYLE = 'text-on-surface-variant text-[9px] font-sans font-semibold uppercase tracking-[0.1em]'
const SECTION_BG  = { background: 'rgba(9,11,20,0.7)', border: '1px solid rgba(46,48,96,0.6)' }

interface Props {
  position: number
  currentBinding: Binding
  onConfirm: (b: Binding) => void
  onClose: () => void
  layerCount: number
  activeLayerIndex: number
  studio: StudioState
  anchorRect: DOMRect
}

export function KeyBindingModal({
  position, currentBinding, onConfirm, onClose,
  layerCount, activeLayerIndex, studio, anchorRect,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [binding, setBinding] = useState<Binding>({ ...currentBinding })
  const [keySearch, setKeySearch] = useState('')
  const [applyStatus, setApplyStatus] = useState<'idle' | 'applying' | 'ok' | 'error'>('idle')
  const [pos, setPos] = useState({ top: -9999, left: -9999 })

  const row = Math.floor(position / 10)
  const col = position % 10
  const { tap, hold } = getDisplayLabel(binding)

  const allCodes = ZMK_KEYCODE_GROUPS.flatMap(g => g.codes)
  const filteredCodes = keySearch
    ? allCodes.filter(e => {
        const q = keySearch.toLowerCase()
        return e.code.toLowerCase().includes(q)
          || e.label.toLowerCase().includes(q)
          || (e.aliases && e.aliases.some(a => a.toLowerCase().includes(q)))
      })
    : allCodes

  // Position panel next to the anchor key, clamped to viewport
  useLayoutEffect(() => {
    const panel = ref.current
    if (!panel) return

    const panelW = panel.offsetWidth
    const panelH = panel.offsetHeight
    const margin = 10
    const vw = window.innerWidth
    const vh = window.innerHeight

    let left = anchorRect.right + margin
    if (left + panelW > vw - margin) {
      left = anchorRect.left - panelW - margin
    }
    left = Math.max(margin, Math.min(left, vw - panelW - margin))

    let top = anchorRect.top + anchorRect.height / 2 - panelH / 2
    top = Math.max(margin, Math.min(top, vh - panelH - margin))

    setPos({ top, left })

    anime({
      targets: panel,
      opacity: [0, 1],
      scale: [0.93, 1],
      translateY: [6, 0],
      duration: 200,
      easing: 'easeOutExpo',
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Close on click outside panel
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="z-50 rounded-xl flex flex-col overflow-hidden"
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        width: 300,
        background: 'linear-gradient(160deg, #1a1c35 0%, #111228 100%)',
        border: '1px solid rgba(167,139,250,0.22)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.85), 0 0 0 1px rgba(167,139,250,0.07)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 shrink-0"
        style={{
          background: 'linear-gradient(90deg, rgba(167,139,250,0.08) 0%, transparent 100%)',
          borderBottom: '1px solid rgba(167,139,250,0.12)',
        }}
      >
        {/* Mini key preview */}
        <div
          className="w-9 h-8 rounded-md flex flex-col items-center justify-center relative flex-shrink-0"
          style={{
            background: 'linear-gradient(145deg, rgba(167,139,250,0.2) 0%, rgba(167,139,250,0.06) 100%)',
            border: '1.5px solid #a78bfa',
            boxShadow: '0 0 10px rgba(167,139,250,0.25)',
          }}
        >
          <span className="font-mono font-bold text-[11px] leading-none" style={{ color: '#a78bfa' }}>
            {tap || '—'}
          </span>
          {hold && (
            <span className="font-mono text-[7px] mt-0.5 font-bold leading-none" style={{ color: '#f97316' }}>
              {hold}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-on-surface font-sans font-semibold text-xs leading-tight">Edit Binding</p>
          <p className="text-on-surface-variant font-mono leading-tight" style={{ fontSize: 10 }}>
            R{row} C{col} · pos {position}
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-colors hover:bg-white/5"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 14, color: 'rgba(168,170,204,0.5)', fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
          >
            close
          </span>
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2.5 p-3 overflow-y-auto" style={{ maxHeight: 380 }}>
        {/* Binding type */}
        <div className="flex flex-col gap-1">
          <label className={LABEL_STYLE}>Binding Type</label>
          <select
            value={binding.type}
            onChange={e => setBinding({ type: e.target.value as Binding['type'] })}
            className="rounded-lg px-2.5 py-1.5 text-on-surface text-[11px] font-mono outline-none"
            style={SECTION_BG}
          >
            {BINDING_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label} — {t.hint}</option>
            ))}
          </select>
        </div>

        {/* Momentary layer — mo */}
        {binding.type === 'mo' && (
          <div className="flex flex-col gap-1">
            <label className={LABEL_STYLE}>Momentary Layer</label>
            <p className="font-sans" style={{ fontSize: 10, color: 'rgba(168,170,204,0.5)' }}>
              Hold to activate — no tap action
            </p>
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: layerCount }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setBinding(prev => ({ ...prev, layer: i }))}
                  className="px-2 py-1 rounded text-[10px] font-mono transition-all duration-150"
                  style={binding.layer === i
                    ? { background: '#f97316', color: '#1a0a00', fontWeight: 700, boxShadow: '0 0 8px rgba(249,115,22,0.4)' }
                    : { ...SECTION_BG, color: '#a8aacc' }
                  }
                >
                  L{i} {LAYER_NAMES[i]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tap key picker — kp / lt / mt */}
        {(binding.type === 'kp' || binding.type === 'lt' || binding.type === 'mt') && (
          <div className="flex flex-col gap-1">
            <label className={LABEL_STYLE}>Tap Key</label>
            <input
              type="text"
              placeholder="Search keycodes…"
              value={keySearch}
              onChange={e => setKeySearch(e.target.value)}
              className="rounded-lg px-2.5 py-1.5 text-on-surface text-[11px] font-mono outline-none"
              style={SECTION_BG}
            />
            <div
              className="rounded-lg p-1.5 flex flex-wrap gap-1 overflow-y-auto"
              style={{ ...SECTION_BG, maxHeight: 144 }}
            >
              {filteredCodes.map(entry => (
                <button
                  key={entry.code}
                  onClick={() => setBinding(prev => ({ ...prev, key: entry.code }))}
                  title={`${entry.code}${entry.aliases ? ' — ' + entry.aliases.slice(0, 2).join(', ') : ''}`}
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono transition-all duration-150"
                  style={binding.key === entry.code
                    ? { background: '#a78bfa', color: '#0f0a2a', boxShadow: '0 0 6px rgba(167,139,250,0.4)' }
                    : { background: 'rgba(167,139,250,0.06)', color: '#a8aacc', border: '1px solid rgba(167,139,250,0.1)' }
                  }
                >
                  {entry.label}
                  <span className="ml-1 opacity-40" style={{ fontSize: 8 }}>{entry.code}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Hold modifier — mt */}
        {binding.type === 'mt' && (
          <div className="flex flex-col gap-1">
            <label className={LABEL_STYLE}>Hold Modifier</label>
            <div className="flex flex-wrap gap-1">
              {MODIFIER_KEYS.map(mod => {
                const entry = ALL_KEYCODES.find(e => e.code === mod)
                return (
                  <button
                    key={mod}
                    onClick={() => setBinding(prev => ({ ...prev, mod }))}
                    className="px-2 py-1 rounded text-[10px] font-mono transition-all duration-150"
                    style={binding.mod === mod
                      ? { background: '#a78bfa', color: '#0f0a2a', boxShadow: '0 0 6px rgba(167,139,250,0.4)' }
                      : { ...SECTION_BG, color: '#a8aacc' }
                    }
                  >
                    {entry?.label ?? mod}
                    <span className="ml-1 opacity-40" style={{ fontSize: 8 }}>{mod}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Hold layer — lt */}
        {binding.type === 'lt' && (
          <div className="flex flex-col gap-1">
            <label className={LABEL_STYLE}>Hold Layer</label>
            <div className="flex gap-1 flex-wrap">
              {Array.from({ length: layerCount }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setBinding(prev => ({ ...prev, layer: i }))}
                  className="flex-1 py-1.5 rounded text-[10px] font-mono transition-all duration-150"
                  style={binding.layer === i
                    ? { background: '#f97316', color: '#1a0a00', fontWeight: 700, boxShadow: '0 0 8px rgba(249,115,22,0.4)' }
                    : { ...SECTION_BG, color: '#a8aacc' }
                  }
                >
                  L{i} {LAYER_NAMES[i]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* BT profile — bt_sel */}
        {binding.type === 'bt_sel' && (
          <div className="flex flex-col gap-1">
            <label className={LABEL_STYLE}>BT Profile</label>
            <div className="flex gap-1">
              {[0,1,2,3,4].map(p => (
                <button
                  key={p}
                  onClick={() => setBinding(prev => ({ ...prev, profile: p }))}
                  className="flex-1 py-1.5 rounded text-[10px] font-mono transition-all duration-150"
                  style={binding.profile === p
                    ? { background: '#38bdf8', color: '#001a2a', fontWeight: 700, boxShadow: '0 0 8px rgba(56,189,248,0.4)' }
                    : { ...SECTION_BG, color: '#a8aacc' }
                  }
                >
                  #{p + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="flex gap-1.5 px-3 py-2.5 shrink-0"
        style={{ borderTop: '1px solid rgba(46,48,96,0.4)' }}
      >
        <button
          onClick={onClose}
          className="flex-1 py-2 rounded-lg text-[11px] font-sans transition-all hover:bg-white/5"
          style={{ border: '1px solid rgba(46,48,96,0.8)', color: '#a8aacc' }}
        >
          Cancel
        </button>

        {studio.status === 'unlocked' && (
          <button
            disabled={applyStatus === 'applying'}
            onClick={async () => {
              setApplyStatus('applying')
              const result = await studio.applyBinding(activeLayerIndex, position, binding)
              setApplyStatus(result === 'ok' ? 'ok' : 'error')
              if (result === 'ok') {
                onConfirm(binding)
                setTimeout(() => setApplyStatus('idle'), 800)
              } else {
                setTimeout(() => setApplyStatus('idle'), 1500)
              }
            }}
            className="flex-1 py-2 rounded-lg text-[11px] font-sans transition-all"
            style={
              applyStatus === 'ok'       ? { background: '#34d399', color: '#001a10' } :
              applyStatus === 'error'    ? { background: '#f87171', color: '#1a0000' } :
              applyStatus === 'applying' ? { background: '#10b981', color: '#001a10', opacity: 0.7 } :
              { background: '#34d399', color: '#001a10', boxShadow: '0 0 10px rgba(52,211,153,0.3)' }
            }
          >
            {applyStatus === 'applying' ? '…' :
             applyStatus === 'ok'       ? '✓' :
             applyStatus === 'error'    ? '✕' : 'Apply'}
          </button>
        )}

        <button
          onClick={() => onConfirm(binding)}
          className="flex-1 py-2 rounded-lg text-[11px] font-sans transition-all hover:brightness-110"
          style={{
            background: 'linear-gradient(135deg, #a78bfa, #8b6cf7)',
            color: '#0f0a2a',
            boxShadow: '0 0 12px rgba(167,139,250,0.3)',
          }}
        >
          {studio.status === 'unlocked' ? 'Save' : 'Confirm'}
        </button>
      </div>
    </div>
  )
}

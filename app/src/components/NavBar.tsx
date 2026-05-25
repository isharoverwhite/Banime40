import type { SpacebarVariant } from '../types/keymap'
import { VARIANT_LABELS } from '../data/layoutVariants'
import type { StudioState } from '../studio/useStudioConnection'

const VARIANTS: SpacebarVariant[] = ['ortho', '2x2.25u', '6.25u']

interface NavBarProps {
  variant: SpacebarVariant
  onVariantChange: (v: SpacebarVariant) => void
  onSave: () => void
  onExport: () => void
  onReset: () => void
  isDirty: boolean
  saveStatus: 'idle' | 'saving' | 'saved'
  studio: StudioState
  macLayout?: boolean
  onMacLayoutToggle?: () => void
  batteryLevel?: number | null
}

const STUDIO_BADGE: Record<string, { label: string; icon: string }> = {
  disconnected: { label: 'Connect',     icon: 'usb' },
  connecting:   { label: 'Connecting…', icon: 'sync' },
  locked:       { label: 'Unlock',      icon: 'lock' },
  unlocked:     { label: 'Live',        icon: 'bolt' },
  error:        { label: 'Retry',       icon: 'error' },
}

const ICON_STYLE = { fontSize: '14px', fontVariationSettings: "'FILL' 0, 'wght' 500, 'GRAD' 0, 'opsz' 20" }

export function NavBar({ variant, onVariantChange, onSave, onExport, onReset, isDirty, saveStatus, studio, macLayout, onMacLayoutToggle, batteryLevel }: NavBarProps) {
  const handleConnectClick = () => {
    if (studio.status === 'disconnected' || studio.status === 'error') {
      studio.connect('usb')
    } else {
      studio.disconnect()
    }
  }

  const studioCls = (() => {
    switch (studio.status) {
      case 'unlocked':   return 'border-green/50 text-green bg-green/8 shadow-[0_0_12px_rgba(52,211,153,0.2)]'
      case 'locked':     return 'border-amber/50 text-amber bg-amber/8'
      case 'connecting': return 'border-outline-variant text-on-surface-variant cursor-wait'
      case 'error':      return 'border-red/50 text-red bg-red/8'
      default:           return 'border-outline-variant text-on-surface-variant hover:text-on-surface hover:border-blue/40'
    }
  })()

  const badge = STUDIO_BADGE[studio.status] ?? STUDIO_BADGE.disconnected

  return (
    <header
      className="h-14 flex items-center px-5 gap-3 shrink-0 relative"
      style={{
        background: 'rgba(11,13,22,0.96)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(167,139,250,0.15)',
        boxShadow: '0 1px 0 rgba(167,139,250,0.06)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 mr-auto">
        <span
          className="material-symbols-outlined"
          style={{ ...ICON_STYLE, fontSize: '18px', background: 'linear-gradient(135deg, #a78bfa, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          keyboard
        </span>
        <span
          className="font-mono font-bold text-sm tracking-tight"
          style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #c4b5fd 60%, #38bdf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          Banime40
        </span>
        <span className="text-[10px] font-mono text-on-surface-variant/40 tracking-widest uppercase">remap</span>
      </div>

      {/* Studio connect */}
      <button
        onClick={handleConnectClick}
        disabled={studio.status === 'connecting'}
        title={studio.status === 'unlocked' ? `Connected: ${studio.label}` : undefined}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-sans font-medium border transition-all duration-200 ${studioCls}`}
      >
        <span className="material-symbols-outlined" style={ICON_STYLE}>{badge.icon}</span>
        {badge.label}
      </button>

      {/* Battery */}
      {batteryLevel != null && (
        <div
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-medium"
          style={{
            background: 'rgba(52,211,153,0.08)',
            border: '1px solid rgba(52,211,153,0.25)',
            color: '#6ee7b7',
          }}
          title={`Pin: ${batteryLevel}%`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '13px', fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 20" }}>
            {batteryLevel >= 90 ? 'battery_full' : batteryLevel >= 60 ? 'battery_5_bar' : batteryLevel >= 30 ? 'battery_3_bar' : 'battery_alert'}
          </span>
          {batteryLevel}%
        </div>
      )}

      {/* Divider */}
      <div className="h-5 w-px bg-outline-variant/60" />

      {/* Mac / Win toggle */}
      <button
        onClick={onMacLayoutToggle}
        className="relative flex items-center rounded-lg p-0.5 text-[11px] font-sans font-medium transition-all"
        style={{ background: 'rgba(26,28,50,0.9)', border: '1px solid rgba(167,139,250,0.2)' }}
      >
        <div
          className={`absolute top-0.5 h-[calc(100%-4px)] w-[calc(50%-2px)] rounded-md transition-all duration-200 ${
            macLayout ? 'translate-x-[calc(100%+2px)]' : 'translate-x-0'
          }`}
          style={{ background: 'linear-gradient(135deg, #a78bfa, #8b6cf7)', boxShadow: '0 0 8px rgba(167,139,250,0.4)' }}
        />
        <span className={`relative z-10 px-3 py-1.5 transition-colors duration-200 ${!macLayout ? 'text-[#0f0a2a]' : 'text-on-surface-variant'}`}>
          Win
        </span>
        <span className={`relative z-10 px-3 py-1.5 transition-colors duration-200 ${macLayout ? 'text-[#0f0a2a]' : 'text-on-surface-variant'}`}>
          Mac
        </span>
      </button>

      {/* Spacebar variant */}
      <div
        className="flex items-center rounded-lg p-0.5"
        style={{ background: 'rgba(26,28,50,0.9)', border: '1px solid rgba(167,139,250,0.2)' }}
      >
        {VARIANTS.map(v => (
          <button
            key={v}
            onClick={() => onVariantChange(v)}
            className={`px-3 py-1.5 rounded-md text-[11px] font-sans font-medium transition-all duration-200 ${
              v === variant ? 'text-[#0f0a2a]' : 'text-on-surface-variant hover:text-on-surface'
            }`}
            style={v === variant ? {
              background: 'linear-gradient(135deg, #a78bfa, #8b6cf7)',
              boxShadow: '0 0 8px rgba(167,139,250,0.4)',
            } : {}}
          >
            {VARIANT_LABELS[v]}
          </button>
        ))}
      </div>

      {/* Reset */}
      <button
        onClick={onReset}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-sans font-medium border border-red/30 text-red hover:bg-red/8 hover:border-red/50 transition-all duration-200"
        title="Restore all layers to factory defaults"
      >
        <span className="material-symbols-outlined" style={ICON_STYLE}>restart_alt</span>
        Reset
      </button>

      {/* Save */}
      <button
        onClick={onSave}
        disabled={saveStatus === 'saving'}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-sans font-medium border transition-all duration-200 ${
          saveStatus === 'saved'
            ? 'border-green/50 text-green bg-green/8 shadow-[0_0_12px_rgba(52,211,153,0.2)]'
            : isDirty
            ? 'border-blue/50 text-blue hover:bg-blue/10 hover:shadow-[0_0_12px_rgba(167,139,250,0.25)]'
            : 'border-outline-variant text-on-surface-variant/50 cursor-default'
        }`}
      >
        <span className="material-symbols-outlined" style={ICON_STYLE}>
          {saveStatus === 'saving' ? 'progress_activity' : saveStatus === 'saved' ? 'check' : 'save'}
        </span>
        {saveStatus === 'saving' ? '…' : saveStatus === 'saved' ? 'Saved' : 'Save'}
      </button>

      {/* Export */}
      <button
        onClick={onExport}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-sans font-medium transition-all duration-200 hover:brightness-110"
        style={{
          background: 'linear-gradient(135deg, #a78bfa, #8b6cf7)',
          color: '#0f0a2a',
          boxShadow: '0 0 12px rgba(167,139,250,0.35)',
        }}
      >
        <span className="material-symbols-outlined" style={ICON_STYLE}>file_export</span>
        Export .keymap
      </button>
    </header>
  )
}

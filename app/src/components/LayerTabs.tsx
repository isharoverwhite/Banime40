import { useRef } from 'react'
import anime from 'animejs'
import type { Layer } from '../types/keymap'

const LAYER_ICONS: Record<number, string> = {
  0: 'keyboard',
  1: 'dialpad',
  2: 'keyboard_command_key',
  3: 'near_me',
  4: 'settings',
}

const LAYER_COLORS: Record<number, { active: string; idle: string; glow: string }> = {
  0: { active: '#a78bfa', idle: '#7c6fc0', glow: 'rgba(167,139,250,0.35)' },
  1: { active: '#38bdf8', idle: '#2b8fc0', glow: 'rgba(56,189,248,0.35)'  },
  2: { active: '#f97316', idle: '#c25a10', glow: 'rgba(249,115,22,0.35)'  },
  3: { active: '#34d399', idle: '#28a074', glow: 'rgba(52,211,153,0.35)'  },
  4: { active: '#f87171', idle: '#c05858', glow: 'rgba(248,113,113,0.35)' },
}

// Per-layer click animation for the button and icon
type TabAnimFn = (btn: HTMLElement, icon: Element | null) => void

const LAYER_TAB_ANIMS: Record<number, TabAnimFn> = {
  // L0 BASE — keyboard: physical key-press feel, NO rotation
  0: (btn, icon) => {
    anime({ targets: btn, translateY: [0, 3, -1, 0], scale: [1, 0.96, 1.02, 1], duration: 300, easing: 'easeOutElastic(1, 0.5)' })
    if (icon) anime({ targets: icon, translateY: [0, 2, 0], duration: 220, easing: 'easeOutQuad' })
  },
  // L1 NUM/SYM — dialpad: digit-press pop/bounce
  1: (btn, icon) => {
    anime({ targets: btn, scale: [1, 0.82, 1.10, 1], duration: 300, easing: 'easeOutElastic(1, 0.55)' })
    if (icon) anime({ targets: icon, scale: [1, 0.75, 1.15, 1], duration: 280, easing: 'easeOutElastic(1, 0.6)' })
  },
  // L2 FN/MEDIA — command key: horizontal slide-snap (like pressing a function key sideways)
  2: (btn, icon) => {
    anime({ targets: btn, translateX: [0, -5, 4, -2, 0], duration: 280, easing: 'easeOutQuad' })
    if (icon) anime({ targets: icon, translateX: [0, -6, 5, 0], duration: 260, easing: 'easeOutSine' })
  },
  // L3 NAV — compass: small directional pivot (≤20°), feels like a needle settling
  3: (btn, icon) => {
    anime({ targets: btn, scale: [1, 0.90, 1.04, 1], duration: 300, easing: 'easeOutElastic(1, 0.6)' })
    if (icon) anime({ targets: icon, rotate: [0, -18, 14, -6, 0], duration: 380, easing: 'easeOutElastic(1, 0.5)' })
  },
  // L4 SYSTEM — gear: full rotation is physically correct for a cog
  4: (btn, icon) => {
    anime({ targets: btn, scale: [1, 0.88, 1.05, 1], duration: 320, easing: 'easeOutBack' })
    if (icon) anime({ targets: icon, rotate: [0, 180], duration: 350, easing: 'easeOutQuad' })
  },
}

// Per-layer indicator rendered inside each tab button.
// Active = full brightness with glow; inactive = dimmed, no glow.
function LayerIndicator({ layerId, isActive, color, glow, idleColor }: { layerId: number; isActive: boolean; color: string; glow: string; idleColor: string }) {
  const c = isActive ? color : idleColor
  const shadow = isActive ? `0 0 6px ${glow}` : 'none'

  switch (layerId) {
    // L0 — flat bar
    case 0:
      return (
        <div
          className="rounded-full"
          style={{ width: 16, height: 2, background: c, boxShadow: shadow }}
        />
      )
    // L1 — three dots (dialpad style)
    case 1:
      return (
        <div className="flex gap-0.5 items-center">
          {[0, 1, 2].map(i => (
            <div key={i} className="rounded-full" style={{ width: 3, height: 3, background: c, boxShadow: shadow, opacity: isActive ? (i === 1 ? 1 : 0.65) : 0.5 }} />
          ))}
        </div>
      )
    // L2 — wide media-slider bar
    case 2:
      return (
        <div className="relative flex items-center" style={{ width: 28, height: 4 }}>
          <div className="absolute inset-0 rounded-full" style={{ background: `${c}30` }} />
          <div className="rounded-full" style={{ width: 14, height: 2, background: c, boxShadow: shadow, marginLeft: 2 }} />
        </div>
      )
    // L3 — circle dot (radar ping)
    case 3:
      return (
        <div
          className="rounded-full"
          style={{ width: 6, height: 6, background: c, boxShadow: isActive ? `0 0 8px ${glow}, 0 0 14px ${glow}` : 'none' }}
        />
      )
    // L4 — two short lines (like a gear tooth pair)
    case 4:
      return (
        <div className="flex gap-1 items-center">
          <div className="rounded-full" style={{ width: 6, height: 2, background: c, boxShadow: shadow }} />
          <div className="rounded-full" style={{ width: 6, height: 2, background: c, boxShadow: shadow }} />
        </div>
      )
    default:
      return <div className="rounded-full" style={{ width: 16, height: 2, background: c, boxShadow: shadow }} />
  }
}

interface LayerTabsProps {
  layers: Layer[]
  activeLayer: number
  onLayerChange: (id: number) => void
}

export function LayerTabs({ layers, activeLayer, onLayerChange }: LayerTabsProps) {
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([])

  const handleClick = (id: number, idx: number) => {
    if (id === activeLayer) return

    const btn = btnRefs.current[idx]
    if (btn) {
      const icon = btn.querySelector('.tab-icon')
      const animFn = LAYER_TAB_ANIMS[id] ?? LAYER_TAB_ANIMS[0]
      animFn(btn, icon)
    }

    onLayerChange(id)
  }

  return (
    <nav
      className="h-16 flex items-center justify-center px-6 gap-2 shrink-0"
      style={{
        background: 'rgba(11,13,22,0.96)',
        borderTop: '1px solid rgba(167,139,250,0.12)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <div
        className="flex items-center gap-1 px-1.5 py-1.5 rounded-2xl"
        style={{
          background: 'rgba(20,22,40,0.9)',
          border: '1px solid rgba(167,139,250,0.15)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        {layers.map((layer, idx) => {
          const isActive = layer.id === activeLayer
          const lc = LAYER_COLORS[layer.id] ?? LAYER_COLORS[0]

          return (
            <button
              key={layer.id}
              ref={el => { btnRefs.current[idx] = el }}
              onClick={() => handleClick(layer.id, idx)}
              className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl relative overflow-hidden"
              style={{
                border: isActive ? `1px solid ${lc.active}40` : `1px solid ${lc.idle}18`,
                background: isActive
                  ? `linear-gradient(145deg, ${lc.active}22 0%, ${lc.active}0d 100%)`
                  : 'transparent',
                boxShadow: isActive
                  ? `0 0 16px ${lc.glow}, inset 0 1px 0 rgba(255,255,255,0.06)`
                  : 'none',
                transition: 'background 250ms ease, box-shadow 250ms ease, border-color 250ms ease',
              }}
            >
              {/* Per-layer indicator at the top */}
              <div className="flex items-center justify-center" style={{ height: 8 }}>
                <LayerIndicator layerId={layer.id} isActive={isActive} color={lc.active} glow={lc.glow} idleColor={lc.idle} />
              </div>

              <span
                className="material-symbols-outlined tab-icon"
                style={{
                  fontSize: '18px',
                  fontVariationSettings: isActive
                    ? "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 20"
                    : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20",
                  color: isActive ? lc.active : lc.idle,
                  filter: isActive ? `drop-shadow(0 0 4px ${lc.glow})` : 'none',
                  transition: 'color 250ms ease, filter 250ms ease',
                }}
              >
                {LAYER_ICONS[layer.id] ?? 'layers'}
              </span>
              <span
                className="text-[9px] font-mono font-bold tracking-[0.1em] uppercase leading-none"
                style={{
                  color: isActive ? lc.active : lc.idle,
                  transition: 'color 250ms ease',
                }}
              >
                L{layer.id}&nbsp;{layer.name}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

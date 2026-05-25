import { useRef, useState } from 'react'
import anime from 'animejs'
import type { Binding } from '../types/keymap'
import { getDisplayLabel, getKeyColorVariant } from '../utils/keyDisplay'

interface KeyCapProps {
  binding: Binding
  isSelected: boolean
  isActive: boolean
  onClick: (rect: DOMRect) => void
  widthPx?: number
  macLayout?: boolean
  /** Color for layer-trigger accent bar & hold text (lt/mo targets a specific layer) */
  layerColor?: string
  layerGlow?: string
}

const VARIANT_CONFIG: Record<string, { glow: string; border: string; textColor: string }> = {
  modifier:        { glow: 'rgba(167,139,250,0.45)',  border: '#a78bfa',              textColor: '#e8e9f8' },
  'layer-trigger': { glow: 'rgba(249,115,22,0.45)',   border: '#f97316',              textColor: '#e8e9f8' },
  arrow:           { glow: 'rgba(52,211,153,0.45)',   border: '#34d399',              textColor: '#34d399' },
  bt:              { glow: 'rgba(56,189,248,0.4)',    border: '#38bdf8',              textColor: '#38bdf8' },
  normal:          { glow: 'rgba(167,139,250,0.35)',  border: 'rgba(167,139,250,0.6)', textColor: '#e8e9f8' },
  trans:           { glow: 'rgba(168,170,204,0.15)',  border: 'rgba(168,170,204,0.3)', textColor: 'rgba(168,170,204,0.35)' },
}

export function KeyCap({ binding, isSelected, isActive, onClick, widthPx, macLayout, layerColor, layerGlow }: KeyCapProps) {
  const ref = useRef<HTMLButtonElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const { tap, hold } = getDisplayLabel(binding, macLayout)
  const variant = getKeyColorVariant(binding)
  const vc = VARIANT_CONFIG[variant] ?? VARIANT_CONFIG.normal

  const w = widthPx ?? 64
  const isClickable = isActive && variant !== 'none'
  const showHover = isHovered && isClickable && !isSelected

  const handleClick = () => {
    if (!isActive) return
    const rect = ref.current?.getBoundingClientRect() ?? new DOMRect()
    if (ref.current) {
      anime({ targets: ref.current, scale: [1, 0.90, 1], duration: 150, easing: 'easeOutQuad' })
    }
    onClick(rect)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    // Stop propagation so the modal's outside-click handler doesn't fire when
    // clicking a key — toggle/switch is handled by the click event instead.
    e.stopPropagation()
  }

  // --- unified style computation (no DOM mutation) ---

  const background = (() => {
    if (isSelected) return 'linear-gradient(145deg, rgba(167,139,250,0.22) 0%, rgba(167,139,250,0.08) 100%)'
    if (!isActive || variant === 'none') return '#090b14'
    return 'linear-gradient(145deg, #252848 0%, #161830 100%)'
  })()

  const borderColor = (() => {
    if (isSelected)                      return '#a78bfa'
    if (!isActive || variant === 'none') return 'rgba(46,48,96,0.6)'
    if (showHover)                       return vc.border
    if (variant === 'trans')             return 'rgba(168,170,204,0.2)'
    return 'rgba(46,48,96,0.9)'
  })()

  const borderWidth  = isSelected ? '2px' : '1px'
  const borderStyle2 = variant === 'trans' && !isSelected ? 'dashed' : 'solid'

  const boxShadow = (() => {
    if (isSelected)
      return `0 0 0 1px #a78bfa, 0 0 18px rgba(167,139,250,0.55), inset 0 1px 0 rgba(255,255,255,0.08)`
    if (showHover)
      return `inset 0 1px 0 rgba(255,255,255,0.09), 0 6px 16px rgba(0,0,0,0.6), 0 0 14px ${vc.glow}`
    if (!isActive || variant === 'none')
      return 'inset 0 1px 0 rgba(255,255,255,0.01), 0 2px 4px rgba(0,0,0,0.6)'
    return 'inset 0 1px 0 rgba(255,255,255,0.06), 0 3px 8px rgba(0,0,0,0.6)'
  })()

  // Use inline transform so it doesn't conflict with Tailwind CSS-var transforms
  const transform = isSelected || showHover ? 'translateY(-2px)' : 'translateY(0)'

  const textColor = (() => {
    if (!isActive || variant === 'none') return 'rgba(46,48,96,0.6)'
    if (isSelected) return '#a78bfa'
    if (variant === 'trans') return 'rgba(168,170,204,0.3)'
    return vc.textColor
  })()

  // Per-layer color for lt/mo; fallback to default orange for mt
  const triggerColor  = layerColor ?? '#f97316'
  const triggerGlow   = layerGlow   ?? 'rgba(249,115,22,0.7)'

  const accentBar = (() => {
    if (!isActive || isSelected) return null
    if (variant === 'modifier')
      return <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full" style={{ background: '#a78bfa', boxShadow: '0 0 6px rgba(167,139,250,0.7)' }} />
    if (variant === 'layer-trigger')
      return <div className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full" style={{ background: triggerColor, boxShadow: `0 0 6px ${triggerGlow}` }} />
    return null
  })()

  return (
    <button
      ref={ref}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={!isActive || variant === 'none'}
      className={[
        'keycap relative flex flex-col items-center justify-center h-16 rounded-lg',
        'font-mono select-none',
        isClickable ? 'cursor-pointer' : 'cursor-not-allowed',
        !isActive || variant === 'none' ? 'opacity-[0.15]' : '',
      ].join(' ')}
      style={{
        width: `${w}px`,
        background,
        border: `${borderWidth} ${borderStyle2} ${borderColor}`,
        boxShadow,
        transform,
        transition: 'transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease',
      }}
    >
      {accentBar}

      {isActive && variant !== 'none' && (
        <div
          className="absolute top-0 left-1 right-1 h-px rounded-full pointer-events-none"
          style={{ background: 'rgba(255,255,255,0.07)' }}
        />
      )}

      <span className="text-[13px] font-semibold leading-none tracking-wide" style={{ color: textColor }}>
        {tap}
      </span>

      {hold && (
        <span
          className="absolute bottom-1 text-[9px] font-bold leading-none tracking-wider"
          style={{ color: triggerColor, textShadow: `0 0 8px ${triggerGlow}` }}
        >
          {hold}
        </span>
      )}
    </button>
  )
}

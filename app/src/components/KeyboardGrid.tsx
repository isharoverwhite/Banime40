import { useMemo, useRef, useEffect, useState } from 'react'
import anime from 'animejs'
import type { Binding, Layer, SpacebarVariant } from '../types/keymap'
import { ROWS, COLS } from '../types/keymap'
import { ROW3_LAYOUT, spanWidth, computeLayerActivePositions } from '../data/layoutVariants'
import { KeyCap } from './KeyCap'
import { KeyLegend } from './KeyLegend'

interface KeyboardGridProps {
  layerName: string
  layerId: number
  bindings: Binding[]
  selectedKey: number | null
  spacebarVariant: SpacebarVariant
  allLayers: Layer[]
  activeLayerIndex: number
  macLayout?: boolean
  onKeyClick: (position: number, rect: DOMRect) => void
}

const LAYER_COLORS: Record<number, { badge: string; glow: string; text: string; rgb: string }> = {
  0: { badge: 'rgba(167,139,250,0.15)', glow: 'rgba(167,139,250,0.5)',  text: '#a78bfa', rgb: '167,139,250' },
  1: { badge: 'rgba(56,189,248,0.15)',  glow: 'rgba(56,189,248,0.5)',   text: '#38bdf8', rgb: '56,189,248'  },
  2: { badge: 'rgba(249,115,22,0.15)',  glow: 'rgba(249,115,22,0.5)',   text: '#f97316', rgb: '249,115,22'  },
  3: { badge: 'rgba(52,211,153,0.15)',  glow: 'rgba(52,211,153,0.5)',   text: '#34d399', rgb: '52,211,153'  },
  4: { badge: 'rgba(248,113,113,0.15)', glow: 'rgba(248,113,113,0.5)',  text: '#f87171', rgb: '248,113,113' },
}

// ── Per-layer animation personality ──────────────────────────────────────────
type StaggerFrom = 'first' | 'last' | 'center'
type LayerAnimCfg = {
  staggerFrom: StaggerFrom
  staggerDelay: number
  exitDuration:  number
  enterDuration: number
  exitEasing:    string
  enterEasing:   string
  exitProps:  (dir: number) => Record<string, unknown>
  enterProps: (dir: number) => Record<string, unknown>
}

const LAYER_ANIMS: Record<number, LayerAnimCfg> = {
  // L0 BASE — typewriter: keys rise column-by-column from the dominant direction
  0: {
    staggerFrom: 'first', staggerDelay: 14,
    exitDuration: 130,  enterDuration: 230,
    exitEasing: 'easeInQuad', enterEasing: 'easeOutExpo',
    exitProps:  (dir) => ({ opacity: [1, 0], translateY: [0, dir * 12], scale: [1, 0.90] }),
    enterProps: (dir) => ({ opacity: [0, 1], translateY: [dir * -12, 0], scale: [0.90, 1] }),
  },
  // L1 NUM/SYM — card flip: 3D rotateX row-by-row (like flipping physical keycaps)
  1: {
    staggerFrom: 'first', staggerDelay: 16,
    exitDuration: 110,  enterDuration: 260,
    exitEasing: 'easeInQuad', enterEasing: 'easeOutBack',
    exitProps:  (_dir) => ({ opacity: [1, 0], rotateX: [0, 80], scale: [1, 0.88] }),
    enterProps: (_dir) => ({ opacity: [0, 1], rotateX: [-80, 0], scale: [0.88, 1] }),
  },
  // L2 FN/MEDIA — horizontal wipe: keys slide left or right based on direction
  2: {
    staggerFrom: 'first', staggerDelay: 10,
    exitDuration: 110,  enterDuration: 210,
    exitEasing: 'easeInSine', enterEasing: 'easeOutSine',
    exitProps:  (dir) => ({ opacity: [1, 0], translateX: [0, dir * -20] }),
    enterProps: (dir) => ({ opacity: [0, 1], translateX: [dir * 20, 0] }),
  },
  // L3 NAV — radar ripple: keys radiate outward/inward from center
  3: {
    staggerFrom: 'center', staggerDelay: 18,
    exitDuration: 140,  enterDuration: 300,
    exitEasing: 'easeInCubic', enterEasing: 'easeOutElastic(1, 0.65)',
    exitProps:  (_dir) => ({ opacity: [1, 0], scale: [1, 0.55], translateY: [0, 6] }),
    enterProps: (_dir) => ({ opacity: [0, 1], scale: [0.55, 1], translateY: [6, 0] }),
  },
  // L4 SYSTEM — gear: keys flip around Y-axis (3D) + collapse — no XY overflow
  4: {
    staggerFrom: 'center', staggerDelay: 20,
    exitDuration: 140,  enterDuration: 300,
    exitEasing: 'easeInBack', enterEasing: 'easeOutBack',
    exitProps:  (_dir) => ({ opacity: [1, 0], rotateY: [0, 90], scale: [1, 0.7] }),
    enterProps: (_dir) => ({ opacity: [0, 1], rotateY: [-90, 0], scale: [0.7, 1] }),
  },
}

export function KeyboardGrid({
  layerName, layerId, bindings, selectedKey, spacebarVariant,
  allLayers, activeLayerIndex, macLayout, onKeyClick,
}: KeyboardGridProps) {
  const gridRef      = useRef<HTMLDivElement>(null)
  const badgeRef     = useRef<HTMLDivElement>(null)
  const underglowRef = useRef<HTMLDivElement>(null)
  const caseRef      = useRef<HTMLDivElement>(null)

  // Local copy of bindings so we can hold the old ones during exit animation
  const [displayedBindings, setDisplayedBindings]         = useState<Binding[]>(bindings)
  const [displayedLayerId, setDisplayedLayerId]           = useState(layerId)
  const [displayedSpacebarVariant, setDisplayedSpacebarVariant] = useState<SpacebarVariant>(spacebarVariant)

  const prevLayerRef    = useRef(layerId)
  const dirRef          = useRef(0)           // +1 = forward, -1 = back
  const isAnimatingRef  = useRef(false)
  const prevVariantRef  = useRef(spacebarVariant)
  const isVariantRef    = useRef(false)

  const lc         = LAYER_COLORS[layerId]         ?? LAYER_COLORS[0]
  const displayedLc = LAYER_COLORS[displayedLayerId] ?? LAYER_COLORS[0]

  const layerActive = useMemo(() => {
    const allBindings = allLayers.map(l => l.bindings)
    return computeLayerActivePositions(activeLayerIndex, allBindings, displayedSpacebarVariant)
  }, [allLayers, activeLayerIndex, displayedSpacebarVariant])

  // ── Phase 1: detect layer change → animate exit → swap displayed state ──
  useEffect(() => {
    // Same layer: silent binding update (user edited a key)
    if (layerId === prevLayerRef.current) {
      if (!isAnimatingRef.current) {
        setDisplayedBindings([...bindings])
      }
      return
    }

    const dir = layerId > prevLayerRef.current ? 1 : -1
    prevLayerRef.current = layerId
    dirRef.current       = dir

    // If still animating from a rapid switch, cut it short and reset all transforms
    anime.remove(gridRef.current?.querySelectorAll('.keycap') ?? [])

    const keycaps = Array.from(
      gridRef.current?.querySelectorAll<HTMLElement>('.keycap') ?? []
    )

    if (!keycaps.length) {
      setDisplayedBindings([...bindings])
      setDisplayedLayerId(layerId)
      return
    }

    // Reset any residual transforms from a previously interrupted animation
    anime.set(keycaps, { opacity: 1, translateX: 0, translateY: 0, scale: 1, rotateX: 0, rotateY: 0, rotate: 0 })

    isAnimatingRef.current = true

    // Pick animation config for TARGET layer
    const anim = LAYER_ANIMS[layerId] ?? LAYER_ANIMS[0]

    // Exit using TARGET layer's personality
    anime({
      targets:  keycaps,
      ...anim.exitProps(dir),
      delay:    anime.stagger(anim.staggerDelay, { grid: [COLS, ROWS], from: anim.staggerFrom }),
      duration: anim.exitDuration,
      easing:   anim.exitEasing,
      complete: () => {
        setDisplayedBindings([...bindings])
        setDisplayedLayerId(layerId)
      },
    })

    // Badge pulse
    if (badgeRef.current) {
      anime({ targets: badgeRef.current, scale: [1, 0.82, 1], opacity: [1, 0.25, 1], duration: 360, easing: 'easeInOutQuad' })
    }

    // LED fade out
    if (underglowRef.current) {
      anime({ targets: underglowRef.current, opacity: [1, 0], duration: anim.exitDuration, easing: 'easeInQuad' })
    }
  }, [layerId, bindings]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Phase 2: after displayed layer updates → animate enter ──
  useEffect(() => {
    if (!isAnimatingRef.current) return

    const keycaps = Array.from(
      gridRef.current?.querySelectorAll<HTMLElement>('.keycap') ?? []
    )
    if (!keycaps.length) { isAnimatingRef.current = false; return }

    // Enter using NOW-DISPLAYED layer's personality
    const anim = LAYER_ANIMS[displayedLayerId] ?? LAYER_ANIMS[0]
    const dir  = dirRef.current

    anime({
      targets:  keycaps,
      ...anim.enterProps(dir),
      delay:    anime.stagger(anim.staggerDelay, { grid: [COLS, ROWS], from: anim.staggerFrom }),
      duration: anim.enterDuration,
      easing:   anim.enterEasing,
      complete: () => { isAnimatingRef.current = false },
    })

    // LED fade back in
    if (underglowRef.current) {
      anime({ targets: underglowRef.current, opacity: [0, 1], duration: Math.round(anim.enterDuration * 0.8), easing: 'easeOutQuad' })
    }
  }, [displayedLayerId])

  // ── Variant Phase 1: spacebar variant changes → exit → swap ─────────────
  useEffect(() => {
    if (spacebarVariant === prevVariantRef.current) return
    prevVariantRef.current = spacebarVariant

    const keycaps = Array.from(
      gridRef.current?.querySelectorAll<HTMLElement>('.keycap') ?? []
    )

    if (!keycaps.length) {
      setDisplayedSpacebarVariant(spacebarVariant)
      return
    }

    anime.remove(keycaps)
    anime.set(keycaps, { opacity: 1, translateX: 0, translateY: 0, scale: 1, rotateX: 0, rotateY: 0, rotate: 0 })

    isVariantRef.current = true

    // Keys collapse downward from bottom row first (row 3 changes most visibly)
    anime({
      targets:  keycaps,
      opacity:  [1, 0],
      scaleY:   [1, 0.6],
      translateY: [0, 10],
      delay:    anime.stagger(8, { grid: [COLS, ROWS], from: 'last' }),
      duration: 100,
      easing:   'easeInQuad',
      complete: () => { setDisplayedSpacebarVariant(spacebarVariant) },
    })
  }, [spacebarVariant]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Variant Phase 2: displayed variant updated → enter ───────────────────
  useEffect(() => {
    if (!isVariantRef.current) return

    const keycaps = Array.from(
      gridRef.current?.querySelectorAll<HTMLElement>('.keycap') ?? []
    )
    if (!keycaps.length) { isVariantRef.current = false; return }

    // Keys spring up from bottom row first
    anime({
      targets:  keycaps,
      opacity:  [0, 1],
      scaleY:   [0.6, 1],
      translateY: [10, 0],
      delay:    anime.stagger(8, { grid: [COLS, ROWS], from: 'last' }),
      duration: 220,
      easing:   'easeOutExpo',
      complete: () => { isVariantRef.current = false },
    })
  }, [displayedSpacebarVariant])

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Layer badge */}
      <div ref={badgeRef} className="flex items-center gap-3">
        <div
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest"
          style={{
            background: lc.badge,
            border: `1px solid ${lc.text}40`,
            color: lc.text,
            boxShadow: `0 0 16px ${lc.glow}30`,
            transition: 'background 400ms ease, border-color 400ms ease, color 400ms ease, box-shadow 400ms ease',
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{
              background: lc.text,
              boxShadow: `0 0 6px ${lc.glow}`,
              transition: 'background 400ms ease, box-shadow 400ms ease',
            }}
          />
          Layer {layerId}
        </div>
        <span className="text-[11px] font-mono font-medium tracking-[0.18em] text-muted uppercase">
          {layerName}
        </span>
      </div>

      {/* Keyboard outer case (bezel) */}
      <div
        ref={caseRef}
        className="rounded-2xl p-3"
        style={{
          background: 'linear-gradient(145deg, #20224a 0%, #141630 100%)',
          boxShadow: `0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(167,139,250,0.12), 0 0 40px ${lc.glow}15`,
          transition: 'box-shadow 400ms ease',
        }}
      >
        {/* Corner screws */}
        <div className="relative">
          {(['top-1 left-1', 'top-1 right-1', 'bottom-1 left-1', 'bottom-1 right-1'] as const).map((pos, i) => (
            <div
              key={i}
              className={`absolute ${pos} w-2 h-2 rounded-full z-10`}
              style={{
                background: 'radial-gradient(circle, #3a3c6a 30%, #222440 100%)',
                border: '1px solid rgba(167,139,250,0.15)',
              }}
            />
          ))}

          {/* Inner plate */}
          <div
            className="rounded-xl p-5"
            style={{
              background: 'linear-gradient(160deg, #181a30 0%, #0e1020 100%)',
              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.03)',
            }}
          >
            {/* PCB dot texture */}
            <div
              className="absolute inset-0 rounded-xl opacity-[0.025] pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle, #a78bfa 1px, transparent 0)',
                backgroundSize: '24px 24px',
              }}
            />

            {/* Key grid — perspective needed for rotateX (L1 card-flip) */}
            <div ref={gridRef} className="relative z-10 flex flex-col gap-1.5" style={{ perspective: '900px', perspectiveOrigin: '50% 40%' }}>
              {Array.from({ length: ROWS - 1 }, (_, row) => (
                <div key={row} className="flex gap-1.5">
                  {Array.from({ length: COLS }, (_, col) => {
                    const pos = row * COLS + col
                    const b = displayedBindings[pos] ?? { type: 'none' as const }
                    const targetLayer = (b.type === 'lt' || b.type === 'mo') ? (b.layer ?? 0) : null
                    const targetLc = targetLayer != null ? (LAYER_COLORS[targetLayer] ?? LAYER_COLORS[0]) : null
                    return (
                      <KeyCap
                        key={pos}
                        binding={b}
                        isSelected={selectedKey === pos}
                        isActive={layerActive[pos]}
                        macLayout={macLayout}
                        onClick={(rect) => onKeyClick(pos, rect)}
                        layerColor={targetLc?.text}
                        layerGlow={targetLc?.glow}
                      />
                    )
                  })}
                </div>
              ))}

              {/* Row 3 */}
              <div className="flex gap-1.5">
                {ROW3_LAYOUT[displayedSpacebarVariant].map(({ position, span }) => {
                  const b = displayedBindings[position] ?? { type: 'none' as const }
                  const targetLayer = (b.type === 'lt' || b.type === 'mo') ? (b.layer ?? 0) : null
                  const targetLc = targetLayer != null ? (LAYER_COLORS[targetLayer] ?? LAYER_COLORS[0]) : null
                  return (
                    <KeyCap
                      key={position}
                      binding={b}
                      isSelected={selectedKey === position}
                      isActive={layerActive[position]}
                      widthPx={spanWidth(span)}
                      macLayout={macLayout}
                      onClick={(rect) => onKeyClick(position, rect)}
                      layerColor={targetLc?.text}
                      layerGlow={targetLc?.glow}
                    />
                  )
                })}
              </div>
            </div>
          </div>

          {/* LED underglow strip — uses displayedLc so color only changes after swap */}
          <div
            ref={underglowRef}
            className="h-0.5 rounded-full mt-2 mx-4"
            style={{
              background: `linear-gradient(90deg, transparent, ${displayedLc.text}60, ${displayedLc.text}80, ${displayedLc.text}60, transparent)`,
              boxShadow: `0 0 12px ${displayedLc.glow}`,
            }}
          />
        </div>

        {/* Case branding */}
        <div className="flex justify-between items-center px-1 mt-2">
          <span className="text-[8px] font-mono tracking-[0.25em] uppercase" style={{ color: 'rgba(167,139,250,0.3)' }}>
            Rev.4.0 · nRF52840
          </span>
          <div className="flex gap-1.5">
            {[lc.text, 'rgba(167,139,250,0.3)', 'rgba(167,139,250,0.15)'].map((c, i) => (
              <div
                key={i}
                className="w-1 h-1 rounded-full"
                style={{ background: c, transition: 'background 400ms ease' }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Key type legend */}
      <KeyLegend />
    </div>
  )
}

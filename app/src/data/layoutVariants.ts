import type { Binding, SpacebarVariant } from '../types/keymap'

// Row 3 positions (indices 30-39):
// 30=CTL 31=GUI 32=ALT 33=SFT 34=BSP/FN 35=SPC/NUM 36=ENT 37=APP 38=DEL 39=ESC
//
// 2×2.25u: SFT(33) and ENT(36) removed; pos 34 spans 33+34, pos 35 spans 35+36
// 6.25u:   ALT(32) SFT(33) SPC(35) ENT(36) APP(37) removed; pos 34 spans 32-37

const ALL_ACTIVE = Array(40).fill(true) as boolean[]
const TWO_U_ACTIVE = ALL_ACTIVE.map((_, i) => i !== 33 && i !== 36)
const SIX_U_ACTIVE = ALL_ACTIVE.map((_, i) => ![32, 33, 35, 36, 37].includes(i))

export const ACTIVE_POSITIONS: Record<SpacebarVariant, boolean[]> = {
  'ortho':   ALL_ACTIVE,
  '2x2.25u': TWO_U_ACTIVE,
  '6.25u':   SIX_U_ACTIVE,
}

// ── Per-layer visibility ─────────────────────────────────────────
// Determines which positions are "active" (visible as keycaps) on a
// given layer, taking into account spacebar variant AND binding
// resolution through lower layers.

/** Check if a binding is a real (non-transparent) binding. */
function bindingIsReal(b: Binding): boolean {
  return b.type !== 'none' && b.type !== 'trans'
}

/**
 * Resolve a `trans` binding at `position` on `layerIndex` by looking
 * downward through the layer stack. Returns `true` if any lower layer
 * has a real binding at this position.
 */
function transResolves(
  position: number,
  fromLayer: number,
  allBindings: Binding[][],
): boolean {
  for (let l = fromLayer - 1; l >= 0; l--) {
    const b = allBindings[l]?.[position]
    if (!b) continue
    if (b.type === 'none') return false // dead end
    if (b.type === 'trans') continue    // keep looking down
    return true // found a real binding (kp, lt, mt, bt_*, out_*, etc.)
  }
  return false // fell off the bottom — no real binding found
}

/**
 * Compute per-layer active positions (length 40 boolean array).
 *
 * A position is `true` (visible) when:
 * 1. The spacebar variant includes it, AND
 * 2. The binding is a real binding, OR it is `trans` that resolves to
 *    a real binding on a lower layer.
 *
 * Positions that are `none` or `trans`-resolving-to-`none` are `false`
 * (hidden).
 */
export function computeLayerActivePositions(
  layerIndex: number,
  allBindings: Binding[][],
  spacebarVariant: SpacebarVariant,
): boolean[] {
  const variantActive = ACTIVE_POSITIONS[spacebarVariant]

  return Array.from({ length: 40 }, (_, pos) => {
    if (!variantActive[pos]) return false

    const binding = allBindings[layerIndex]?.[pos]
    if (!binding) return false

    // Real bindings are always visible
    if (bindingIsReal(binding)) return true

    // `none` is always hidden
    if (binding.type === 'none') return false

    // `trans` — resolve downward
    return transResolves(pos, layerIndex, allBindings)
  })
}

export const VARIANT_LABELS: Record<SpacebarVariant, string> = {
  'ortho':   'Full Ortho',
  '2x2.25u': '2×2.25u',
  '6.25u':   '6.25u',
}

// KEY_W and GAP must match the values used in KeyCap/KeyboardGrid
export const KEY_W = 64
export const KEY_GAP = 6

export interface RenderedKey {
  position: number  // matrix index (0-39) — binding source
  span: number      // how many 1u slots this key fills
}

// pixel width for a key of given span
export function spanWidth(span: number): number {
  return span * KEY_W + (span - 1) * KEY_GAP
}

export const ROW3_LAYOUT: Record<SpacebarVariant, RenderedKey[]> = {
  'ortho': [30,31,32,33,34,35,36,37,38,39].map(p => ({ position: p, span: 1 })),

  '2x2.25u': [
    { position: 30, span: 1 },
    { position: 31, span: 1 },
    { position: 32, span: 1 },
    { position: 34, span: 2 }, // covers SFT(33) + BSP/FN(34)
    { position: 35, span: 2 }, // covers SPC/NUM(35) + ENT(36)
    { position: 37, span: 1 },
    { position: 38, span: 1 },
    { position: 39, span: 1 },
  ],

  '6.25u': [
    { position: 30, span: 1 },
    { position: 31, span: 1 },
    { position: 34, span: 6 }, // covers ALT(32)+SFT(33)+BSP(34)+SPC(35)+ENT(36)+APP(37)
    { position: 38, span: 1 },
    { position: 39, span: 1 },
  ],
}

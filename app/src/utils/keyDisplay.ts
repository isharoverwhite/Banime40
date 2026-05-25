import type { Binding } from '../types/keymap'
import { LAYER_NAMES } from '../types/keymap'
import { ALL_KEYCODES } from '../data/zmkKeycodes'

// Build lookup from the rich keycode data
const KEY_LABEL: Record<string, string> = {}
for (const e of ALL_KEYCODES) {
  KEY_LABEL[e.code] = e.label
}

// Mac layout overrides: rename GUI→CMD, ALT→OPT
const MAC_KEY_LABEL: Record<string, string> = {
  ...KEY_LABEL,
  LGUI: 'Cmd',
  RGUI: 'Cmd',
  LALT: 'Opt',
  RALT: 'Opt',
}

export function formatKey(code: string, macLayout?: boolean): string {
  const map = macLayout ? MAC_KEY_LABEL : KEY_LABEL
  return map[code] ?? code
}

export interface DisplayLabel {
  tap: string
  hold: string | null
}

export function getDisplayLabel(binding: Binding, macLayout?: boolean): DisplayLabel {
  switch (binding.type) {
    case 'kp':
      return { tap: formatKey(binding.key ?? '', macLayout), hold: null }
    case 'lt': {
      const layerName = LAYER_NAMES[binding.layer ?? 0] ?? `L${binding.layer}`
      const short = layerName.split('/')[0].toUpperCase().slice(0, 3)
      return { tap: formatKey(binding.key ?? '', macLayout), hold: `▼${short}` }
    }
    case 'mt':
      return { tap: formatKey(binding.key ?? '', macLayout), hold: formatKey(binding.mod ?? '', macLayout) }
    case 'bt_sel':
      return { tap: `BT${(binding.profile ?? 0) + 1}`, hold: null }
    case 'mo': {
      const layerName = LAYER_NAMES[binding.layer ?? 0] ?? `L${binding.layer}`
      const short = layerName.split('/')[0].toUpperCase().slice(0, 3)
      return { tap: `MO`, hold: `▲${short}` }
    }
    case 'bt_clr':
      return { tap: 'BTCLR', hold: null }
    case 'out_usb':
      return { tap: 'USB', hold: null }
    case 'out_ble':
      return { tap: 'BLE', hold: null }
    case 'out_tog':
      return { tap: 'TOG', hold: null }
    case 'none':
      return { tap: '', hold: null }
    case 'trans':
      return { tap: '···', hold: null }
  }
}

export type KeyColorVariant =
  | 'modifier'       // blue left border
  | 'layer-trigger'  // amber bottom border
  | 'arrow'          // green text
  | 'bt'             // purple tint
  | 'none'           // dimmed
  | 'trans'          // dashed border
  | 'normal'

export function getKeyColorVariant(binding: Binding): KeyColorVariant {
  if (binding.type === 'none') return 'none'
  if (binding.type === 'trans') return 'trans'
  if (binding.type === 'lt' || binding.type === 'mt' || binding.type === 'mo') return 'layer-trigger'
  if (binding.type === 'bt_sel' || binding.type === 'bt_clr' ||
      binding.type === 'out_usb' || binding.type === 'out_ble' || binding.type === 'out_tog') return 'bt'
  if (binding.type === 'kp') {
    const k = binding.key ?? ''
    if (['LCTRL','RCTRL','LGUI','RGUI','LALT','RALT','LSHFT','RSHFT'].includes(k)) return 'modifier'
    if (['UP','DOWN','LEFT','RIGHT'].includes(k)) return 'arrow'
  }
  return 'normal'
}

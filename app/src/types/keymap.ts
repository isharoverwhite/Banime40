export type BindingType =
  | 'kp' | 'lt' | 'mt' | 'mo'
  | 'bt_sel' | 'bt_clr'
  | 'out_usb' | 'out_ble' | 'out_tog'
  | 'none' | 'trans'

export interface Binding {
  type: BindingType
  key?: string      // kp: the key; lt/mt: tap key
  mod?: string      // mt: hold modifier
  layer?: number    // lt: hold layer index
  profile?: number  // bt_sel: 0-4
}

export type SpacebarVariant = 'ortho' | '2x2.25u' | '6.25u'

export interface Layer {
  id: number
  name: string
  bindings: Binding[] // exactly 40 items (4 rows × 10 cols)
}

export interface Keymap {
  id: string
  name: string
  layers: Layer[]
  spacebarVariant: SpacebarVariant
  updatedAt: number
}

export const LAYER_NAMES = ['Base', 'Num/Sym', 'Fn/Media', 'Nav', 'System'] as const
export const ROWS = 4
export const COLS = 10

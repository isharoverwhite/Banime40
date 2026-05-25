import type { Binding, Keymap } from '../types/keymap'

const n = (type: Binding['type'], key?: string, extra?: Partial<Binding>): Binding =>
  ({ type, ...(key ? { key } : {}), ...extra })

const kp  = (key: string): Binding => n('kp', key)
const lt  = (layer: number, key: string): Binding => ({ type: 'lt', layer, key })
const none: Binding = { type: 'none' }
const tr:   Binding = { type: 'trans' }
const btSel = (profile: number): Binding => ({ type: 'bt_sel', profile })

const base: Binding[] = [
  kp('Q'),      kp('W'),     kp('E'),    kp('R'),    kp('T'),
  kp('Y'),      kp('U'),     kp('I'),    kp('O'),    kp('P'),

  kp('A'),      kp('S'),     kp('D'),    kp('F'),    kp('G'),
  kp('H'),      kp('J'),     kp('K'),    kp('L'),    lt(3,'MINUS'),

  kp('Z'),      kp('X'),     kp('C'),    kp('V'),    kp('B'),
  kp('N'),      kp('M'),     kp('COMMA'),kp('DOT'),  lt(4,'FSLH'),

  kp('LCTRL'),  kp('LGUI'),  kp('LALT'), kp('LSHFT'),lt(2,'BSPC'),
  lt(1,'SPACE'),kp('RET'),   kp('K_APP'),kp('DEL'),  kp('ESC'),
]

const numSym: Binding[] = [
  kp('N1'),   kp('N2'),   kp('N3'),   kp('N4'),   kp('N5'),
  kp('N6'),   kp('N7'),   kp('N8'),   kp('N9'),   kp('N0'),

  kp('TAB'),  none,       none,       kp('GRAVE'),kp('LBKT'),
  kp('RBKT'), kp('BSLH'), kp('SEMI'), kp('SQT'),  kp('MINUS'),

  none,       none,       none,       none,       kp('EQUAL'),
  kp('MINUS'),none,       tr,         tr,         tr,

  tr,         tr,         tr,         tr,         tr,
  none,       tr,         tr,         tr,         tr,
]

const fn: Binding[] = [
  kp('F1'),   kp('F2'),  kp('F3'),           kp('F4'),  kp('F5'),
  kp('F6'),   kp('F7'),  kp('F8'),           kp('F9'),  kp('F10'),

  kp('TAB'),  kp('F11'), kp('F12'),          none,      none,
  none,       none,      none,               none,      none,

  kp('CAPS'), kp('PSCRN'),kp('SLCK'),        kp('PAUSE_BREAK'),none,
  kp('KP_NUM'),none,     kp('C_VOL_DN'),     kp('C_VOL_UP'),kp('C_MUTE'),

  tr,         tr,        tr,                 tr,        none,
  none,       none,      none,               none,      none,
]

const nav: Binding[] = [
  kp('ESC'),  kp('UP'),   none,       none,       none,
  kp('INS'),  kp('PG_UP'),none,       kp('PG_DN'),kp('DEL'),

  kp('LEFT'), kp('DOWN'), kp('RIGHT'),kp('TAB'),  none,
  kp('HOME'), none,       none,       none,       none,

  none,       none,       none,       none,       none,
  kp('END'),  none,       none,       none,       tr,

  tr,         tr,         tr,         tr,         kp('BSPC'),
  none,       none,       none,       none,       none,
]

const sys: Binding[] = [
  btSel(0),   btSel(1),   btSel(2),   btSel(3),   btSel(4),
  none,       none,       none,       none,       { type:'bt_clr' },

  none,       none,       none,       none,       none,
  none,       { type:'out_usb' }, { type:'out_ble' }, { type:'out_tog' }, none,

  none,       none,       none,       none,       none,
  none,       none,       none,       none,       tr,

  none,       none,       none,       none,       none,
  none,       none,       none,       none,       none,
]

export const DEFAULT_KEYMAP: Keymap = {
  id: 'default',
  name: 'banime40_remap',
  spacebarVariant: 'ortho',
  updatedAt: 0,
  layers: [
    { id: 0, name: 'Base',     bindings: base },
    { id: 1, name: 'Num/Sym',  bindings: numSym },
    { id: 2, name: 'Fn/Media', bindings: fn },
    { id: 3, name: 'Nav',      bindings: nav },
    { id: 4, name: 'System',   bindings: sys },
  ],
}

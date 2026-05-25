export interface KeycodeEntry {
  code: string       // ZMK keycode (e.g. "LCTRL")
  label: string      // Human-readable label (e.g. "Ctrl")
  aliases?: string[] // Search aliases (e.g. ["control", "ctl"])
}

export interface KeycodeGroup {
  label: string
  codes: KeycodeEntry[]
}

const K = (code: string, label: string, aliases?: string[]): KeycodeEntry =>
  ({ code, label, ...(aliases ? { aliases } : {}) })

export const ZMK_KEYCODE_GROUPS: KeycodeGroup[] = [
  {
    label: 'Letters',
    codes: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(c => K(c, c)),
  },
  {
    label: 'Numbers',
    codes: [
      K('N0', '0', ['zero']), K('N1', '1', ['one']), K('N2', '2', ['two']),
      K('N3', '3', ['three']), K('N4', '4', ['four']), K('N5', '5', ['five']),
      K('N6', '6', ['six']), K('N7', '7', ['seven']), K('N8', '8', ['eight']),
      K('N9', '9', ['nine']),
    ],
  },
  {
    label: 'Function',
    codes: Array.from({length:12}, (_,i) => K(`F${i+1}`, `F${i+1}`)),
  },
  {
    label: 'Modifiers',
    codes: [
      K('LCTRL', 'Ctrl',  ['control', 'ctl']),
      K('RCTRL', 'RCtrl', ['rcontrol', 'rctl']),
      K('LSHFT', 'Shift', ['sft']),
      K('RSHFT', 'RShift',['rsft']),
      K('LALT',  'Alt',   ['option', 'opt']),
      K('RALT',  'RAlt',  ['roption', 'ropt']),
      K('LGUI',  'GUI',   ['win', 'windows', 'cmd', 'command', 'super']),
      K('RGUI',  'RGUI',  ['rwin', 'rwindows', 'rcmd', 'rcommand']),
    ],
  },
  {
    label: 'Navigation',
    codes: [
      K('UP',    '↑',    ['arrow up', 'up arrow']),
      K('DOWN',  '↓',    ['arrow down', 'down arrow']),
      K('LEFT',  '←',    ['arrow left', 'left arrow']),
      K('RIGHT', '→',    ['arrow right', 'right arrow']),
      K('HOME',  'Home', ['pos1']),
      K('END',   'End'),
      K('PG_UP', 'PgUp', ['page up', 'pageup']),
      K('PG_DN', 'PgDn', ['page down', 'pagedown']),
      K('INS',   'Ins',  ['insert']),
      K('DEL',   'Del',  ['delete']),
      K('BSPC',  'Bsp',  ['backspace', 'bksp', 'back']),
    ],
  },
  {
    label: 'Special',
    codes: [
      K('SPACE', 'Space',  ['spc']),
      K('RET',   'Enter',  ['return', 'ent', '↵']),
      K('TAB',   'Tab'),
      K('ESC',   'Esc',    ['escape']),
      K('CAPS',  'Caps',   ['caps lock', 'capslock']),
      K('PSCRN', 'PrtSc',  ['print screen', 'printscreen', 'prt sc']),
      K('SLCK',  'ScrLk',  ['scroll lock', 'scrolllock']),
      K('PAUSE_BREAK', 'Pause', ['pause break', 'break']),
      K('KP_NUM', 'NumLk', ['num lock', 'numlock', 'num']),
    ],
  },
  {
    label: 'Symbols',
    codes: [
      K('MINUS', '-',     ['minus', 'dash', 'hyphen']),
      K('EQUAL', '=',     ['equals']),
      K('LBKT',  '[',     ['left bracket', 'open bracket', 'lbracket']),
      K('RBKT',  ']',     ['right bracket', 'close bracket', 'rbracket']),
      K('BSLH',  '\\',    ['backslash', 'back slash', 'bslash']),
      K('SEMI',  ';',     ['semicolon', 'semi colon']),
      K('SQT',   '\'',    ['quote', 'single quote', 'apostrophe', 'tick']),
      K('GRAVE', '`',     ['grave', 'backtick', 'back tick', 'tilde']),
      K('COMMA', ',',     ['comma']),
      K('DOT',   '.',     ['dot', 'period', 'full stop']),
      K('FSLH',  '/',     ['slash', 'forward slash', 'fslash', 'forwardslash']),
    ],
  },
  {
    label: 'Media',
    codes: [
      K('C_VOL_UP',   'Vol+',  ['volume up', 'vol up', 'louder']),
      K('C_VOL_DN',   'Vol−',  ['volume down', 'vol down', 'quieter']),
      K('C_MUTE',     'Mute',  ['volume mute', 'unmute', 'silence']),
      K('C_PP',       'Play',  ['play pause', 'media play', 'pause']),
      K('C_NEXT',     'Next',  ['next track', 'skip', 'forward']),
      K('C_PREV',     'Prev',  ['previous track', 'back', 'rewind']),
    ],
  },
  {
    label: 'Extra',
    codes: [
      K('K_APP',       'Menu',  ['app', 'application', 'context menu', 'right click']),
      K('PRINTSCREEN', 'PrtSc', ['print screen', 'screenshot', 'prtscr']),
    ],
  },
]

export const ALL_KEYCODES = ZMK_KEYCODE_GROUPS.flatMap(g => g.codes)

/** Flat list of just the code strings (for backward compat). */
export const ALL_CODE_STRINGS: string[] = ALL_KEYCODES.map(e => e.code)

export const MODIFIER_KEYS = ['LCTRL','RCTRL','LSHFT','RSHFT','LALT','RALT','LGUI','RGUI']

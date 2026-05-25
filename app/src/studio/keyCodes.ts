// ZMK key code format: (HID_page << 16) | HID_usage_id
const KB = 0x00070000  // USB HID Keyboard/Keypad Usage Page (0x07)
const CN = 0x000C0000  // USB HID Consumer Devices Usage Page (0x0C)

export const ZMK_KEY_CODE: Record<string, number> = {
  // Letters
  A: KB|0x04, B: KB|0x05, C: KB|0x06, D: KB|0x07,
  E: KB|0x08, F: KB|0x09, G: KB|0x0A, H: KB|0x0B,
  I: KB|0x0C, J: KB|0x0D, K: KB|0x0E, L: KB|0x0F,
  M: KB|0x10, N: KB|0x11, O: KB|0x12, P: KB|0x13,
  Q: KB|0x14, R: KB|0x15, S: KB|0x16, T: KB|0x17,
  U: KB|0x18, V: KB|0x19, W: KB|0x1A, X: KB|0x1B,
  Y: KB|0x1C, Z: KB|0x1D,

  // Numbers (N-prefix = number row keys)
  N1: KB|0x1E, N2: KB|0x1F, N3: KB|0x20, N4: KB|0x21, N5: KB|0x22,
  N6: KB|0x23, N7: KB|0x24, N8: KB|0x25, N9: KB|0x26, N0: KB|0x27,

  // Special / whitespace
  RET: KB|0x28, ENTER: KB|0x28,
  ESC: KB|0x29,
  BSPC: KB|0x2A,
  TAB: KB|0x2B,
  SPACE: KB|0x2C, SPC: KB|0x2C,

  // Punctuation
  MINUS: KB|0x2D,  EQUAL: KB|0x2E,
  LBKT:  KB|0x2F,  RBKT:  KB|0x30,
  BSLH:  KB|0x31,
  SEMI:  KB|0x33,  SQT:   KB|0x34,
  GRAVE: KB|0x35,
  COMMA: KB|0x36,  DOT:   KB|0x37,
  FSLH:  KB|0x38,

  CAPS: KB|0x39,

  // Function keys
  F1:  KB|0x3A, F2:  KB|0x3B, F3:  KB|0x3C, F4:  KB|0x3D,
  F5:  KB|0x3E, F6:  KB|0x3F, F7:  KB|0x40, F8:  KB|0x41,
  F9:  KB|0x42, F10: KB|0x43, F11: KB|0x44, F12: KB|0x45,

  // System
  PSCRN: KB|0x46, SLCK: KB|0x47, PAUSE_BREAK: KB|0x48,
  INS:   KB|0x49, HOME: KB|0x4A, PG_UP: KB|0x4B,
  DEL:   KB|0x4C, END:  KB|0x4D, PG_DN: KB|0x4E,

  // Navigation
  RIGHT: KB|0x4F, LEFT: KB|0x50, DOWN: KB|0x51, UP: KB|0x52,

  KP_NUM: KB|0x53,
  K_APP:  KB|0x65,   // Application/Menu key

  // Modifiers
  LCTRL: KB|0xE0, LSHFT: KB|0xE1, LALT: KB|0xE2, LGUI: KB|0xE3,
  RCTRL: KB|0xE4, RSHFT: KB|0xE5, RALT: KB|0xE6, RGUI: KB|0xE7,

  // Consumer (media)
  C_VOL_UP: CN|0xE9, C_VOL_DN: CN|0xEA, C_MUTE: CN|0xE2,
  C_PP:     CN|0xCD,
  C_NEXT:   CN|0xB5, C_PREV: CN|0xB6,
  C_BRI_UP: CN|0x6F, C_BRI_DN: CN|0x70,
}

export function keyNameToCode(name: string): number {
  return ZMK_KEY_CODE[name] ?? 0
}

// Reverse mapping: ZMK HID code → key name (first match wins)
const CODE_TO_NAME: Record<number, string> = {}
for (const [name, code] of Object.entries(ZMK_KEY_CODE)) {
  if (!(code in CODE_TO_NAME)) CODE_TO_NAME[code] = name
}

export function codeToKeyName(code: number): string {
  return CODE_TO_NAME[code] ?? ''
}

# QMK → ZMK Port: Key Decisions

## What was investigated
How to translate banime40's ATmega32U4/QMK configuration to nRF52840/ZMK, including matrix, keymap layers, and feature parity.

## Source QMK Config (sporewoh/banime40, PR #16694)

```
MCU:        ATmega32U4, bootloader Caterina
Matrix:     4 rows × 10 cols, COL2ROW
Row pins:   E6, D7, C6, D4
Col pins:   B4, B5, B6, B2, B3, B1, F7, F6, F5, F4
VID/PID:    0xBEAF / 0x0001
```

Layer map (QMK notation):
- Layer 0: QWERTY base
- Layer 1: Num/Sym (hold Space)
- Layer 2: Fn/Media (hold Bksp)
- Layer 3: Navigation (hold -)
- Layer 4: Placeholder (hold /) — was VIA-only layer in original

## Keycode Translation Table (QMK → ZMK)

| QMK | ZMK |
|---|---|
| `LT(n, kc)` | `&lt n KEY` |
| `KC_LCTL` | `&kp LCTRL` |
| `KC_LGUI` | `&kp LGUI` |
| `KC_LALT` | `&kp LALT` |
| `KC_LSFT` | `&kp LSHFT` |
| `KC_BSPC` | `&kp BSPC` |
| `KC_SPC` | `&kp SPACE` |
| `KC_ENT` | `&kp RET` |
| `KC_APP` | `&kp K_APP` |
| `KC_MINS` | `&kp MINUS` |
| `KC_SLSH` | `&kp FSLH` |
| `KC_COMM` | `&kp COMMA` |
| `KC_GRV` | `&kp GRAVE` |
| `KC_LBRC` | `&kp LBKT` |
| `KC_RBRC` | `&kp RBKT` |
| `KC_BSLS` | `&kp BSLH` |
| `KC_SCLN` | `&kp SEMI` |
| `KC_QUOT` | `&kp SQT` |
| `KC_EQL` | `&kp EQUAL` |
| `KC_PSCR` | `&kp PSCRN` |
| `KC_SCRL` | `&kp SLCK` |
| `KC_PAUS` | `&kp PAUSE_BREAK` |
| `KC_NUM` | `&kp KP_NUM` |
| `KC_VOLD` | `&kp C_VOL_DN` |
| `KC_VOLU` | `&kp C_VOL_UP` |
| `KC_MUTE` | `&kp C_MUTE` |
| `KC_NO` | `&none` |
| `KC_TRNS` | `&trans` |
| `KC_PGUP` | `&kp PG_UP` |
| `KC_PGDN` | `&kp PG_DN` |
| `KC_RGHT` | `&kp RIGHT` |

## Feature Parity

| QMK feature | ZMK equivalent | Status |
|---|---|---|
| VIA (10 layers) | ZMK Studio / static keymap | Layer 4 is placeholder |
| NKRO | Built-in via USB HID boot protocol | Automatic |
| Bootmagic (top-left on boot) | `CONFIG_ZMK_BOOTLOADER_RESET=y` | Default in nice_nano_v2 |
| Mouse keys | `CONFIG_ZMK_MOUSE=y` + `&mkp` behaviors | Not yet added |

## What ZMK adds (vs original QMK)
- BLE 5.0 with up to 5 paired profiles
- Deep sleep after idle (CONFIG_ZMK_IDLE_SLEEP_TIMEOUT)
- Battery level reporting via BLE Battery Service
- USB/BLE auto-switching

## Decision made
Implement 5 layers matching QMK default. Layer 4 reserved for BT profile management (`&bt BT_SEL 0..4`, `&bt BT_CLR`) and battery indicator once battery monitoring is working.

## References
- QMK PR: github.com/qmk/qmk_firmware/pull/16694
- ZMK keycode reference: zmk.dev/docs/keymaps/key-press
- ZMK behaviors: zmk.dev/docs/keymaps/behaviors

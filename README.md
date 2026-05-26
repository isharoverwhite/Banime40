<p align="center">
  <img src="https://img.shields.io/badge/ZMK-v0.3--branch-blue?style=for-the-badge">
  <img src="https://img.shields.io/badge/board-nRF52840-green?style=for-the-badge">
  <img src="https://img.shields.io/badge/BLE-5.0-blueviolet?style=for-the-badge">
  <img src="https://img.shields.io/badge/layout-40%25_ortholinear-orange?style=for-the-badge">
</p>

<h1 align="center">banime40 — ZMK Bluetooth Port</h1>
<h3 align="center">QMK → ZMK firmware port for the banime40 ortholinear 40% keyboard</h3>

---

## Attribution

This project is a firmware port of the **banime40** keyboard, originally designed and built by [ChrisChrisLoLo (sporewoh)](https://github.com/ChrisChrisLoLo/banime40).

- Original hardware design & QMK firmware: [github.com/ChrisChrisLoLo/banime40](https://github.com/ChrisChrisLoLo/banime40)
- Original QMK PR: [qmk/qmk_firmware#16694](https://github.com/qmk/qmk_firmware/pull/16694)
- This repo contains only the ZMK port — no QMK code is vendored here.

All credit for the keyboard design goes to the original author. This port exists solely to enable Bluetooth on the same PCB using a drop-in nRF52840 controller.

---

## What this port adds

The banime40 PCB uses a standard Pro Micro socket. Swapping the original ATmega32U4 Pro Micro for an HBY/SAMIROB nRF52840 clone (same pinout, same socket) unlocks wireless operation without any PCB modification.

| Feature | QMK (original) | ZMK (this port) |
|---|---|---|
| MCU | ATmega32U4 | nRF52840 (HBY/SAMIROB clone) |
| Connection | USB HID only | USB HID + Bluetooth 5.0 |
| Battery | None | LiPo via B+/B− pads, level reported over BLE |
| Power saving | None | Deep sleep after 15 min idle |
| BLE profiles | — | 5 profiles (5 paired devices) |
| Build tool | QMK | ZMK + Zephyr RTOS |

---

## Hardware

| | Original | This port |
|---|---|---|
| Controller | Pro Micro (ATmega32U4) | HBY / SAMIROB nRF52840 |
| Socket fit | 2×12 Pro Micro | Drop-in, same socket, same orientation |
| PCB mod needed | No | No |
| Battery | — | LiPo connected to B+ / B− pads |

> The HBY/SAMIROB board is a nice!nano v2 clone. GPIO assignments for Col 0/1 differ slightly (P1.04/P1.06 instead of P1.02/P1.04) — the overlay in this repo reflects the correct mapping.

---

## Keymap — 5 Layers

**Layer 0 — Base (QWERTY)**
```
┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
│ Q │ W │ E │ R │ T │ Y │ U │ I │ O │ P │
├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤
│ A │ S │ D │ F │ G │ H │ J │ K │ L │ - │ hold - → Nav
├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤
│ Z │ X │ C │ V │ B │ N │ M │ , │ . │ / │ hold / → System
├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤
│CTL│GUI│ALT│SFT│BSP│SPC│ENT│APP│DEL│ESC│
└───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘
                     ↑   ↑
              hold = Fn  Num
```

**Layer 1 — Num / Sym** (hold Space)
```
┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
│ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │ 8 │ 9 │ 0 │
├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤
│TAB│   │   │ ` │ [ │ ] │ \ │ ; │ ' │ - │
├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤
│   │   │   │   │ = │ - │   │   │   │   │
├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤
│   │   │   │   │   │▓▓▓│   │   │   │   │
└───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘
```

**Layer 2 — Fn / Media** (hold Bksp)
```
┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐
│ F1 │ F2 │ F3 │ F4 │ F5 │ F6 │ F7 │ F8 │ F9 │F10 │
├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤
│TAB │F11 │F12 │    │    │    │    │    │    │    │
├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤
│CAPS│PRSC│SLCK│PAU │    │NMLK│    │VOL-│VOL+│MUTE│
├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤
│    │    │    │    │▓▓▓▓│    │    │    │    │    │
└────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘
```

**Layer 3 — Navigation** (hold -)
```
┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐
│ESC │ ↑  │    │    │    │INS │PGUP│    │PGDN│DEL │
├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤
│ ←  │ ↓  │ →  │TAB │    │HOME│    │    │    │▓▓▓▓│
├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤
│    │    │    │    │    │END │    │    │    │    │
├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤
│    │    │    │    │BSP │    │    │    │    │    │
└────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘
Arrows on WASD: W=↑  A=←  S=↓  D=→
```

**Layer 4 — System / Bluetooth** (hold /)
```
┌──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐
│ BT1  │ BT2  │ BT3  │ BT4  │ BT5  │      │      │      │      │BTCLR │
├──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
│      │      │      │      │      │      │ USB  │ BLE  │ TOG  │      │
├──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
│      │      │      │      │      │      │      │      │      │▓▓▓▓▓▓│
├──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
│      │      │      │      │      │      │      │      │      │      │
└──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘
BT1–5 : select paired device slot
BTCLR : clear bond on current slot (re-pair)
USB   : force USB HID output
BLE   : force BLE output
TOG   : toggle USB ↔ BLE
```

> USB/BLE switching is automatic: plug into a computer → USB HID; plug into a charger → BLE stays active.

---

## Flash

**Download firmware:** [github.com/isharoverwhite/banime40/releases](https://github.com/isharoverwhite/banime40/releases)

1. Double-tap the RST pin (or hold the top-left key on power-up) to enter bootloader
2. The board appears as a USB drive named **NRF52BOOT**
3. Drag and drop `banime40_remap-nice_nano_v2.uf2` onto the drive
4. The board reboots automatically

---

## License

The original banime40 keyboard design and QMK firmware are the work of [ChrisChrisLoLo](https://github.com/ChrisChrisLoLo/banime40) and are subject to their respective licenses.

This ZMK port is released under the [MIT License](https://opensource.org/licenses/MIT).

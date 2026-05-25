# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Goal

Port the **banime40** ortholinear 40% keyboard from **ATmega32U4 + QMK** to **nRF52840 + ZMK** to gain:
- Bluetooth 5.0 dual-mode (USB HID + BLE HID, switchable via hotkeys)
- LiPo battery connection with real-time battery level reporting over BLE Battery Service
- Deep sleep power management

**Target hardware:** SAMIROB / HBY nRF52840 clone board — Pro Micro form factor, same chip as nice!nano v2 but with slightly different GPIO assignments for Col 0/1 (P1.04/P1.06 instead of nice!nano's P1.02/P1.04). See `zmk-config/pin_mapping.csv` for the full verified ATmega32U4 → nRF52840 GPIO translation table.

**Source reference:** Original QMK firmware lives at `keyboards/sporewoh/banime40/` in the upstream QMK repo (PR #16694, merged 2022-04-13). This repo contains only the ZMK port — do not vendor QMK code here.

---

## Knowledge Persistence Rule

**Every time you research, investigate, or make a non-obvious decision, write a Markdown file in `knowledge/` before proceeding.**

File naming: `knowledge/YYYY-MM-DD_<topic>.md`

Each file must include:
- **What was investigated** (hardware spec, ZMK API, nRF52840 peripheral)
- **What was found** (facts, constraints, gotchas)
- **Decision made** (and why alternatives were rejected)
- **References** (datasheet sections, ZMK source files, commit SHAs)

These files are the memory across sessions. Read relevant ones at the start of each session before making changes. Never delete them — update if a finding changes.

---

## Build System

ZMK uses **Zephyr RTOS + west**. There are two workflows:

### Local Build (requires Zephyr SDK + west)
```bash
# First-time workspace setup (run once outside this repo)
west init -l zmk-config/
west update

# Build firmware for SAMIROB/HBY nRF52840 board
# Use nice_nano_v2 as base board (same nRF52840 chip, compatible board definition)
west build -p -b nice_nano_v2 -- -DSHIELD=banime40

# Output firmware file
ls build/zephyr/zmk.uf2
```

### GitHub Actions Build (recommended, no local toolchain needed)
```bash
# Trigger by pushing to main branch
# Workflow defined in .github/workflows/build.yml (to be created)
# Downloads zmk.uf2 from Actions artifacts
```

### Flash
```bash
# Enter bootloader: double-tap RST pin, or hold bootmagic key (top-left) on power-up
# nRF52840 appears as USB mass storage "NRF52BOOT"
cp build/zephyr/zmk.uf2 /Volumes/NRF52BOOT/

# Or west flash (requires J-Link or DAPLink)
west flash
```

### Useful Build Variants
```bash
# Build with debug logging enabled (see banime40.conf)
west build -p -b nice_nano_v2 -- -DSHIELD=banime40 -DCONFIG_ZMK_LOG_LEVEL_DBG=y

# Check Kconfig (what features are compiled in)
west build -t menuconfig
```

---

## Repository Structure

```
zmk-config/
├── build.yaml                          # west build target declaration
├── pin_mapping.csv                     # ATmega32U4 QMK pin → nRF52840 GPIO truth table
└── config/boards/shields/banime40/
    ├── banime40.overlay                # Hardware: matrix GPIO assignments (devicetree)
    ├── banime40.keymap                 # Key bindings for all layers
    ├── banime40.conf                   # Kconfig: BLE, USB, sleep, battery
    ├── CMakeLists.txt                  # Shield CMake entry
    └── Kconfig.shield                  # Shield Kconfig selector

knowledge/                              # Accumulated research notes (one file per topic)
```

---

## Architecture

### How ZMK Shield Works

ZMK separates **board** (nRF52840 chip init, USB, BLE radio) from **shield** (keyboard matrix, layout, keymap). This repo is the shield only.

1. `banime40.overlay` — devicetree overlay that defines the kscan matrix node and wires it to specific nRF52840 GPIOs. This is the translation of QMK's `config.h` matrix_pins into Zephyr devicetree format.

2. `banime40.keymap` — ZMK behavior bindings. Maps matrix positions to `&kp`, `&lt`, `&bt`, `&ext_power` etc. Equivalent to QMK's `keymap.c`. Layers are defined in order: base(0) → num_sym(1) → fn(2) → nav(3) → layer4(4).

3. `banime40.conf` — Kconfig fragment merged at build time. Enables BLE, USB HID, sleep. Battery monitoring config goes here too (`CONFIG_ZMK_BATTERY_REPORTING=y`).

### Matrix Wiring (COL2ROW diode direction)
- **Columns** = outputs, driven HIGH one at a time during scan
- **Rows** = inputs with pull-down, read to detect which key is pressed
- Diode anode at switch, cathode toward row — current flows Col→Row

### Key GPIO Differences vs nice!nano v2
This board uses P1.04/P1.06 for Pro Micro physical pins 8/9, where nice!nano v2 uses P1.02/P1.04. All other GPIOs match. **Do not blindly copy nice!nano ZMK configs** — the col 0/1 assignments will be wrong.

### Battery Level Reporting
nRF52840 has an internal SAADC. The SAMIROB/HBY board exposes B+/B− pads for LiPo. ZMK battery monitoring requires:
- A voltage divider on the battery line feeding an ADC pin (check if board has one built-in — nice!nano does via P0.31, but verify for this board)
- `CONFIG_ZMK_BATTERY_REPORTING=y` in `banime40.conf`
- A `battery` node in `banime40.overlay` pointing to the ADC channel
- BLE Battery Service is advertised automatically once enabled

Battery research must be written to `knowledge/` before implementing.

### BLE Profile Switching
ZMK supports 5 BLE profiles by default (`CONFIG_BT_MAX_PAIRED=5`). Switch between paired hosts using `&bt BT_SEL 0..4` bindings — assign these to Layer 4 (currently placeholder).

### USB / BLE Mode
ZMK automatically prefers USB HID when cable is connected, BLE when wireless. No manual mode switching needed. Both `CONFIG_ZMK_USB=y` and `CONFIG_ZMK_BLE=y` must be set.

---

## Pin Mapping Quick Reference

Full table in `zmk-config/pin_mapping.csv`. Critical entries:

| Function | QMK (ATmega32U4) | nRF52840 GPIO | ZMK node |
|---|---|---|---|
| Row 0 (Q..P) | E6 | P0.11 | `&gpio0 11` |
| Row 1 (A..-) | D7 | P1.00 | `&gpio1 0` |
| Row 2 (Z../) | C6 | P0.24 | `&gpio0 24` |
| Row 3 (modifiers) | D4 | P0.22 | `&gpio0 22` |
| Col 2 (E/D/C/LAlt) | B6 | P0.00 | `&gpio0 0` — verify not XL1 crystal pin |
| Col 3 (R/F/V/LSft) | B2 | P0.10 | `&gpio0 10` — corrected from P1.10 |

Unused GPIOs available for extensions: P0.06, P0.08, P0.17, P0.20 (Pro Micro TX/RX/D2/D3 — not used by banime40 matrix).

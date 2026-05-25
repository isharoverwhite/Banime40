# Hardware: SAMIROB / HBY nRF52840 Board Pinout

## What was investigated
Physical pinout of the SAMIROB and HBY branded nRF52840 Pro Micro clone boards used as the target controller for banime40 port. Two product photos analyzed (blurry first, high-res second).

## What was found

### Chip
- **Nordic nRF52840** — marking `N52840 QTAAD0` (QIAA package, confirmed genuine Nordic)
- 32MHz crystal on-board for BLE radio HF clock
- **No visible 32.768kHz crystal** → likely using internal RC oscillator for LF clock → P0.00/P0.01 (XL1/XL2) are free as GPIO

### Form Factor
- Pro Micro compatible: 2×12 castellated holes (24 data pins) + 2 extra battery pads (B+, B−)
- B− at top-left (adjacent to USB-C), B+ at top-right — these protrude beyond the 12-pin socket
- Fits banime40 Pro Micro socket with B+/B− floating above socket edge

### Full Pinout (confirmed from high-res image)

Left side (top → bottom):
```
B−   (battery negative, extra pad — not in socket)
006  P0.06   (Pro Micro TX)
008  P0.08   (Pro Micro RX)
GND
GND
017  P0.17   (Pro Micro D2)
020  P0.20   (Pro Micro D3)
022  P0.22   (Pro Micro D4)  ← Row 3
024  P0.24   (Pro Micro D5)  ← Row 2
100  P1.00   (Pro Micro D6)  ← Row 1
011  P0.11   (Pro Micro D7)  ← Row 0
104  P1.04   (Pro Micro D8)  ← Col 0  [nice!nano uses P1.02 here]
106  P1.06   (Pro Micro D9)  ← Col 1  [nice!nano uses P1.04 here]
```

Right side (top → bottom):
```
B+   (battery positive, extra pad — not in socket)
RAW  (unregulated input)
GND
RST
VCC  (3.3V regulated)
031  P0.31   (Pro Micro A3)  ← Col 9
029  P0.29   (Pro Micro A2)  ← Col 8
002  P0.02   (Pro Micro A1)  ← Col 7
115  P1.15   (Pro Micro A0)  ← Col 6
113  P1.13   (Pro Micro D15/SCK) ← Col 5
111  P1.11   (Pro Micro D14/MISO) ← Col 4
010  P0.10   (Pro Micro D16/MOSI) ← Col 3  [WARNING: early blurry image misread as '110' = P1.10]
000  P0.00   (Pro Micro D10) ← Col 2  [WARNING: early blurry image misread as '600']
```

### Key Differences from nice!nano v2
| Pro Micro position | nice!nano v2 GPIO | SAMIROB/HBY GPIO |
|---|---|---|
| Pin 8 (PB4 / Col 0) | P1.02 | **P1.04** |
| Pin 9 (PB5 / Col 1) | P1.04 | **P1.06** |
| All others | identical | identical |

## Decision made
Use `nice_nano_v2` as ZMK base board (handles nRF52840 init, USB, BLE) but override matrix GPIO in `banime40.overlay` with the actual SAMIROB/HBY GPIOs (P1.04, P1.06 for col 0/1).

**Do not use nice!nano ZMK shield configs as-is** — col 0/1 will be wrong.

## References
- Images: SAMIROB and HBY product photos analyzed in conversation
- nRF52840 datasheet: P0.00/P0.01 are XL1/XL2 only when LFXO is selected; LFRC mode frees them
- nice!nano v2 pinout: nicekeyboards.com/nice-nano

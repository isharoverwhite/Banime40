# banime40 — ATmega32U4 / QMK Firmware

> **Đây là bản gốc dành cho controller ATmega32U4 (Pro Micro)**
> Xem thư mục `../zmk-config/` cho bản nRF52840 + Bluetooth.

![banime40](https://i.imgur.com/sHQyMfEh.jpeg)

Bàn phím hotswap gasket mount 4×10 hỗ trợ nhiều layout.

- **Maintainer:** [sporewoh](https://github.com/ChrisChrisLoLo)
- **Hardware:** Open source PCB, Pro Micro compatible
- **PCB & Case:** [github.com/ChrisChrisLoLo/banime40](https://github.com/ChrisChrisLoLo/banime40)
- **Upstream QMK:** `keyboards/sporewoh/banime40` (PR #16694, merged 2022-04-13)

## Thông số kỹ thuật

| | |
|---|---|
| MCU | ATmega32U4 (Pro Micro) |
| Bootloader | Caterina |
| Matrix | 4 rows × 10 cols, COL2ROW |
| Row pins | E6, D7, C6, D4 |
| Col pins | B4, B5, B6, B2, B3, B1, F7, F6, F5, F4 |
| USB VID/PID | 0xBEAF / 0x0001 |
| Layers | 10 (dynamic keymap via VIA) |

## Build & Flash

```bash
# Build
make sporewoh/banime40:default

# Flash
make sporewoh/banime40:default:flash
```

## Bootloader

- **Bootmagic reset:** Giữ phím góc trên-trái (Q) khi cắm USB
- **Physical reset:** Nhấn nút reset ở mặt sau PCB

## So sánh với bản nRF52840

| | ATmega32U4 (bản này) | nRF52840 (zmk-config/) |
|---|---|---|
| Firmware | QMK | ZMK |
| Kết nối | USB có dây | USB + Bluetooth 5.0 |
| Pin | Không | LiPo qua B+/B− |
| VIA/VIAL | Có | Không (ZMK Studio) |
| Sleep | Không | Deep sleep 15 phút |
| Controller | Pro Micro (ATmega32U4) | SAMIROB/HBY nRF52840 |

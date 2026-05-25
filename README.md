# banime40 — Firmware Mod

Repo này chứa **2 bản firmware** cho bàn phím [banime40](https://github.com/ChrisChrisLoLo/banime40) (ortholinear 4×10, gasket mount, hotswap).

---

## Bản 1 — ATmega32U4 / QMK (bản gốc)
**Thư mục:** `qmk/`

| | |
|---|---|
| Controller | Pro Micro (ATmega32U4) |
| Firmware | QMK |
| Kết nối | USB có dây |
| VIA/VIAL | Có (10 layers dynamic) |
| Nguồn | USB 5V |

Đây là bản firmware gốc từ upstream QMK (`keyboards/sporewoh/banime40`, PR #16694).
Dùng khi giữ nguyên Pro Micro trên PCB gốc.

```bash
# Build
make sporewoh/banime40:default

# Flash
make sporewoh/banime40:default:flash
```

---

## Bản 2 — nRF52840 / ZMK (bản mod Bluetooth)
**Thư mục:** `zmk-config/`

| | |
|---|---|
| Controller | SAMIROB / HBY nRF52840 (Pro Micro drop-in) |
| Firmware | ZMK |
| Kết nối | USB có dây + Bluetooth 5.0 (5 profiles) |
| VIA/VIAL | Không (dùng ZMK Studio) |
| Nguồn | USB hoặc LiPo qua B+/B− |
| Pin | Báo % qua BLE Battery Service |
| Sleep | Deep sleep sau 15 phút idle |

Swap Pro Micro → SAMIROB/HBY nRF52840 board (cắm thẳng cùng socket, cùng chiều).

```bash
# Build local (yêu cầu Zephyr SDK + west)
west build -p -b nice_nano_v2 -- -DSHIELD=banime40

# Flash: double-tap RST → drag-and-drop zmk.uf2 vào drive NRF52BOOT
```

### Tính năng thêm so với bản gốc

| Tính năng | Cách dùng |
|---|---|
| Chuyển USB ↔ BLE | Tự động (cắm vào máy tính → USB, cắm sạc → BLE giữ nguyên) |
| Chọn BT profile | Giữ `/` → Q/W/E/R/T (BT1–5) |
| Xóa bond BT | Giữ `/` → P |
| Override output | Giữ `/` → U (USB) / I (BLE) / O (toggle) |
| Battery % | Hiện tự động trên host qua BLE |

---

## Cấu trúc repo

```
banime40_mod/
├── README.md                       ← file này
├── CLAUDE.md                       ← hướng dẫn cho Claude Code
├── knowledge/                      ← research notes tích lũy theo session
│
├── qmk/                            ← [ATmega32U4] QMK firmware gốc
│   ├── keyboard.json               ← matrix, pins, USB config
│   ├── readme.md
│   └── keymaps/default/keymap.c   ← 4 layers: Base, Num/Sym, Fn, Nav
│
└── zmk-config/                     ← [nRF52840] ZMK Bluetooth port
    ├── build.yaml
    ├── pin_mapping.csv             ← bảng dịch ATmega32U4 → nRF52840 GPIO
    └── config/boards/shields/banime40/
        ├── banime40.overlay        ← matrix GPIO + battery node
        ├── banime40.keymap         ← 5 layers: Base, Num/Sym, Fn, Nav, System
        ├── banime40.conf           ← BLE, USB, sleep, battery reporting
        ├── CMakeLists.txt
        └── Kconfig.shield
```

---

## Hardware

PCB gốc banime40 dùng **Pro Micro socket** — có thể cắm thẳng nRF52840 clone board mà không cần sửa mạch.

| | Pro Micro (ATmega32U4) | SAMIROB/HBY nRF52840 |
|---|---|---|
| Socket | 2×12 (24 pin) | 2×12 + B+/B− (26 pad, 24 vào socket) |
| Chiều cắm | USB ra ngoài case | Giống hệt |
| Cần sửa PCB | Không | Không |

Chi tiết pin mapping đầy đủ xem `zmk-config/pin_mapping.csv`.

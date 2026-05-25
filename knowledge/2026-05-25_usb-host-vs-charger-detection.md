# USB Host vs Charger Detection trong ZMK

## What was investigated
ZMK có phân biệt USB cắm vào máy tính (data host) vs cắm vào sạc (power only) không?
Và cơ chế tự động chuyển chế độ USB HID / BLE hoạt động thế nào?

## What was found

### ZMK Endpoint Selection (app/src/endpoints.c)
ZMK có hệ thống "endpoint" tự động chọn transport đầu ra:

```
get_selected_transport():
  if USB preferred:
    → USB nếu zmk_usb_is_hid_ready() == true
    → fallback BLE nếu USB không ready
  if BLE preferred:
    → BLE nếu zmk_ble_active_profile_is_connected() == true
    → fallback USB nếu BLE không connected
```

### zmk_usb_is_hid_ready() — Phân biệt host vs charger
Hàm này kiểm tra USB có được **enumerate bởi host** không — KHÔNG chỉ kiểm tra có điện hay không.

- **Cắm vào máy tính**: USB enumerated → `is_hid_ready() = true` → ZMK dùng USB HID
- **Cắm vào sạc**: USB có điện nhưng không enumerate → `is_hid_ready() = false` → ZMK dùng BLE
- **Không cắm gì**: `is_hid_ready() = false` → ZMK dùng BLE

**→ ZMK TỰ ĐỘNG phân biệt charger vs computer mà không cần code thêm.**

### Bluetooth có thực sự bị disconnect không?
**KHÔNG.** ZMK không ngắt kết nối BLE khi chuyển sang USB. Thay vào đó:
- BLE link vẫn active (radio bật, host thấy bàn phím connected)
- Nhưng HID reports chỉ được gửi qua USB
- BLE "im lặng" — không gửi keystroke

Đây là hành vi ĐÚNG vì:
- Nếu disconnect BLE thực sự → mất 1-3 giây reconnect mỗi khi rút USB
- Host BLE vẫn có thể "thấy" trạng thái bàn phím (battery level, connection status)
- Tiêu thụ điện không đáng kể khi BLE idle (không gửi data)

### Output preference persistence
ZMK lưu output preference vào flash. Hành vi mặc định khi cả USB + BLE đều enable:
- Mặc định prefer USB nếu available
- Có thể override thủ công bằng `&out OUT_USB`, `&out OUT_BLE`, `&out OUT_TOG`

## Decision made
**Không cần thêm logic đặc biệt** — ZMK đã xử lý đúng với `CONFIG_ZMK_USB=y` + `CONFIG_ZMK_BLE=y`.

Tuy nhiên cần thêm:
1. `&out` behaviors vào Layer 4 để người dùng có thể override thủ công
2. `&bt` profile selection vào Layer 4 (đã có trong kế hoạch)

## References
- ZMK endpoints.c: github.com/zmkfirmware/zmk/blob/main/app/src/endpoints.c
- ZMK output behavior docs: zmk.dev/docs/keymaps/behaviors/outputs

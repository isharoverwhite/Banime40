# Battery Monitoring on nRF52840 + ZMK

## What was investigated
How ZMK implements battery level reporting and what hardware is needed on the SAMIROB/HBY board.

## What was found

### ZMK Battery Monitoring Architecture
ZMK uses the nRF52840 **SAADC** (Successive Approximation ADC) peripheral to measure battery voltage. The measured voltage is converted to a percentage and reported over the **BLE Battery Service** (UUID 0x180F).

Required Kconfig:
```
CONFIG_ZMK_BATTERY_REPORTING=y
CONFIG_ZMK_BATTERY_REPORT_INTERVAL=60   # seconds between updates
```

### How nice!nano Does It
The nice!nano v2 has an onboard voltage divider (100kΩ / 100kΩ = 2:1 ratio) connected between the battery positive rail and **P0.31** (analog-capable). ZMK reads the raw ADC value on P0.31, doubles it to get true battery voltage, then maps 3.0V → 0%, 4.2V → 100%.

The nice!nano devicetree (`nice_nano.overlay` in ZMK repo) defines:
```dts
/ {
    vbatt: vbatt {
        compatible = "zmk,battery-voltage-divider";
        label = "BATTERY";
        io-channels = <&adc 7>;      /* AIN7 = P0.31 */
        output-ohms = <100000>;
        full-ohms = <200000>;
    };
};
```

### SAMIROB/HBY Board Status
**Unknown** whether this board has a built-in voltage divider.
- The board has B+ and B− pads for direct LiPo connection
- P0.31 is the last pin on the right column (label `031`) — used as **Col 9** in the banime40 matrix

**This is a conflict**: if the board has a voltage divider on P0.31 (like nice!nano), that pin is already used as Col 9 for the keyboard matrix.

### Resolution Options
1. **Check board schematic** — if SAMIROB has a built-in divider on a different ADC pin, use that
2. **External voltage divider** — add a resistor divider between B+ and any unused analog pin:
   - Available unused GPIOs: P0.06, P0.08, P0.17, P0.20
   - nRF52840 analog-capable pins: P0.02, P0.03, P0.04, P0.05, P0.28, P0.29, P0.30, P0.31
   - Of unused GPIOs: P0.06 is AIN2, P0.08 is AIN3 (wait, need to verify)
   - Actually: AIN0=P0.02, AIN1=P0.03, AIN2=P0.04, AIN3=P0.05, AIN4=P0.28, AIN5=P0.29, AIN6=P0.30, AIN7=P0.31
   - **P0.29 (AIN5)** is used as Col 8. **P0.31 (AIN7)** is Col 9.
   - **None of the 4 unused GPIOs (P0.06/08/17/20) are SAADC-capable** — they are digital only!
3. **Relocate a matrix column** — remap Col 8 or 9 to a digital GPIO and free up P0.29 or P0.31 for ADC use. This requires PCB modification (cut trace, add wire).
4. **Use internal VDD measurement** — nRF52840 can measure its own VDD via SAADC channel (no external pin). Less accurate but requires no hardware change.

### Internal VDD Measurement (Option 4 — no hardware change)
ZMK supports this via `zmk,battery-nrf-vddhdiv5`:
```dts
/ {
    vbatt: vbatt {
        compatible = "zmk,battery-nrf-vddhdiv5";
        label = "BATTERY";
    };
};
```
This uses the nRF52840's internal VDDH/5 measurement. Accuracy: ±5%, good enough for coarse battery indicator.

## Decision made — CONFIRMED, IMPLEMENTED
**Use internal VDD measurement** — no hardware change required. ✅

Implemented in:
- `banime40.overlay`: added `vbatt` node with `compatible = "zmk,battery-nrf-vddhdiv5"` and wired to `chosen { zmk,battery = &vbatt; }`
- `banime40.conf`: added `CONFIG_ZMK_BATTERY_REPORTING=y` and `CONFIG_ZMK_BATTERY_REPORT_INTERVAL=60`

BLE Battery Service (UUID 0x180F) will advertise percentage automatically once firmware is flashed.

## TODO
- [ ] Test internal VDD measurement accuracy with actual LiPo after first flash
- [ ] Add battery percentage display behavior to Layer 4 if needed

## References
- ZMK battery docs: zmk.dev/docs/config/battery
- nice!nano overlay: github.com/zmkfirmware/zmk/blob/main/app/boards/arm/nice_nano/nice_nano.overlay
- nRF52840 PS: SAADC chapter, internal VDD measurement

# Battery over USB — ZMK Firmware Patch

## Problem

The ZMK Studio protocol (`core.getDeviceInfo`) only returns `name` and `serialNumber`.  
There is no battery level field, so the webapp cannot display battery % when connected via USB (WebSerial).

## Solution

Patch the ZMK Studio core module to include battery level in the `GetDeviceInfoResponse`.

## Files to modify in `zmk/app/module/studio/`

### 1. `proto/core.proto` — Add battery field

```diff
 message GetDeviceInfoResponse {
   string name = 1;
   bytes serial_number = 2;
+  uint32 battery_level = 3;  // 0-100 %, or 255 if not available
 }
```

After modifying the proto, regenerate the protobuf code:
```bash
cd zmk/app/module/studio/proto
../../scripts/protoc.sh
```

### 2. `core.c` — Read battery and include in response

```diff
 #include <zmk/studio/core.h>
+#include <zmk/battery.h>

 // In the function that handles getDeviceInfo:
 static void handle_get_device_info(...) {
   // ... existing code ...
   
+  // Battery level (0-100%). Returns 255 if battery driver not configured.
+  uint8_t battery_level = 255;
+  #if IS_ENABLED(CONFIG_ZMK_BATTERY_REPORTING)
+  battery_level = zmk_battery_state_of_charge();
+  #endif
+  
   zmk_studio_core_GetDeviceInfoResponse response = {
     .name = { .arg = device_name, .len = strlen(device_name) },
     .serial_number = { .arg = sn_buf, .len = sn_len },
+    .battery_level = battery_level,
   };
   
   // ... encode and send response ...
 }
```

### 3. `Kconfig` — Ensure battery dependency

```diff
 config ZMK_STUDIO_CORE
   bool "ZMK Studio Core"
+  depends on ZMK_BATTERY || !ZMK_BATTERY
```

## Rebuilding

```bash
cd ~/zmk
west build -b nice_nano_v2 -- -DSHIELD=banime40_remap -p
```

Flash the new firmware to your keyboard.

## Webapp side (already implemented)

The webapp's `useStudioConnection.ts` will parse the new `battery_level` field from the
`getDeviceInfo` response. After the firmware patch, battery % will appear in the NavBar
for USB connections as well.

## Notes

- `zmk_battery_state_of_charge()` returns 0-100 (percentage).  
  Check `<zmk/battery.h>` in your ZMK version for the exact function name.
- The battery level is read once on connect. For live updates, polling would be needed.

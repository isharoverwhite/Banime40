#!/usr/bin/env bash
# Build ZMK firmware for banime40_remap shield
# Usage: ./build-firmware.sh [variant]
#   variant: ortho (default) | 2x2.25u | 6.25u
#
# Prerequisites: Docker installed and running
#
# Output: firmware .uf2 file in build/artifacts/

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_DIR="$SCRIPT_DIR/config"
BOARD="nice_nano_v2"
SHIELD="banime40_remap"

echo "================================================"
echo "  ZMK Firmware Build — Banime40 Remap"
echo "  Board:  $BOARD"
echo "  Shield: $SHIELD"
echo "================================================"
echo ""

# Pull ZMK build docker image (pinned to ZMK 2025 stable)
ZMK_IMAGE="zmkfirmware/zmk-build:stable"
echo "[1/3] Pulling ZMK build image..."
docker pull "$ZMK_IMAGE" 2>&1 | tail -1

echo "[2/3] Building firmware... (this takes ~5-10 min on first run)"
docker run --rm \
  -v "$CONFIG_DIR:/workspace/zmk-config/config" \
  -e ZMK_CONFIG="/workspace/zmk-config/config" \
  "$ZMK_IMAGE" \
  west build -d "/workspace/zmk-config/build" -b "$BOARD" -- -DSHIELD="$SHIELD"

echo ""
echo "[3/3] Collecting artifacts..."
mkdir -p "$SCRIPT_DIR/build/artifacts"
cp "$CONFIG_DIR/build/zephyr/zmk.uf2" "$SCRIPT_DIR/build/artifacts/${SHIELD}-${BOARD}.uf2" 2>/dev/null || true

echo ""
echo "================================================"
echo "  Build complete!"
echo "  Firmware: build/artifacts/${SHIELD}-${BOARD}.uf2"
echo "================================================"
echo ""
echo "Flash instructions:"
echo "  1. Double-tap reset button on nRF52840 → enters bootloader (blue LED)"
echo "  2. Copy .uf2 file to the USB drive that appears"
echo "  3. Board reboots automatically with new firmware"

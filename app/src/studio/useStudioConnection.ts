import { useState, useCallback, useRef } from 'react'
import {
  create_rpc_connection,
  call_rpc,
  type RpcConnection,
} from '@zmkfirmware/zmk-studio-ts-client'
import { connect as serialConnect } from '@zmkfirmware/zmk-studio-ts-client/transport/serial'
import { connect as gattConnect } from '@zmkfirmware/zmk-studio-ts-client/transport/gatt'
import { LockState } from '@zmkfirmware/zmk-studio-ts-client/core'
import { SetLayerBindingResponse } from '@zmkfirmware/zmk-studio-ts-client/keymap'
import type { Binding } from '../types/keymap'
import { keyNameToCode, codeToKeyName } from './keyCodes'

const CONNECT_TIMEOUT_MS  = 8_000   // waiting for first RPC response
const BEHAVIOR_TIMEOUT_MS = 15_000  // fetching all behavior details

export type StudioStatus = 'disconnected' | 'connecting' | 'locked' | 'unlocked' | 'error'
export type ConnectType  = 'usb' | 'ble'

interface BehaviorIds {
  kp: number; lt: number; mt: number
  none: number; trans: number; bt: number; out: number
}
interface LayerIds { [editorIndex: number]: number }

/** Raw layer data read from keyboard, before conversion */
export interface KeyboardLayerData {
  id: number       // editor index (0, 1, 2, ...)
  name: string
  bindings: Binding[]  // exactly 40 items
}

export interface StudioState {
  status:    StudioStatus
  label:     string
  toast:     string | null
  clearToast: () => void
  connect:   (type: ConnectType) => Promise<void>
  disconnect: () => void
  applyBinding: (
    editorLayerIndex: number,
    keyPosition: number,
    binding: Binding,
  ) => Promise<'ok' | 'error' | 'not_connected'>
  /** Full keymap read from keyboard on last successful connect/unlock. null until first read. */
  keyboardKeymap: KeyboardLayerData[] | null
  /** Battery level 0-100, or null if not available (e.g. USB connection) */
  batteryLevel: number | null
}

// Rejects after `ms` with `message`
function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ])
}

async function resolveBehaviorIds(conn: RpcConnection): Promise<BehaviorIds> {
  const ids: BehaviorIds = { kp: 0, lt: 0, mt: 0, none: 0, trans: 0, bt: 0, out: 0 }
  const listResp = await call_rpc(conn, { behaviors: { listAllBehaviors: true } })
  const idList   = listResp.behaviors?.listAllBehaviors?.behaviors ?? []
  for (const id of idList) {
    const det  = await call_rpc(conn, { behaviors: { getBehaviorDetails: { behaviorId: id } } })
    const name = det.behaviors?.getBehaviorDetails?.displayName ?? ''
    const lc   = name.toLowerCase()
    if      (/key[\s_-]?press/.test(lc))  ids.kp    = id
    else if (/layer[\s_-]?tap/.test(lc))  ids.lt    = id
    else if (/mod[\s_-]?tap/.test(lc))    ids.mt    = id
    else if (lc === 'none' || lc === 'key none') ids.none  = id
    else if (/transparent/.test(lc))      ids.trans = id
    else if (/bluetooth/.test(lc))        ids.bt    = id
    else if (/output/.test(lc))           ids.out   = id
  }
  return ids
}

// ── Reverse: ZMK BehaviorBinding → editor Binding ──────────────────
function protoToBinding(
  bb: { behaviorId: number; param1: number; param2: number },
  beh: BehaviorIds,
  zmkToEditor: { [zmkLayerId: number]: number },
): Binding {
  const { behaviorId: id, param1: p1, param2: p2 } = bb

  // kp
  if (id === beh.kp) {
    const key = codeToKeyName(p1)
    return key ? { type: 'kp', key } : { type: 'none' }
  }
  // lt
  if (id === beh.lt) {
    const layer = zmkToEditor[p1] ?? p1
    const key   = codeToKeyName(p2)
    if (!key) return { type: 'mo', layer }  // hold-only layer switch
    return { type: 'lt', layer, key }
  }
  // mt
  if (id === beh.mt) {
    const mod = codeToKeyName(p1)
    const key = codeToKeyName(p2)
    return { type: 'mt', mod: mod || '', key: key || '' }
  }
  // mo (momentary layer) — same behaviorId as lt but param2=0
  if (id === beh.lt && p2 === 0) {
    const layer = zmkToEditor[p1] ?? p1
    return { type: 'mo', layer }
  }
  // none
  if (id === beh.none) return { type: 'none' }
  // trans
  if (id === beh.trans) return { type: 'trans' }
  // bt
  if (id === beh.bt) {
    if (p1 === 3) return { type: 'bt_clr' }
    return { type: 'bt_sel', profile: p2 }
  }
  // out
  if (id === beh.out) {
    if (p1 === 1) return { type: 'out_usb' }
    if (p1 === 2) return { type: 'out_ble' }
    return { type: 'out_tog' }
  }
  return { type: 'none' }
}

// ── Read full keymap from keyboard ─────────────────────────────────
async function resolveKeymapFromKeyboard(
  conn: RpcConnection,
  beh: BehaviorIds,
): Promise<{ layerIds: LayerIds; layers: KeyboardLayerData[] }> {
  const resp      = await call_rpc(conn, { keymap: { getKeymap: true } })
  const zmkLayers = resp.keymap?.getKeymap?.layers ?? []

  const layerIds: LayerIds          = {}
  const zmkToEditor: { [id: number]: number } = {}

  zmkLayers.forEach((layer, i) => {
    layerIds[i]        = layer.id
    zmkToEditor[layer.id] = i
  })

  const layers: KeyboardLayerData[] = zmkLayers.map((layer, i) => ({
    id: i,
    name: layer.name || `Layer ${i}`,
    bindings: (layer.bindings ?? []).map(b => protoToBinding(b, beh, zmkToEditor)),
  }))

  return { layerIds, layers }
}

// ── Read battery level via BLE Battery Service ─────────────────────
const BATTERY_SERVICE_UUID    = 0x180F
const BATTERY_LEVEL_CHRC_UUID = 0x2A19

async function readBatteryBle(): Promise<number | null> {
  try {
    const nav = navigator as any
    // getDevices() returns previously permitted devices (no picker)
    if (typeof nav.bluetooth?.getDevices !== 'function') return null
    const devices: any[] = await nav.bluetooth.getDevices()
    if (!devices || devices.length === 0) return null

    // Try each device that has a connected GATT server
    for (const dev of devices) {
      if (!dev.gatt?.connected) continue
      try {
        const svc  = await dev.gatt.getPrimaryService(BATTERY_SERVICE_UUID)
        const char = await svc.getCharacteristic(BATTERY_LEVEL_CHRC_UUID)
        const val  = await char.readValue()
        return val.getUint8(0)  // 0-100 %
      } catch {
        // Battery service not available on this device
      }
    }
    return null
  } catch {
    return null
  }
}

function bindingToProto(
  binding: Binding,
  beh: BehaviorIds,
  layerIds: LayerIds,
): { behaviorId: number; param1: number; param2: number } | null {
  switch (binding.type) {
    case 'kp': {
      const code = keyNameToCode(binding.key ?? '')
      if (!code) return null
      return { behaviorId: beh.kp, param1: code, param2: 0 }
    }
    case 'lt': {
      const lid  = layerIds[binding.layer ?? 0] ?? (binding.layer ?? 0)
      const code = keyNameToCode(binding.key ?? '')
      return { behaviorId: beh.lt, param1: lid, param2: code }
    }
    case 'mt': {
      const m = keyNameToCode(binding.mod ?? '')
      const k = keyNameToCode(binding.key ?? '')
      return { behaviorId: beh.mt, param1: m, param2: k }
    }
    case 'none':    return { behaviorId: beh.none,  param1: 0, param2: 0 }
    case 'trans':   return { behaviorId: beh.trans, param1: 0, param2: 0 }
    case 'bt_sel':  return { behaviorId: beh.bt,  param1: 0, param2: binding.profile ?? 0 }
    case 'bt_clr':  return { behaviorId: beh.bt,  param1: 3, param2: 0 }
    case 'out_usb': return { behaviorId: beh.out, param1: 1, param2: 0 }
    case 'out_ble': return { behaviorId: beh.out, param1: 2, param2: 0 }
    case 'out_tog': return { behaviorId: beh.out, param1: 0, param2: 0 }
    default:        return null
  }
}

async function drainNotifications(
  conn: RpcConnection,
  signal: AbortSignal,
  onLockChange: (unlocked: boolean) => void,
): Promise<void> {
  const reader  = conn.notification_readable.getReader()
  const onAbort = () => { reader.cancel().catch(() => {}); reader.releaseLock() }
  signal.addEventListener('abort', onAbort, { once: true })
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done || signal.aborted) break
      const state = value?.core?.lockStateChanged
      if (state !== undefined) {
        onLockChange(state === LockState.ZMK_STUDIO_CORE_LOCK_STATE_UNLOCKED)
      }
    }
  } finally {
    signal.removeEventListener('abort', onAbort)
    try { reader.releaseLock() } catch {}
  }
}

export function useStudioConnection(): StudioState {
  const [status, setStatus] = useState<StudioStatus>('disconnected')
  const [label,  setLabel]  = useState('')
  const [toast,  setToast]  = useState<string | null>(null)
  const [keyboardKeymap, setKeyboardKeymap] = useState<KeyboardLayerData[] | null>(null)
  const [batteryLevel,   setBatteryLevel]   = useState<number | null>(null)

  const connRef        = useRef<RpcConnection | null>(null)
  const behaviorIdsRef = useRef<BehaviorIds | null>(null)
  const layerIdsRef    = useRef<LayerIds | null>(null)
  const abortRef       = useRef<AbortController | null>(null)
  const connectTypeRef = useRef<ConnectType | null>(null)

  const clearToast = useCallback(() => setToast(null), [])

  const disconnect = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current        = null
    connRef.current         = null
    behaviorIdsRef.current  = null
    layerIdsRef.current     = null
    connectTypeRef.current  = null
    setStatus('disconnected')
    setLabel('')
    setKeyboardKeymap(null)
    setBatteryLevel(null)
  }, [])

  // Shared "unlock" handler — reads behaviors, keymap, battery
  const onUnlock = useCallback(async (conn: RpcConnection, cType: ConnectType) => {
    const beh = await withTimeout(
      resolveBehaviorIds(conn),
      BEHAVIOR_TIMEOUT_MS,
      'Timeout khi đọc danh sách behaviors từ bàn phím.'
    )
    behaviorIdsRef.current = beh

    const { layerIds, layers } = await resolveKeymapFromKeyboard(conn, beh)
    layerIdsRef.current = layerIds
    setKeyboardKeymap(layers)
    setStatus('unlocked')

    // Battery: try BLE Battery Service first, then check getDeviceInfo (USB firmware patch)
    if (cType === 'ble') {
      const lvl = await readBatteryBle()
      if (lvl != null) { setBatteryLevel(lvl); return }
    }
    // USB: check if firmware has battery in getDeviceInfo (requires firmware patch)
    try {
      const devInfo = await call_rpc(conn, { core: { getDeviceInfo: true } })
      const batLevel = (devInfo.core?.getDeviceInfo as any)?.batteryLevel as number | undefined
      if (batLevel != null && batLevel <= 100) {
        setBatteryLevel(batLevel)
      }
    } catch { /* getDeviceInfo may not include battery yet */ }
  }, [])

  const connect = useCallback(async (type: ConnectType) => {
    try {
      setStatus('connecting')
      setToast(null)
      setKeyboardKeymap(null)
      setBatteryLevel(null)
      connectTypeRef.current = type

      const transport = type === 'usb' ? await serialConnect() : await gattConnect()
      const abort     = new AbortController()
      abortRef.current = abort

      const conn = create_rpc_connection(transport, { signal: abort.signal })
      connRef.current = conn
      setLabel(transport.label)

      // Initial lock state — timeout if keyboard isn't responding
      const lockResp = await withTimeout(
        call_rpc(conn, { core: { getLockState: true } }),
        CONNECT_TIMEOUT_MS,
        'Keyboard không phản hồi. Kiểm tra firmware có CONFIG_ZMK_STUDIO=y và kết nối USB.'
      )
      const isUnlocked = lockResp.core?.getLockState === LockState.ZMK_STUDIO_CORE_LOCK_STATE_UNLOCKED

      if (isUnlocked) {
        await onUnlock(conn, type)
      } else {
        setStatus('locked')
      }

      // Background: listen for lock state changes
      drainNotifications(conn, abort.signal, async (unlocked) => {
        if (!unlocked) { setStatus('locked'); setKeyboardKeymap(null); setBatteryLevel(null); return }
        if (conn !== connRef.current) return
        try {
          await onUnlock(conn, connectTypeRef.current ?? 'usb')
        } catch (err) {
          setToast(err instanceof Error ? err.message : 'Lỗi sau khi mở khóa.')
          disconnect()
        }
      }).catch(() => disconnect())

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      // User cancelled the OS port picker → silent
      if (/cancel|no port|user dismissed/i.test(msg)) {
        setStatus('disconnected')
        return
      }
      console.error('[studio]', err)
      setToast(msg)
      setStatus('error')
    }
  }, [disconnect, onUnlock])

  const applyBinding = useCallback(async (
    editorLayerIndex: number,
    keyPosition: number,
    binding: Binding,
  ): Promise<'ok' | 'error' | 'not_connected'> => {
    const conn    = connRef.current
    const beh     = behaviorIdsRef.current
    const layers  = layerIdsRef.current
    if (!conn || !beh || !layers || status !== 'unlocked') return 'not_connected'

    const proto = bindingToProto(binding, beh, layers)
    if (!proto) return 'error'

    const zmkLayerId = layers[editorLayerIndex] ?? editorLayerIndex
    try {
      const resp   = await call_rpc(conn, {
        keymap: { setLayerBinding: { layerId: zmkLayerId, keyPosition, binding: proto } },
      })
      const result = resp.keymap?.setLayerBinding
      if (result === SetLayerBindingResponse.SET_LAYER_BINDING_RESP_OK) {
        await call_rpc(conn, { keymap: { saveChanges: true } })
        return 'ok'
      }
      return 'error'
    } catch (err) {
      console.error('[studio] setLayerBinding', err)
      return 'error'
    }
  }, [status])

  return { status, label, toast, clearToast, connect, disconnect, applyBinding, keyboardKeymap, batteryLevel }
}

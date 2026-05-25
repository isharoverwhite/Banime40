import { useState, useEffect, useCallback, useRef, useReducer, useMemo } from 'react'
import type { Binding, Keymap, SpacebarVariant } from '../types/keymap'
import { DEFAULT_KEYMAP } from '../data/defaultKeymap'
import { saveKeymap, loadKeymap, deleteKeymap } from '../store/db'

const MAX_HISTORY = 50

export function useKeymap() {
  const [keymap, setKeymap]           = useState<Keymap>(DEFAULT_KEYMAP)
  const [activeLayer, setActiveLayer] = useState(0)
  const [selectedKey, setSelectedKey] = useState<number | null>(null)
  const [showExport, setShowExport]   = useState(false)
  const [isDirty, setIsDirty]         = useState(false)
  const [saveStatus, setSaveStatus]   = useState<'idle' | 'saving' | 'saved'>('idle')

  // History for undo/redo — use refs to avoid stale closures
  const historyRef  = useRef<Keymap[]>([DEFAULT_KEYMAP])
  const histIdxRef  = useRef(0)
  const [, tick]    = useReducer(x => x + 1, 0) // force re-render on undo/redo

  useEffect(() => {
    loadKeymap('default').then(saved => {
      if (saved) {
        setKeymap(saved)
        historyRef.current = [saved]
        histIdxRef.current = 0
      }
    })
  }, [])

  const pushHistory = useCallback((next: Keymap) => {
    // Truncate any redo history, then append
    historyRef.current = historyRef.current.slice(0, histIdxRef.current + 1)
    historyRef.current.push(next)
    if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift()
    histIdxRef.current = historyRef.current.length - 1
  }, [])

  const updateBinding = useCallback((position: number, binding: Binding) => {
    setKeymap(prev => {
      const layers = prev.layers.map(layer => {
        if (layer.id !== activeLayer) return layer
        const bindings = [...layer.bindings]
        bindings[position] = binding
        return { ...layer, bindings }
      })
      const next = { ...prev, layers }
      pushHistory(next)
      return next
    })
    setIsDirty(true)
    setSelectedKey(null)
  }, [activeLayer, pushHistory])

  const setVariant = useCallback((variant: SpacebarVariant) => {
    setKeymap(prev => {
      const next = { ...prev, spacebarVariant: variant }
      pushHistory(next)
      return next
    })
    setIsDirty(true)
  }, [pushHistory])

  // ── Refs for auto-save (must be declared before save callback) ──
  const keymapRef = useRef(keymap)
  keymapRef.current = keymap
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isDirtyRef = useRef(isDirty)
  isDirtyRef.current = isDirty

  const undo = useCallback(() => {
    if (histIdxRef.current <= 0) return
    histIdxRef.current--
    const prev = historyRef.current[histIdxRef.current]
    setKeymap(prev)
    setIsDirty(true)
    tick()
  }, [])

  const redo = useCallback(() => {
    if (histIdxRef.current >= historyRef.current.length - 1) return
    histIdxRef.current++
    const next = historyRef.current[histIdxRef.current]
    setKeymap(next)
    setIsDirty(true)
    tick()
  }, [])

  const save = useCallback(async () => {
    setSaveStatus('saving')
    await saveKeymap(keymapRef.current)
    setIsDirty(false)
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus('idle'), 1500)
  }, [])

  const reset = useCallback(async () => {
    // Clear persisted keymap from IndexedDB
    await deleteKeymap('default')
    // Reset to factory defaults
    setKeymap(DEFAULT_KEYMAP)
    historyRef.current = [DEFAULT_KEYMAP]
    histIdxRef.current = 0
    setIsDirty(false)
    setSaveStatus('idle')
    setActiveLayer(0)
    setSelectedKey(null)
    tick()
  }, [])

  // ── Auto-save effect ──────────────────────────────────────────────

  // Stable fingerprint to detect changes
  const keymapFingerprint = useMemo(() =>
    JSON.stringify(keymap.layers.map(l => l.bindings)) + keymap.spacebarVariant,
  [keymap])

  useEffect(() => {
    if (!isDirtyRef.current) return
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(async () => {
      if (!isDirtyRef.current) return // already saved
      setSaveStatus('saving')
      await saveKeymap(keymapRef.current)
      setIsDirty(false)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 1500)
    }, 1500)
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
  }, [keymapFingerprint]) // eslint-disable-line react-hooks/exhaustive-deps

  const currentBindings = keymap.layers[activeLayer]?.bindings ?? []

  // Load keymap read from physical keyboard (on connect/unlock)
  const loadFromKeyboard = useCallback((kbLayers: { id: number; name: string; bindings: Binding[] }[]) => {
    setKeymap(prev => {
      // Preserve existing variant; only replace layer bindings + names
      const layers = kbLayers.map(kl => ({
        id: kl.id,
        name: kl.name,
        bindings: kl.bindings,
      }))
      const next = { ...prev, layers, updatedAt: Date.now() }
      historyRef.current = [next]
      histIdxRef.current = 0
      return next
    })
    setIsDirty(false)
    setSaveStatus('idle')
    // Auto-save the keyboard's state to IndexedDB
    const next = { ...keymapRef.current, layers: kbLayers.map(kl => ({ id: kl.id, name: kl.name, bindings: kl.bindings })), updatedAt: Date.now() }
    saveKeymap(next)
  }, [])

  return {
    keymap,
    activeLayer,
    setActiveLayer,
    selectedKey,
    setSelectedKey,
    showExport,
    setShowExport,
    isDirty,
    saveStatus,
    currentBindings,
    updateBinding,
    setVariant,
    save,
    reset,
    undo,
    redo,
    canUndo: histIdxRef.current > 0,
    canRedo: histIdxRef.current < historyRef.current.length - 1,
    loadFromKeyboard,
  }
}

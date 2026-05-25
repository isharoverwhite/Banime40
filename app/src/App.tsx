import { useEffect, useMemo, useRef, useState } from 'react'
import { NavBar }          from './components/NavBar'
import { KeyboardGrid }    from './components/KeyboardGrid'
import { LayerTabs }       from './components/LayerTabs'
import { KeyBindingModal } from './components/KeyBindingModal'
import { ExportModal }     from './components/ExportModal'
import { useKeymap }       from './hooks/useKeymap'
import { useStudioConnection } from './studio/useStudioConnection'
import { Toast }               from './components/Toast'
import { computeLayerActivePositions } from './data/layoutVariants'

export function App() {
  const {
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
    loadFromKeyboard,
  } = useKeymap()

  const studio = useStudioConnection()
  const [macLayout, setMacLayout] = useState(false)
  const [selectedKeyRect, setSelectedKeyRect] = useState<DOMRect | null>(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  // When keyboard connects and keymap is read, load it into the editor
  const prevKbKeymapRef = useRef(studio.keyboardKeymap)
  useEffect(() => {
    if (studio.keyboardKeymap && studio.keyboardKeymap !== prevKbKeymapRef.current) {
      prevKbKeymapRef.current = studio.keyboardKeymap
      loadFromKeyboard(studio.keyboardKeymap)
    }
  }, [studio.keyboardKeymap, loadFromKeyboard])

  // Compute per-layer visibility for the modal guard
  const layerActivePositions = useMemo(() => {
    const allBindings = keymap.layers.map(l => l.bindings)
    return computeLayerActivePositions(activeLayer, allBindings, keymap.spacebarVariant)
  }, [keymap.layers, activeLayer, keymap.spacebarVariant])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showExport) { setShowExport(false); return }
        if (selectedKey !== null) { setSelectedKey(null); return }
      }
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault(); undo(); return
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault(); redo(); return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault(); save()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [showExport, selectedKey, undo, redo, save, setShowExport, setSelectedKey])

  const currentLayer = keymap.layers[activeLayer]

  return (
    <div className="h-screen flex flex-col overflow-hidden hero-glow">
      <NavBar
        variant={keymap.spacebarVariant}
        onVariantChange={setVariant}
        onSave={save}
        onExport={() => setShowExport(true)}
        onReset={() => setShowResetConfirm(true)}
        isDirty={isDirty}
        saveStatus={saveStatus}
        studio={studio}
        macLayout={macLayout}
        onMacLayoutToggle={() => setMacLayout(m => !m)}
        batteryLevel={studio.batteryLevel}
      />

      <main className="flex-1 flex items-center justify-center overflow-hidden">
        <KeyboardGrid
          layerName={currentLayer.name}
          layerId={activeLayer}
          bindings={currentBindings}
          selectedKey={selectedKey}
          spacebarVariant={keymap.spacebarVariant}
          allLayers={keymap.layers}
          activeLayerIndex={activeLayer}
          macLayout={macLayout}
          onKeyClick={(pos, rect) => {
            if (pos === selectedKey) { setSelectedKey(null) }
            else { setSelectedKey(pos); setSelectedKeyRect(rect) }
          }}
        />
      </main>

      <LayerTabs
        layers={keymap.layers}
        activeLayer={activeLayer}
        onLayerChange={id => { setActiveLayer(id); setSelectedKey(null) }}
      />

      {selectedKey !== null && layerActivePositions[selectedKey] && selectedKeyRect && (
        <KeyBindingModal
          key={selectedKey}
          position={selectedKey}
          currentBinding={currentBindings[selectedKey]}
          onConfirm={b => updateBinding(selectedKey, b)}
          onClose={() => setSelectedKey(null)}
          layerCount={keymap.layers.length}
          activeLayerIndex={activeLayer}
          studio={studio}
          anchorRect={selectedKeyRect}
        />
      )}

      {showExport && (
        <ExportModal
          keymap={keymap}
          onClose={() => setShowExport(false)}
        />
      )}

      {showResetConfirm && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
          onClick={() => setShowResetConfirm(false)}
        >
          <div
            className="w-[380px] rounded-2xl flex flex-col overflow-hidden"
            style={{
              background: 'linear-gradient(160deg, #1a1c35 0%, #111228 100%)',
              border: '1px solid rgba(248,113,113,0.3)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(248,113,113,0.12)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-5 py-4"
              style={{
                background: 'linear-gradient(90deg, rgba(248,113,113,0.12) 0%, transparent 100%)',
                borderBottom: '1px solid rgba(248,113,113,0.15)',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 22, color: '#f87171', fontVariationSettings: "'FILL' 0, 'wght' 500, 'GRAD' 0, 'opsz' 24" }}
              >
                warning
              </span>
              <div>
                <p className="text-on-surface font-sans font-semibold text-sm">Reset Keymap</p>
                <p className="text-on-surface-variant text-[11px] font-mono mt-0.5">This cannot be undone</p>
              </div>
            </div>

            {/* Body */}
            <div className="px-5 py-4">
              <p className="text-on-surface-variant text-[12px] font-sans leading-relaxed">
                This will restore <span className="text-on-surface font-semibold">all 5 layers</span> to their
                factory default bindings and discard any changes you&apos;ve made.
              </p>
            </div>

            {/* Footer */}
            <div
              className="flex gap-2 px-5 py-3.5"
              style={{ borderTop: '1px solid rgba(46,48,96,0.4)' }}
            >
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2 rounded-lg text-[11px] font-sans transition-all hover:bg-white/5"
                style={{ border: '1px solid rgba(46,48,96,0.8)', color: '#a8aacc' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  reset()
                  setShowResetConfirm(false)
                }}
                className="flex-1 py-2 rounded-lg text-[11px] font-sans font-semibold transition-all hover:brightness-110"
                style={{
                  background: 'linear-gradient(135deg, #f87171, #ef4444)',
                  color: '#fff',
                  boxShadow: '0 0 14px rgba(248,113,113,0.4)',
                }}
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      )}

      {studio.toast && (
        <Toast message={studio.toast} onDismiss={studio.clearToast} />
      )}
    </div>
  )
}

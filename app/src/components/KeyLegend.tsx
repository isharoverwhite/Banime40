const LEGEND_ITEMS = [
  {
    label: 'Normal',
    preview: { bg: 'linear-gradient(145deg, #252848 0%, #161830 100%)', border: '1px solid rgba(46,48,96,0.9)', text: '#e8e9f8', shadow: 'none', accent: null },
    tap: 'A',
  },
  {
    label: 'Modifier',
    preview: { bg: 'linear-gradient(145deg, #252848 0%, #161830 100%)', border: '1px solid rgba(46,48,96,0.9)', text: '#e8e9f8', shadow: 'none',
      accent: { pos: 'left', color: '#a78bfa', glow: 'rgba(167,139,250,0.7)' } },
    tap: 'Shift',
  },
  {
    label: 'Layer Tap',
    preview: { bg: 'linear-gradient(145deg, #252848 0%, #161830 100%)', border: '1px solid rgba(46,48,96,0.9)', text: '#e8e9f8', shadow: 'none',
      accent: { pos: 'bottom', color: '#f97316', glow: 'rgba(249,115,22,0.7)' } },
    tap: 'Bsp',
    hold: '▼FN',
  },
  {
    label: 'Mod Tap',
    preview: { bg: 'linear-gradient(145deg, #252848 0%, #161830 100%)', border: '1px solid rgba(46,48,96,0.9)', text: '#e8e9f8', shadow: 'none',
      accent: { pos: 'bottom', color: '#f97316', glow: 'rgba(249,115,22,0.7)' } },
    tap: 'Tab',
    hold: 'Ctrl',
  },
  {
    label: 'Arrow',
    preview: { bg: 'linear-gradient(145deg, #252848 0%, #161830 100%)', border: '1px solid rgba(46,48,96,0.9)', text: '#34d399', shadow: 'none', accent: null },
    tap: '↑',
  },
  {
    label: 'Bluetooth',
    preview: { bg: 'linear-gradient(145deg, #252848 0%, #161830 100%)', border: '1px solid rgba(46,48,96,0.9)', text: '#38bdf8', shadow: 'none', accent: null },
    tap: 'BT1',
  },
  {
    label: 'Transparent',
    preview: { bg: 'linear-gradient(145deg, #252848 0%, #161830 100%)', border: '1px dashed rgba(168,170,204,0.2)', text: 'rgba(168,170,204,0.35)', shadow: 'none', accent: null },
    tap: '···',
  },
  {
    label: 'Blocked',
    preview: { bg: '#090b14', border: '1px solid rgba(46,48,96,0.6)', text: 'rgba(46,48,96,0.6)', shadow: 'none', accent: null },
    tap: '',
  },
] as const

export function KeyLegend() {
  return (
    <div
      className="flex flex-col gap-2 px-5 py-3 rounded-xl"
      style={{
        background: 'rgba(14,15,28,0.65)',
        border: '1px solid rgba(46,48,96,0.45)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 11, color: 'rgba(167,139,250,0.5)', fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
        >
          info
        </span>
        <span className="text-[9px] font-mono uppercase tracking-[0.18em]" style={{ color: 'rgba(167,139,250,0.45)' }}>
          Key Types
        </span>
      </div>

      {/* Legend items */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {LEGEND_ITEMS.map(item => (
          <div key={item.label} className="flex items-center gap-2">
            {/* Mini keycap swatch */}
            <div
              className="relative flex flex-col items-center justify-center rounded flex-shrink-0"
              style={{
                width: 38,
                height: 30,
                background: item.preview.bg,
                border: item.preview.border,
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 4px rgba(0,0,0,0.4)',
                opacity: item.tap === '' ? 0.22 : 1,
              }}
            >
              {/* Top highlight */}
              <div
                className="absolute top-0 left-1 right-1 rounded-full"
                style={{ height: 1, background: 'rgba(255,255,255,0.07)' }}
              />

              {/* Left accent (modifier) */}
              {item.preview.accent?.pos === 'left' && (
                <div
                  className="absolute left-0 rounded-full"
                  style={{
                    top: 4, bottom: 4, width: 2,
                    background: item.preview.accent.color,
                    boxShadow: `0 0 5px ${item.preview.accent.glow}`,
                  }}
                />
              )}
              {/* Bottom accent (layer-trigger) */}
              {item.preview.accent?.pos === 'bottom' && (
                <div
                  className="absolute bottom-0 rounded-full"
                  style={{
                    left: 4, right: 4, height: 2,
                    background: item.preview.accent.color,
                    boxShadow: `0 0 5px ${item.preview.accent.glow}`,
                  }}
                />
              )}

              {/* Tap label */}
              <span
                className="font-mono font-semibold leading-none"
                style={{ fontSize: 9, color: item.preview.text, letterSpacing: '0.02em' }}
              >
                {item.tap || '—'}
              </span>

              {/* Hold label */}
              {'hold' in item && item.hold && (
                <span
                  className="absolute font-mono font-bold leading-none"
                  style={{ fontSize: 7, bottom: 2, color: '#f97316' }}
                >
                  {item.hold}
                </span>
              )}
            </div>

            {/* Label */}
            <span
              className="text-[10px] font-sans leading-none"
              style={{ color: 'rgba(168,170,204,0.65)' }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

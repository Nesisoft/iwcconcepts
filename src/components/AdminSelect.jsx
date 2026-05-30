/**
 * AdminSelect — dark-themed dropdown for admin pages.
 *
 * Replaces native <select> whose option popup ignores inline styles in most
 * browsers (always renders with the OS white background).
 *
 * Props:
 *   value      – current value string
 *   onChange   – fires { target: { value } } so existing e.target.value
 *                handlers work without change
 *   options    – array of { value, label } objects  OR  plain strings
 *   style      – applied to the outer wrapper (use for width / flex sizing)
 *   placeholder – text shown when value is empty (default "Select…")
 *   disabled
 */
import { useState, useEffect, useRef } from 'react'

export default function AdminSelect({
  value,
  onChange,
  options = [],
  style,
  placeholder = 'Select…',
  disabled = false,
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function onDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  function label(opt) { return typeof opt === 'string' ? opt : opt.label }
  function val(opt)   { return typeof opt === 'string' ? opt : opt.value }

  const selected = options.find(o => val(o) === value)
  const display  = selected ? label(selected) : placeholder

  function pick(v) {
    onChange({ target: { value: v } })
    setOpen(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative', ...style }}>

      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        style={{
          width: '100%', minHeight: 32,
          background: 'rgba(255,255,255,0.06)',
          border: `1px solid rgba(255,255,255,${open ? '0.28' : '0.15'})`,
          borderRadius: 8,
          padding: '7px 28px 7px 11px',
          color: value !== undefined && value !== '' ? '#fff' : 'rgba(255,255,255,0.38)',
          fontSize: 12,
          fontFamily: "'Montserrat', sans-serif",
          cursor: disabled ? 'not-allowed' : 'pointer',
          textAlign: 'left',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          position: 'relative',
          outline: 'none',
          transition: 'border-color 0.15s',
          boxSizing: 'border-box',
        }}
      >
        {display}
        <span style={{
          position: 'absolute', right: 9, top: '50%',
          transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
          fontSize: 8, color: 'rgba(255,255,255,0.45)',
          transition: 'transform 0.15s',
          pointerEvents: 'none', lineHeight: 1,
        }}>▼</span>
      </button>

      {/* Options panel */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)',
          left: 0, minWidth: '100%',
          background: '#1b1030',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: 8, zIndex: 2000,
          maxHeight: 260, overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}>
          {options.map((opt, i) => {
            const v = val(opt)
            const l = label(opt)
            const active = v === value
            return (
              <button
                key={v ?? i}
                type="button"
                onClick={() => pick(v)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '9px 14px',
                  background: active ? 'rgba(201,168,76,0.16)' : 'transparent',
                  color: active ? '#C9A84C' : 'rgba(255,255,255,0.82)',
                  border: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  fontSize: 12,
                  fontFamily: "'Montserrat', sans-serif",
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
              >
                {l}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

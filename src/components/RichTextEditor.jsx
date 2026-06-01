import { useRef, useEffect, useState } from 'react'

const TOOLBAR = [
  { cmd: 'bold',                icon: 'B',    label: 'Bold',         btnStyle: { fontWeight: 900 } },
  { cmd: 'italic',              icon: 'I',    label: 'Italic',       btnStyle: { fontStyle: 'italic' } },
  { cmd: 'underline',           icon: 'U̲',   label: 'Underline' },
  null,
  { cmd: 'formatBlock', arg: 'h2', icon: 'H2', label: 'Heading 2',  btnStyle: { fontWeight: 800 } },
  { cmd: 'formatBlock', arg: 'h3', icon: 'H3', label: 'Heading 3',  btnStyle: { fontWeight: 800 } },
  { cmd: 'formatBlock', arg: 'p',  icon: '¶',  label: 'Paragraph' },
  null,
  { cmd: 'insertUnorderedList', icon: '• —',  label: 'Bullet list' },
  { cmd: 'insertOrderedList',   icon: '1. —', label: 'Numbered list' },
  null,
  { cmd: 'createLink',          icon: '⇗',    label: 'Insert link',  needsUrl: true },
  { cmd: 'unlink',              icon: '✕⇗',  label: 'Remove link' },
]

/**
 * A lightweight contenteditable rich-text editor with a formatting toolbar.
 * Stores and returns HTML strings via the `value`/`onChange` props.
 *
 * Props:
 *   value      string   — HTML content
 *   onChange   fn(html) — called on every edit
 *   placeholder string  — shown when empty
 *   minRows    number   — minimum visible height in "rows" (default 5)
 *   dark       bool     — use dark-theme palette (default false)
 */
export default function RichTextEditor({
  value = '', onChange, placeholder = 'Type here…', minRows = 5, dark = false,
}) {
  const ref  = useRef(null)
  const skip = useRef(false)
  const [focused, setFocused] = useState(false)

  // Sync value → DOM only when the change comes from outside (not from user typing).
  useEffect(() => {
    if (!ref.current || skip.current) return
    const html = value || ''
    if (ref.current.innerHTML !== html) ref.current.innerHTML = html
  }, [value])

  function exec(cmd, arg, needsUrl) {
    if (needsUrl) {
      const url = window.prompt('Enter URL (include https://):')
      if (!url) return
      arg = url
    }
    ref.current?.focus()
    document.execCommand(cmd, false, arg ?? null)
    emitChange()
  }

  function emitChange() {
    skip.current = true
    onChange?.(ref.current?.innerHTML ?? '')
    requestAnimationFrame(() => { skip.current = false })
  }

  // Theme
  const bdr    = dark ? '1px solid rgba(255,255,255,0.15)' : '1px solid #e5e7eb'
  const bdrFoc = dark ? '1px solid rgba(108,63,197,0.8)'  : '1px solid #6c3fc5'
  const toolBg = dark ? 'rgba(255,255,255,0.06)'          : '#f3f4f6'
  const editBg = dark ? 'rgba(255,255,255,0.04)'          : '#fff'
  const txtCol = dark ? 'rgba(255,255,255,0.9)'           : '#111827'
  const phCol  = dark ? 'rgba(255,255,255,0.3)'           : '#9ca3af'
  const sepCol = dark ? 'rgba(255,255,255,0.14)'          : '#d1d5db'
  const btnHov = dark ? 'rgba(255,255,255,0.1)'           : '#e5e7eb'

  const isEmpty = !value || value === '<br>' || value === '<p><br></p>' || value === '<div><br></div>'

  return (
    <div style={{
      border: focused ? bdrFoc : bdr,
      borderRadius: 8, overflow: 'hidden',
      width: '100%', boxSizing: 'border-box',
      transition: 'border-color 0.15s',
    }}>
      {/* ── Toolbar ── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1,
        padding: '5px 8px', background: toolBg, borderBottom: bdr,
      }}>
        {TOOLBAR.map((t, i) =>
          t === null
            ? <span key={i} style={{ width: 1, background: sepCol, height: 14, margin: '0 5px', flexShrink: 0 }} />
            : (
              <button
                key={i}
                type="button"
                title={t.label}
                onMouseDown={e => { e.preventDefault(); exec(t.cmd, t.arg, t.needsUrl) }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', userSelect: 'none',
                  padding: '4px 7px', borderRadius: 5, fontSize: 11, lineHeight: 1,
                  color: txtCol, fontFamily: 'inherit', ...(t.btnStyle || {}),
                }}
                onMouseEnter={e => { e.currentTarget.style.background = btnHov }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
              >
                {t.icon}
              </button>
            )
        )}
      </div>

      {/* ── Editable area ── */}
      <div style={{ position: 'relative' }}>
        {isEmpty && !focused && (
          <div style={{
            position: 'absolute', top: 10, left: 12, right: 12,
            color: phCol, pointerEvents: 'none', fontSize: 13, lineHeight: 1.6,
          }}>
            {placeholder}
          </div>
        )}
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={emitChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            minHeight: `${minRows * 1.6}em`,
            padding: '10px 12px',
            fontSize: 13, lineHeight: 1.6,
            color: txtCol, background: editBg,
            outline: 'none', fontFamily: 'inherit',
            wordBreak: 'break-word',
          }}
        />
      </div>
    </div>
  )
}

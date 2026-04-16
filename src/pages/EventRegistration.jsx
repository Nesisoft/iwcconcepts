import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  decodeFormConfig, getFormById, addSubmission, sendEmailJS, formatDate,
  getTimeLeft, COUNTRY_CODES, uid,
} from '../utils/formStorage'

// ── Countdown component ────────────────────────────────────────────────────
function Countdown({ eventDate, accentColor, accentColor2 }) {
  const [left, setLeft] = useState(getTimeLeft(eventDate))
  useEffect(() => {
    const id = setInterval(() => setLeft(getTimeLeft(eventDate)), 1000)
    return () => clearInterval(id)
  }, [eventDate])

  if (!left) return null

  const blocks = [
    { v: left.days,    l: 'Days' },
    { v: left.hours,   l: 'Hours' },
    { v: left.minutes, l: 'Mins' },
    { v: left.seconds, l: 'Secs' },
  ]

  if (left.past) {
    return (
      <div style={{ textAlign: 'center', padding: '12px 0', color: accentColor, fontWeight: 800, fontSize: 14 }}>
        🎉 This event is live / has taken place
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', margin: '18px 0' }}>
      {blocks.map(({ v, l }) => (
        <div key={l} style={{ textAlign: 'center', minWidth: 64 }}>
          <div style={{
            background: `linear-gradient(135deg, ${accentColor}22, ${accentColor2}22)`,
            border: `1px solid ${accentColor}55`, borderRadius: 12,
            padding: '12px 10px', minWidth: 60,
          }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: accentColor, lineHeight: 1 }}>
              {String(v).padStart(2, '0')}
            </div>
          </div>
          <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 5 }}>{l}</div>
        </div>
      ))}
    </div>
  )
}

// ── Star rating component ──────────────────────────────────────────────────
function StarRating({ value, onChange, accent }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} onClick={() => onChange(s)} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
          style={{ fontSize: 34, cursor: 'pointer', color: (hover || value) >= s ? accent : 'rgba(255,255,255,0.2)', transition: 'color 0.12s, transform 0.1s', transform: (hover || value) >= s ? 'scale(1.12)' : 'scale(1)', display: 'inline-block' }}>
          ★
        </span>
      ))}
    </div>
  )
}

// ── Rating Matrix ──────────────────────────────────────────────────────────
function RatingMatrixField({ field, value, onChange, accent }) {
  const scale = Array.from({ length: field.scaleMax || 5 }, (_, i) => i + 1)
  const current = value || {}
  return (
    <div style={{ overflowX: 'auto' }}>
      {/* Header row */}
      <div style={{ display: 'grid', gridTemplateColumns: `1fr repeat(${scale.length}, 44px)`, gap: 4, marginBottom: 6, alignItems: 'center' }}>
        <div />
        {scale.map(s => (
          <div key={s} style={{ textAlign: 'center', fontSize: 11, fontWeight: 800, color: accent }}>{s}</div>
        ))}
      </div>
      {/* Item rows */}
      {(field.items || []).map(item => (
        <div key={item} style={{ display: 'grid', gridTemplateColumns: `1fr repeat(${scale.length}, 44px)`, gap: 4, alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', paddingRight: 8, lineHeight: 1.4 }}>{item}</div>
          {scale.map(s => {
            const selected = current[item] === s
            return (
              <div key={s} style={{ display: 'flex', justifyContent: 'center' }}>
                <div onClick={() => onChange({ ...current, [item]: s })} style={{
                  width: 22, height: 22, borderRadius: '50%',
                  border: `2px solid ${selected ? accent : 'rgba(255,255,255,0.25)'}`,
                  background: selected ? accent : 'transparent',
                  cursor: 'pointer', transition: 'all 0.15s',
                }} />
              </div>
            )
          })}
        </div>
      ))}
      {field.scaleLabel && (
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>{field.scaleLabel}</div>
      )}
    </div>
  )
}

// ── Ranking ────────────────────────────────────────────────────────────────
function RankingField({ field, value, onChange }) {
  const items = value || field.items || []

  useEffect(() => {
    if (!value) onChange([...(field.items || [])])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [draggingIdx, setDraggingIdx] = useState(null)

  function handleDragOver(e, i) {
    e.preventDefault()
    if (draggingIdx === null || draggingIdx === i) return
    const next = [...items]
    const [moved] = next.splice(draggingIdx, 1)
    next.splice(i, 0, moved)
    onChange(next)
    setDraggingIdx(i)
  }

  return (
    <div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
        Drag items to set your order — 1 = highest priority
      </div>
      {items.map((item, i) => (
        <div
          key={item}
          draggable
          onDragStart={() => setDraggingIdx(i)}
          onDragOver={e => handleDragOver(e, i)}
          onDragEnd={() => setDraggingIdx(null)}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: draggingIdx === i ? 'rgba(139,92,246,0.18)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${draggingIdx === i ? '#8B5CF6' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 8, padding: '10px 14px', marginBottom: 6,
            cursor: 'grab', userSelect: 'none', transition: 'background 0.15s, border-color 0.15s',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 900, color: '#8B5CF6', minWidth: 22, textAlign: 'center' }}>{i + 1}</div>
          <div style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>{item}</div>
          <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.25)', letterSpacing: 2 }}>⠿</div>
        </div>
      ))}
    </div>
  )
}

// ── Scale / NPS ────────────────────────────────────────────────────────────
function ScaleField({ field, value, onChange, accent }) {
  const min = field.scaleMin ?? 1
  const max = field.scaleMax ?? 10
  const nums = Array.from({ length: max - min + 1 }, (_, i) => i + min)
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {nums.map(n => {
          const sel = value === n
          return (
            <div key={n} onClick={() => onChange(n)} style={{
              width: 40, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 800, cursor: 'pointer',
              background: sel ? accent : 'rgba(255,255,255,0.06)',
              border: `2px solid ${sel ? accent : 'rgba(255,255,255,0.18)'}`,
              color: sel ? '#fff' : 'rgba(255,255,255,0.7)',
              transition: 'all 0.15s',
            }}>{n}</div>
          )
        })}
      </div>
      {(field.scaleLabelMin || field.scaleLabelMax) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
          <span>{field.scaleLabelMin && `${min} = ${field.scaleLabelMin}`}</span>
          <span>{field.scaleLabelMax && `${max} = ${field.scaleLabelMax}`}</span>
        </div>
      )}
    </div>
  )
}

// ── WhatsApp field ─────────────────────────────────────────────────────────
function WhatsAppField({ field, value, onChange, accent }) {
  const selected = value?.code || field.defaultCountryCode || '+233'
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <select
        value={selected}
        onChange={e => onChange({ ...value, code: e.target.value })}
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: 'white', fontSize: 12, padding: '10px 8px', minWidth: 100, cursor: 'pointer' }}
      >
        {COUNTRY_CODES.map(cc => (
          <option key={cc.code + cc.name} value={cc.code} style={{ background: '#1a0a2e' }}>
            {cc.flag} {cc.code} {cc.name}
          </option>
        ))}
      </select>
      <input
        type="tel"
        placeholder={field.placeholder || 'Phone number'}
        value={value?.number || ''}
        onChange={e => onChange({ ...value, number: e.target.value })}
        style={{ flex: 1, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: 'white', fontSize: 12, padding: '10px 12px' }}
      />
    </div>
  )
}

// ── Single field renderer ──────────────────────────────────────────────────
function FormField({ field, value, onChange, accent, errors }) {
  const err = errors?.[field.id]
  const baseInput = {
    background: 'rgba(255,255,255,0.08)', border: `1px solid ${err ? 'rgba(239,68,68,0.7)' : 'rgba(255,255,255,0.15)'}`,
    borderRadius: 8, color: 'white', fontSize: 13, padding: '11px 14px', width: '100%',
    outline: 'none', fontFamily: "'Montserrat',sans-serif", boxSizing: 'border-box',
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: 7 }}>
        {field.label}
        {field.required && <span style={{ color: accent, marginLeft: 3 }}>*</span>}
      </label>

      {(field.type === 'full_name' || field.type === 'text') && (
        <input type="text" style={baseInput} placeholder={field.placeholder} value={value || ''} onChange={e => onChange(e.target.value)} />
      )}

      {field.type === 'email' && (
        <input type="email" style={baseInput} placeholder={field.placeholder} value={value || ''} onChange={e => onChange(e.target.value)} />
      )}

      {field.type === 'textarea' && (
        <textarea style={{ ...baseInput, resize: 'vertical', lineHeight: 1.6, minHeight: 90 }} placeholder={field.placeholder} value={value || ''} onChange={e => onChange(e.target.value)} rows={4} />
      )}

      {field.type === 'whatsapp' && (
        <WhatsAppField field={field} value={value} onChange={onChange} accent={accent} />
      )}

      {field.type === 'radio' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(field.options || []).map(opt => (
            <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%', border: `2px solid ${value === opt ? accent : 'rgba(255,255,255,0.3)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'border-color 0.15s',
              }}>
                {value === opt && <div style={{ width: 9, height: 9, borderRadius: '50%', background: accent }} />}
              </div>
              <span style={{ fontSize: 12, color: value === opt ? 'white' : 'rgba(255,255,255,0.7)' }} onClick={() => onChange(opt)}>{opt}</span>
            </label>
          ))}
        </div>
      )}

      {field.type === 'checkbox' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(field.options || []).map(opt => {
            const checked = Array.isArray(value) && value.includes(opt)
            return (
              <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 4, border: `2px solid ${checked ? accent : 'rgba(255,255,255,0.3)'}`,
                  background: checked ? accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'all 0.15s',
                }} onClick={() => {
                  const arr = Array.isArray(value) ? [...value] : []
                  onChange(checked ? arr.filter(x => x !== opt) : [...arr, opt])
                }}>
                  {checked && <span style={{ color: 'white', fontSize: 11, fontWeight: 900 }}>✓</span>}
                </div>
                <span style={{ fontSize: 12, color: checked ? 'white' : 'rgba(255,255,255,0.7)' }}>{opt}</span>
              </label>
            )
          })}
        </div>
      )}

      {field.type === 'rating' && (
        <StarRating value={value || 0} onChange={onChange} accent={accent} />
      )}

      {field.type === 'rating_matrix' && (
        <RatingMatrixField field={field} value={value} onChange={onChange} accent={accent} />
      )}

      {field.type === 'ranking' && (
        <RankingField field={field} value={value} onChange={onChange} />
      )}

      {field.type === 'scale' && (
        <ScaleField field={field} value={value} onChange={onChange} accent={accent} />
      )}

      {field.type === 'picture' && (
        <div>
          <label style={{ display: 'block', cursor: 'pointer' }}>
            <div style={{
              border: `2px dashed ${err ? 'rgba(239,68,68,0.7)' : 'rgba(255,255,255,0.2)'}`,
              borderRadius: 10, padding: '20px', textAlign: 'center',
              background: 'rgba(255,255,255,0.03)', transition: 'border-color 0.2s',
            }}>
              {value?.preview ? (
                <img src={value.preview} style={{ maxHeight: 180, maxWidth: '100%', borderRadius: 8, objectFit: 'contain' }} alt="Preview" />
              ) : (
                <>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>🖼️</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Click to upload photo</div>
                  {field.placeholder && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{field.placeholder}</div>}
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>Max {field.maxSizeMB || 5}MB</div>
                </>
              )}
            </div>
            <input
              type="file"
              accept={field.accept || 'image/*'}
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files[0]
                if (!file) return
                const maxBytes = (field.maxSizeMB || 5) * 1024 * 1024
                if (file.size > maxBytes) {
                  alert(`File too large. Maximum size is ${field.maxSizeMB || 5}MB.`)
                  e.target.value = ''
                  return
                }
                const reader = new FileReader()
                reader.onload = ev => onChange({ name: file.name, type: file.type, size: file.size, preview: ev.target.result })
                reader.readAsDataURL(file)
              }}
            />
          </label>
          {value?.name && (
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📎 {value.name} ({Math.round(value.size / 1024)}KB)</span>
              <button onClick={() => onChange(null)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 10, fontWeight: 700 }}>Remove</button>
            </div>
          )}
        </div>
      )}

      {err && <div style={{ fontSize: 10, color: '#f87171', marginTop: 5 }}>⚠ {err}</div>}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function EventRegistration() {
  const [searchParams] = useSearchParams()
  const [formConfig, setFormConfig] = useState(null)
  const [formData, setFormData] = useState({})
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const formRef = useRef(null)

  // Determine if this is feedback or registration
  const isFeedback = window.location.hash.includes('/feedback')

  const demoConfig = {
    id: 'demo',
    type: isFeedback ? 'feedback' : 'registration',
    title: isFeedback ? 'Event Feedback' : 'Event Registration',
    description: isFeedback ? 'We would love to hear your thoughts on this event!' : 'Register to secure your spot for this exciting event.',
    eventDate: '', brandName: 'IWC Concepts', accentColor: '#E4600A', accentColor2: '#F5B800',
    fields: [], speakers: [], emailConfig: { enabled: false }, eventImage: null,
  }

  useEffect(() => {
    const encoded = searchParams.get('d')
    const formId = searchParams.get('id')

    if (formId) {
      // Load from DB first — gets full form including eventImage
      getFormById(formId).then(config => {
        if (config) { setFormConfig(config); return }
        // Not in DB — fall back to encoded URL params
        if (encoded) {
          const cfg = decodeFormConfig(encoded)
          if (cfg) { setFormConfig(cfg); return }
        }
        setFormConfig(demoConfig)
      })
      return
    }
    // No ?id= — try encoded only (old-style links or no Supabase)
    if (encoded) {
      const config = decodeFormConfig(encoded)
      if (config) { setFormConfig(config); return }
    }
    setFormConfig(demoConfig)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  function validate() {
    const errs = {}
    formConfig.fields.forEach(f => {
      if (f.type === 'section') return
      const v = formData[f.id]
      if (f.required) {
        if (!v || (Array.isArray(v) && v.length === 0)) errs[f.id] = 'This field is required'
        if (f.type === 'whatsapp' && (!v?.number || v.number.trim() === '')) errs[f.id] = 'Please enter your WhatsApp number'
        if (f.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) errs[f.id] = 'Please enter a valid email address'
        if (f.type === 'picture' && !v?.preview) errs[f.id] = 'Please upload a photo'
        if (f.type === 'rating_matrix') {
          const rated = Object.keys(v || {}).length
          if (rated < (f.items || []).length) errs[f.id] = 'Please rate all items'
        }
      }
    })
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      formRef.current?.querySelector('[data-error]')?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    setErrors({})
    setSubmitting(true)
    setSubmitError('')

    try {
      // Store in IndexedDB
      if (formConfig.id !== 'demo') await addSubmission(formConfig.id, formData)

      // Build human-readable summary for email
      const summary = formConfig.fields
        .filter(f => f.type !== 'section')
        .map(f => {
          const v = formData[f.id]
          let display = ''
          if (f.type === 'whatsapp') display = `${v?.code || ''} ${v?.number || ''}`
          else if (f.type === 'rating_matrix') display = Object.entries(v || {}).map(([k, r]) => `${k}: ${r}`).join('; ')
          else if (f.type === 'ranking') display = (Array.isArray(v) ? v : []).map((item, i) => `${i + 1}. ${item}`).join(', ')
          else if (f.type === 'scale') display = v != null ? String(v) : '(not answered)'
          else if (Array.isArray(v)) display = v.join(', ')
          else display = v || '(not answered)'
          return `${f.label}: ${display}`
        }).join('\n')

      // Get participant name & email for email vars
      const nameFld = formConfig.fields.find(f => f.type === 'full_name' || f.label?.toLowerCase().includes('name'))
      const emailFld = formConfig.fields.find(f => f.type === 'email')
      const participantName = nameFld ? (formData[nameFld.id] || '') : ''
      const participantEmail = emailFld ? (formData[emailFld.id] || '') : ''

      const cfg = formConfig.emailConfig
      if (cfg?.enabled && cfg.serviceId && cfg.publicKey) {
        // Confirmation to participant
        if (cfg.confirmTemplateId && participantEmail) {
          await sendEmailJS(cfg.serviceId, cfg.confirmTemplateId, {
            to_name: participantName,
            to_email: participantEmail,
            event_title: formConfig.title,
            event_date: formatDate(formConfig.eventDate),
            brand_name: formConfig.brandName,
            confirmation_message: cfg.confirmationMessage || 'You are registered!',
          }, cfg.publicKey)
        }
        // Notification to admin
        if (cfg.notifyTemplateId && cfg.adminEmail) {
          await sendEmailJS(cfg.serviceId, cfg.notifyTemplateId, {
            to_email: cfg.adminEmail,
            event_title: formConfig.title,
            participant_name: participantName,
            participant_email: participantEmail,
            submission_data: summary,
            timestamp: new Date().toLocaleString(),
          }, cfg.publicKey)
        }
      }

      setSubmitted(true)
    } catch (err) {
      setSubmitError('Something went wrong. Please try again.')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  if (!formConfig) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0614', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: "'Montserrat',sans-serif" }}>
        <div>Loading form...</div>
      </div>
    )
  }

  const { accentColor: acc, accentColor2: acc2, title, description, eventDate, brandName, fields, speakers, emailConfig } = formConfig
  // eventImage accessed directly from formConfig below

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0a0614,#1a0a2e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Montserrat',sans-serif", padding: 20 }}>
        <div style={{ textAlign: 'center', maxWidth: 440 }}>
          <div style={{ fontSize: 72, marginBottom: 18 }}>{isFeedback ? '🙏' : '🎉'}</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: 'white', marginBottom: 12 }}>
            {isFeedback ? 'Thank You!' : "You're Registered!"}
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 24 }}>
            {emailConfig?.confirmationMessage || (isFeedback ? 'Your feedback has been received. We truly appreciate your time.' : `We look forward to seeing you at ${title}!`)}
          </div>
          {!isFeedback && eventDate && (
            <div style={{ background: `${acc}22`, border: `1px solid ${acc}55`, borderRadius: 12, padding: '14px 20px', marginBottom: 24, color: 'white', fontSize: 12 }}>
              📅 {formatDate(eventDate)}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {!isFeedback && eventDate && (
              <a href={`data:text/calendar;charset=utf8,BEGIN:VCALENDAR%0AVERSION:2.0%0ABEGIN:VEVENT%0ADTSTART:${eventDate.replace(/[-:]/g, '').replace('T', 'T')}00Z%0ASUMMARY:${encodeURIComponent(title)}%0AEND:VEVENT%0AEND:VCALENDAR`} download="event.ics" style={{ background: `linear-gradient(135deg,${acc},${acc2})`, color: 'white', borderRadius: 10, padding: '11px 22px', textDecoration: 'none', fontWeight: 700, fontSize: 12 }}>
                📅 Add to Calendar
              </a>
            )}
            <button onClick={() => window.location.reload()} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: 10, padding: '11px 22px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
              ← Back to Form
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#08040f 0%,#130826 50%,#0a0614 100%)', fontFamily: "'Montserrat',sans-serif", color: 'white' }}>
      {/* Brand header */}
      <div style={{ background: `linear-gradient(135deg, ${acc}18, ${acc2}10)`, borderBottom: `3px solid ${acc}`, padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, background: `linear-gradient(135deg,${acc},${acc2})`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
            {isFeedback ? '⭐' : '📝'}
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 15 }}>{title}</div>
            <div style={{ fontSize: 9, color: acc, letterSpacing: 2, textTransform: 'uppercase' }}>{brandName}</div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
          {isFeedback ? 'Share your experience' : 'Secure your spot'}
        </div>
      </div>

      <div style={{ maxWidth: 620, margin: '0 auto', padding: '28px 20px 60px' }}>
        {/* Event Image */}
        {formConfig.eventImage && (
          <div style={{ marginBottom: 22, borderRadius: 14, overflow: 'hidden', border: `1px solid ${acc}30`, boxShadow: `0 8px 30px rgba(0,0,0,0.4)` }}>
            <img src={formConfig.eventImage} alt="Event" style={{ width: '100%', display: 'block', maxHeight: 340, objectFit: 'cover' }} />
          </div>
        )}
        {/* Countdown */}
        {!isFeedback && eventDate && <Countdown eventDate={eventDate} accentColor={acc} accentColor2={acc2} />}

        {/* Event description */}
        {description && (
          <div style={{ background: `${acc}12`, border: `1px solid ${acc}30`, borderRadius: 12, padding: '14px 18px', marginBottom: 24, fontSize: 13, lineHeight: 1.7, color: 'rgba(255,255,255,0.8)' }}>
            {description}
          </div>
        )}

        {/* Date/time */}
        {eventDate && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 20, fontWeight: 600 }}>
            <span style={{ color: acc }}>📅</span> {formatDate(eventDate)}
          </div>
        )}

        {/* Speakers preview */}
        {speakers?.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 2.5, color: acc, textTransform: 'uppercase', marginBottom: 12 }}>Speakers & Guests</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {speakers.filter(s => s.name).map((sp, i) => (
                <div key={i} style={{ background: `${acc}15`, border: `1px solid ${acc}35`, borderRadius: 10, padding: '10px 14px', minWidth: 120 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg,${acc},${acc2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginBottom: 7 }}>👤</div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{sp.name}</div>
                  {sp.title && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{sp.title}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '28px 24px' }}>
          <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 6 }}>{isFeedback ? '⭐ Share Your Review' : '📝 Registration Form'}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 24 }}>
            {isFeedback ? 'Your feedback helps us improve every event.' : 'All fields marked * are required.'}
          </div>

          <form ref={formRef} onSubmit={handleSubmit}>
            {fields.map(f => {
              if (f.type === 'section') {
                return (
                  <div key={f.id} style={{ marginTop: 28, marginBottom: 20 }}>
                    <div style={{ height: 1, background: `linear-gradient(90deg, ${acc}70, transparent)`, marginBottom: 14 }} />
                    <div style={{ fontSize: 13, fontWeight: 900, color: acc, letterSpacing: 0.3, marginBottom: f.description ? 6 : 0 }}>
                      {f.label}
                    </div>
                    {f.description && (
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, marginTop: 4 }}>
                        {f.description}
                      </div>
                    )}
                  </div>
                )
              }
              return (
                <FormField
                  key={f.id}
                  field={f}
                  value={formData[f.id]}
                  onChange={v => setFormData(p => ({ ...p, [f.id]: v }))}
                  accent={acc}
                  errors={errors}
                />
              )
            })}

            {fields.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                This form has no fields configured yet.
              </div>
            )}

            {submitError && (
              <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#f87171', marginBottom: 16 }}>⚠ {submitError}</div>
            )}

            {fields.length > 0 && (
              <button type="submit" disabled={submitting} style={{
                width: '100%', background: submitting ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg,${acc},${acc2})`,
                border: 'none', borderRadius: 12, color: submitting ? 'rgba(255,255,255,0.5)' : '#1a0a00',
                fontSize: 14, fontWeight: 900, padding: '14px', cursor: submitting ? 'not-allowed' : 'pointer',
                marginTop: 8, letterSpacing: 0.5,
              }}>
                {submitting ? '⏳ Submitting...' : (isFeedback ? '⭐ Submit Feedback' : '🎉 Complete Registration')}
              </button>
            )}
          </form>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 28, fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
          Powered by <strong style={{ color: acc }}>IWC Concepts</strong> · Your registration is secure
        </div>
      </div>
    </div>
  )
}

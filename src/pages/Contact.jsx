import { useState } from 'react'
import SiteNav from '../components/SiteNav'
import SiteFooter from '../components/SiteFooter'
import { Mail, Phone, MapPin, MessageCircle, Send, CheckCircle2 } from 'lucide-react'

const BRAND  = '#6c3fc5'
const BRAND2 = '#9333ea'
const GOLD   = '#C9A84C'

// Edit these to your real details.
const CONTACT_EMAIL = 'hello@iwcconcepts.com'
const CONTACT_PHONE = '+233 00 000 0000'
const WHATSAPP_NUMBER = '233000000000' // digits only, with country code
const LOCATION = 'Accra, Ghana'

const INFO = [
  { icon: Mail,          title: 'Email Us',    value: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
  { icon: Phone,         title: 'Call Us',     value: CONTACT_PHONE, href: `tel:${CONTACT_PHONE.replace(/\s/g, '')}` },
  { icon: MessageCircle, title: 'WhatsApp',    value: 'Chat with us', href: `https://wa.me/${WHATSAPP_NUMBER}` },
  { icon: MapPin,        title: 'Location',    value: LOCATION, href: null },
]

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)

  const valid = form.name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) && form.message.trim()

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function handleSubmit(e) {
    e.preventDefault()
    if (!valid) return
    const subject = encodeURIComponent(form.subject || `Message from ${form.name}`)
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`
    )
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`
    setSent(true)
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', minHeight: '100vh', background: '#fff' }}>
      <SiteNav solid />

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #0f0a1a 0%, #1e0f3a 60%, #0f0a1a 100%)',
        padding: '140px 24px 72px', textAlign: 'center', color: 'white',
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>
          Contact Us
        </div>
        <h1 style={{ fontSize: 'clamp(30px, 5vw, 50px)', fontWeight: 900, margin: '0 auto 16px', lineHeight: 1.15, maxWidth: 700 }}>
          We'd Love to Hear From You
        </h1>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
          Have a question about our courses or events? Reach out — our team is here to help.
        </p>
      </section>

      {/* Info + Form */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '64px 24px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18, marginBottom: 56 }}>
          {INFO.map(({ icon: Icon, title, value, href }) => {
            const inner = (
              <>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 46, height: 46, borderRadius: 12, background: 'rgba(108,63,197,0.1)', marginBottom: 14 }}>
                  <Icon size={22} color={BRAND} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#111827', marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 14, color: '#6b7280' }}>{value}</div>
              </>
            )
            return href ? (
              <a key={title} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
                 style={{ ...infoCard, textDecoration: 'none', display: 'block' }}>
                {inner}
              </a>
            ) : (
              <div key={title} style={infoCard}>{inner}</div>
            )
          })}
        </div>

        {/* Form */}
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 30px)', fontWeight: 900, color: '#111827', margin: '0 0 8px', textAlign: 'center' }}>
            Send Us a Message
          </h2>
          <p style={{ color: '#6b7280', fontSize: 15, textAlign: 'center', margin: '0 0 32px' }}>
            Fill in the form and we'll get back to you as soon as we can.
          </p>

          {sent ? (
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 16, padding: '32px 28px', textAlign: 'center' }}>
              <CheckCircle2 size={44} color="#16a34a" style={{ marginBottom: 12 }} />
              <h3 style={{ fontSize: 19, fontWeight: 800, color: '#166534', margin: '0 0 8px' }}>Your message is ready to send</h3>
              <p style={{ color: '#15803d', fontSize: 14, margin: 0, lineHeight: 1.7 }}>
                Your email app should have opened with your message. If it didn't, email us directly at{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: '#166534', fontWeight: 700 }}>{CONTACT_EMAIL}</a>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <Field label="Your Name *">
                  <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Jane Doe" />
                </Field>
                <Field label="Email Address *">
                  <input type="email" style={inputStyle} value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" />
                </Field>
              </div>
              <Field label="Subject">
                <input style={inputStyle} value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="How can we help?" />
              </Field>
              <Field label="Message *">
                <textarea style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} rows={5} value={form.message} onChange={e => set('message', e.target.value)} placeholder="Write your message here…" />
              </Field>
              <button type="submit" disabled={!valid} style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                border: 'none', borderRadius: 10, padding: '14px 0', fontWeight: 800, fontSize: 15,
                cursor: valid ? 'pointer' : 'not-allowed',
                background: valid ? `linear-gradient(135deg, ${BRAND}, ${BRAND2})` : '#e5e7eb',
                color: valid ? '#fff' : '#9ca3af',
                boxShadow: valid ? '0 4px 20px rgba(108,63,197,0.35)' : 'none',
                marginTop: 4,
              }}>
                <Send size={17} /> Send Message
              </button>
            </form>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 7 }}>{label}</label>
      {children}
    </div>
  )
}

const infoCard = {
  background: '#fff', border: '1px solid #f3f4f6', borderRadius: 16,
  padding: '24px 22px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
}

const inputStyle = {
  width: '100%', border: '2px solid #e5e7eb', borderRadius: 12,
  padding: '13px 16px', fontSize: 15, color: '#111827',
  boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit',
}

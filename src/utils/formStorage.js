// ── Unique ID generator ────────────────────────────────────────────────────
export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

// ── Storage keys ───────────────────────────────────────────────────────────
const KEYS = {
  FORMS: 'iwc_forms_v1',
  SUBMISSIONS: 'iwc_subs_v1',
  SPEAKERS: 'iwc_speakers_v1',
  TASKS: 'iwc_tasks_v1',
}

// ── URL encode / decode form config (for shareable links) ──────────────────
export function encodeFormConfig(config) {
  try { return btoa(encodeURIComponent(JSON.stringify(config))) }
  catch { return null }
}
export function decodeFormConfig(encoded) {
  try { return JSON.parse(decodeURIComponent(atob(encoded))) }
  catch { return null }
}

// ── Country codes for WhatsApp ─────────────────────────────────────────────
export const COUNTRY_CODES = [
  { code: '+233', flag: '🇬🇭', name: 'Ghana' },
  { code: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+1',   flag: '🇺🇸', name: 'USA / Canada' },
  { code: '+44',  flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+353', flag: '🇮🇪', name: 'Ireland' },
  { code: '+27',  flag: '🇿🇦', name: 'South Africa' },
  { code: '+254', flag: '🇰🇪', name: 'Kenya' },
  { code: '+255', flag: '🇹🇿', name: 'Tanzania' },
  { code: '+256', flag: '🇺🇬', name: 'Uganda' },
  { code: '+263', flag: '🇿🇼', name: 'Zimbabwe' },
  { code: '+49',  flag: '🇩🇪', name: 'Germany' },
  { code: '+31',  flag: '🇳🇱', name: 'Netherlands' },
  { code: '+61',  flag: '🇦🇺', name: 'Australia' },
  { code: '+33',  flag: '🇫🇷', name: 'France' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+91',  flag: '🇮🇳', name: 'India' },
  { code: '+55',  flag: '🇧🇷', name: 'Brazil' },
  { code: '+64',  flag: '🇳🇿', name: 'New Zealand' },
]

// ── Default field templates ────────────────────────────────────────────────
export const DEFAULT_REGISTRATION_FIELDS = [
  { id: 'f_name',       type: 'full_name', label: 'Full Name',               placeholder: 'Enter your full name',   required: true },
  { id: 'f_email',      type: 'email',     label: 'Email Address',           placeholder: 'your@email.com',         required: true },
  { id: 'f_whatsapp',   type: 'whatsapp',  label: 'WhatsApp Number',         placeholder: 'Enter phone number',     required: true,  defaultCountryCode: '+233' },
  { id: 'f_gender',     type: 'radio',     label: 'Gender',                  required: true,  options: ['Female', 'Male', 'Prefer not to say'] },
  { id: 'f_occupation', type: 'text',      label: 'Occupation / Profession', placeholder: 'What do you do?',        required: true },
  { id: 'f_how',        type: 'radio',     label: 'How did you hear about us?', required: false, options: ['Instagram', 'Facebook', 'Friend / Referral', 'Newsletter', 'Other'] },
]

export const DEFAULT_FEEDBACK_FIELDS = [
  { id: 'f_name',       type: 'full_name', label: 'Full Name',                     placeholder: 'Your name (optional)',   required: false },
  { id: 'f_email',      type: 'email',     label: 'Email Address',                 placeholder: 'your@email.com',         required: false },
  { id: 'f_rating',     type: 'rating',    label: 'Overall Rating',                required: true },
  { id: 'f_enjoyed',    type: 'textarea',  label: 'What did you enjoy most?',      placeholder: 'Share your highlights...', required: true },
  { id: 'f_recommend',  type: 'radio',     label: 'Would you recommend this event?', required: true, options: ['Yes, definitely!', 'Probably yes', 'Not sure', 'Probably not'] },
  { id: 'f_improve',    type: 'textarea',  label: 'What can we improve?',          placeholder: 'Your honest feedback helps us grow...', required: false },
  { id: 'f_testimonial',type: 'textarea',  label: 'Testimonial (will be shared)',  placeholder: 'Write a short testimonial we can feature...', required: false },
]

// ── Forms CRUD ─────────────────────────────────────────────────────────────
function readForms() {
  try { return JSON.parse(localStorage.getItem(KEYS.FORMS) || '[]') }
  catch { return [] }
}
function writeForms(forms) { localStorage.setItem(KEYS.FORMS, JSON.stringify(forms)) }

export function getAllForms() { return readForms() }

export function getFormById(id) { return readForms().find(f => f.id === id) || null }

export function saveForm(form) {
  const forms = readForms()
  const idx = forms.findIndex(f => f.id === form.id)
  const now = new Date().toISOString()
  const record = { ...form, updatedAt: now }
  if (idx >= 0) { forms[idx] = record } else { forms.push({ ...record, id: form.id || uid(), createdAt: now }) }
  writeForms(forms)
  return getFormById(form.id)
}

export function deleteForm(id) {
  writeForms(readForms().filter(f => f.id !== id))
  // also delete submissions
  const all = readAllSubs()
  delete all[id]
  localStorage.setItem(KEYS.SUBMISSIONS, JSON.stringify(all))
}

// ── Submissions CRUD ───────────────────────────────────────────────────────
function readAllSubs() {
  try { return JSON.parse(localStorage.getItem(KEYS.SUBMISSIONS) || '{}') }
  catch { return {} }
}

export function getFormSubmissions(formId) { return readAllSubs()[formId] || [] }

export function addSubmission(formId, data) {
  const all = readAllSubs()
  if (!all[formId]) all[formId] = []
  const sub = { id: uid(), formId, timestamp: new Date().toISOString(), data }
  all[formId].push(sub)
  localStorage.setItem(KEYS.SUBMISSIONS, JSON.stringify(all))
  return sub
}

export function deleteSubmission(formId, subId) {
  const all = readAllSubs()
  if (all[formId]) {
    all[formId] = all[formId].filter(s => s.id !== subId)
    localStorage.setItem(KEYS.SUBMISSIONS, JSON.stringify(all))
  }
}

export function exportCSV(formId) {
  const form = getFormById(formId)
  const subs = getFormSubmissions(formId)
  if (!form || !subs.length) return

  const headers = ['#', 'Timestamp', ...form.fields.map(f => f.label)]
  const rows = subs.map((s, i) => [
    i + 1,
    new Date(s.timestamp).toLocaleString(),
    ...form.fields.map(f => {
      const v = s.data[f.id]
      if (f.type === 'whatsapp') return `${v?.code || ''} ${v?.number || ''}`
      if (Array.isArray(v)) return v.join('; ')
      return v || ''
    }),
  ])

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.download = `${(form.title || 'form').replace(/\s+/g, '_')}_${Date.now()}.csv`
  a.href = url; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ── Speakers CRUD ──────────────────────────────────────────────────────────
function readSpeakers() {
  try { return JSON.parse(localStorage.getItem(KEYS.SPEAKERS) || '[]') }
  catch { return [] }
}

export function getAllSpeakers() { return readSpeakers() }
export function getSpeakerById(id) { return readSpeakers().find(s => s.id === id) || null }

export function saveSpeaker(speaker) {
  const all = readSpeakers()
  const idx = all.findIndex(s => s.id === speaker.id)
  const now = new Date().toISOString()
  const record = { ...speaker, updatedAt: now }
  if (idx >= 0) { all[idx] = record } else { all.push({ ...record, id: speaker.id || uid(), createdAt: now }) }
  localStorage.setItem(KEYS.SPEAKERS, JSON.stringify(all))
}

export function deleteSpeaker(id) {
  localStorage.setItem(KEYS.SPEAKERS, JSON.stringify(readSpeakers().filter(s => s.id !== id)))
}

// ── Event Tasks (Checklist) ────────────────────────────────────────────────
const DEFAULT_TASKS = {
  pre: [
    'Confirm meeting link / book venue',
    'Finalise speaker lineup and topics',
    'Design and publish event flyer',
    'Open registration form and share link',
    'Send invitations to mailing list',
    'Prepare interview / discussion questions',
    'Send 48-hour reminder email',
    'Send 1-hour reminder email',
    'Test audio/video setup',
  ],
  during: [
    'Welcome attendees warmly',
    'Introduce each speaker',
    'Manage Q&A and live chat',
    'Record the session',
    'Post live updates on social media',
    'Note attendance count',
  ],
  post: [
    'Send thank-you email to all attendees',
    'Share recording link',
    'Publish feedback form',
    'Update speaker database with new info',
    'Archive registration data (CSV export)',
    'Post event recap / highlights',
    'Plan next event',
  ],
}

export function getEventTasks(formId) {
  try {
    const all = JSON.parse(localStorage.getItem(KEYS.TASKS) || '{}')
    if (all[formId]) return all[formId]
    const tasks = {
      pre:    DEFAULT_TASKS.pre.map((t, i) => ({ id: `p${i}`, text: t, done: false })),
      during: DEFAULT_TASKS.during.map((t, i) => ({ id: `d${i}`, text: t, done: false })),
      post:   DEFAULT_TASKS.post.map((t, i) => ({ id: `q${i}`, text: t, done: false })),
    }
    all[formId] = tasks
    localStorage.setItem(KEYS.TASKS, JSON.stringify(all))
    return tasks
  } catch { return { pre: [], during: [], post: [] } }
}

export function saveEventTasks(formId, tasks) {
  const all = JSON.parse(localStorage.getItem(KEYS.TASKS) || '{}')
  all[formId] = tasks
  localStorage.setItem(KEYS.TASKS, JSON.stringify(all))
}

// ── Email sending via EmailJS ──────────────────────────────────────────────
export async function sendEmailJS(serviceId, templateId, vars, publicKey) {
  if (!serviceId || !templateId || !publicKey) return false
  try {
    const emailjs = await import('@emailjs/browser')
    await emailjs.default.send(serviceId, templateId, vars, { publicKey })
    return true
  } catch (e) {
    console.warn('[EmailJS] send failed:', e)
    return false
  }
}

// ── Countdown helper ───────────────────────────────────────────────────────
export function getTimeLeft(targetDateStr) {
  if (!targetDateStr) return null
  const diff = new Date(targetDateStr) - new Date()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, past: true }
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    past: false,
  }
}

// ── Format date ────────────────────────────────────────────────────────────
export function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return dateStr }
}

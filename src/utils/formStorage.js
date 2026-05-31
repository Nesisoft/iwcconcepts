/**
 * formStorage.js — data access layer
 *
 * All data calls go through the Express backend at /api/db.
 * In dev  : Vite proxies /api → http://localhost:3001  (vite.config.js)
 * In prod : Express serves both this app and the API from the same origin
 *
 * No Supabase credentials or database details live in the browser.
 * Only Supabase Auth (login / session) still calls supabase.co — that's expected.
 */

import { getSupabase } from './supabase'

// ── Unique ID generator ────────────────────────────────────────────────────────
// Matches the server-side uid() — both generate the same format.
export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

// ── URL encode / decode form config (for shareable links) ─────────────────────
export function encodeFormConfig(config) {
  try { return btoa(encodeURIComponent(JSON.stringify(config))) }
  catch { return null }
}
export function decodeFormConfig(encoded) {
  try { return JSON.parse(decodeURIComponent(atob(encoded))) }
  catch { return null }
}

// ── Country codes for WhatsApp ─────────────────────────────────────────────────
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

// ── Default field templates ────────────────────────────────────────────────────
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

// ── Internal: API call helper ──────────────────────────────────────────────────
async function api(action, payload = {}, token = null) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch('/api/db', {
    method:  'POST',
    headers,
    body:    JSON.stringify({ action, payload }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(body.error || `[${action}] HTTP ${res.status}`)
  }
  return res.json()
}

// ── Internal: get the logged-in admin's JWT ────────────────────────────────────
async function adminToken() {
  const sb = getSupabase()
  if (!sb) return null
  const { data: { session } } = await sb.auth.getSession()
  return session?.access_token ?? null
}

// ═══════════════════════════════════════════════════════════════════════════════
// Forms CRUD
// ═══════════════════════════════════════════════════════════════════════════════

export const getAllForms  = ()   => api('getAllForms')
export const getFormById  = (id) => api('getFormById', { id })

export async function saveForm(form) {
  const now    = new Date().toISOString()
  const record = { ...form, updatedAt: now }
  if (!record.id)        record.id        = uid()
  if (!record.createdAt) record.createdAt = now
  return api('saveForm', { form: record }, await adminToken())
}

export async function deleteForm(id) {
  return api('deleteForm', { id }, await adminToken())
}

// ═══════════════════════════════════════════════════════════════════════════════
// Submissions CRUD
// ═══════════════════════════════════════════════════════════════════════════════

export async function getFormSubmissions(formId) {
  return api('getFormSubmissions', { formId }, await adminToken())
}

export async function addSubmission(formId, data) {
  // ID and timestamp are generated client-side (consistent with old behaviour)
  const sub = { id: uid(), formId, timestamp: new Date().toISOString(), data }
  return api('addSubmission', { sub })
}

export async function deleteSubmission(_formId, subId) {
  return api('deleteSubmission', { id: subId }, await adminToken())
}

export async function exportCSV(formId) {
  const form = await getFormById(formId)
  const subs = await getFormSubmissions(formId)
  if (!form || !subs.length) return

  const headers = ['#', 'Timestamp', ...form.fields.map(f => f.label)]
  const rows = subs.map((s, i) => [
    i + 1,
    new Date(s.timestamp).toLocaleString(),
    ...form.fields.map(f => {
      const v = s.data[f.id]
      if (f.type === 'whatsapp') return `${v?.code || ''} ${v?.number || ''}`
      if (f.type === 'picture')  return v?.name ? `[Photo: ${v.name}]` : ''
      if (Array.isArray(v))      return v.join('; ')
      return v || ''
    }),
  ])

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.download = `${(form.title || 'form').replace(/\s+/g, '_')}_${Date.now()}.csv`
  a.href = url; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ═══════════════════════════════════════════════════════════════════════════════
// Speakers CRUD  (admin-only: matches original RLS policy)
// ═══════════════════════════════════════════════════════════════════════════════

export async function getAllSpeakers() {
  return api('getAllSpeakers', {}, await adminToken())
}

export async function getSpeakerById(id) {
  return api('getSpeakerById', { id }, await adminToken())
}

export async function saveSpeaker(speaker) {
  const now    = new Date().toISOString()
  const record = { ...speaker, updatedAt: now }
  if (!record.id)        record.id        = uid()
  if (!record.createdAt) record.createdAt = now
  return api('saveSpeaker', { speaker: record }, await adminToken())
}

export async function deleteSpeaker(id) {
  return api('deleteSpeaker', { id }, await adminToken())
}

// ═══════════════════════════════════════════════════════════════════════════════
// Event Tasks / Checklist
// ═══════════════════════════════════════════════════════════════════════════════

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

export async function getEventTasks(formId) {
  const token = await adminToken()
  const tasks = await api('getEventTasks', { formId }, token)
  if (tasks) return tasks
  // First time — server returned null, so create and persist defaults
  const defaults = {
    pre:    DEFAULT_TASKS.pre.map((t, i)    => ({ id: `p${i}`, text: t, done: false })),
    during: DEFAULT_TASKS.during.map((t, i) => ({ id: `d${i}`, text: t, done: false })),
    post:   DEFAULT_TASKS.post.map((t, i)   => ({ id: `q${i}`, text: t, done: false })),
  }
  await api('saveEventTasks', { formId, tasks: defaults }, token)
  return defaults
}

export async function saveEventTasks(formId, tasks) {
  return api('saveEventTasks', { formId, tasks }, await adminToken())
}

// ═══════════════════════════════════════════════════════════════════════════════
// Programs CRUD  (public reads, admin writes)
// ═══════════════════════════════════════════════════════════════════════════════

export const getAllPrograms  = ()   => api('getAllPrograms')
export const getProgramById  = (id) => api('getProgramById', { id })

export async function saveProgram(program) {
  const now    = new Date().toISOString()
  const record = { ...program, updatedAt: now }
  if (!record.id)        record.id        = uid()
  if (!record.createdAt) record.createdAt = now
  return api('saveProgram', { program: record }, await adminToken())
}

export async function deleteProgram(id) {
  return api('deleteProgram', { id }, await adminToken())
}

// ═══════════════════════════════════════════════════════════════════════════════
// Enrollments CRUD  (public inserts, admin reads)
// ═══════════════════════════════════════════════════════════════════════════════

export async function addEnrollment(enrollment) {
  const record = {
    ...enrollment,
    id:         enrollment.id         || uid(),
    enrolledAt: enrollment.enrolledAt || new Date().toISOString(),
  }
  return api('addEnrollment', { enrollment: record })
}

export async function getEnrollmentsByProgram(programId) {
  return api('getEnrollmentsByProgram', { programId }, await adminToken())
}

// ═══════════════════════════════════════════════════════════════════════════════
// Testimonials CRUD  (public reads, admin writes)
// ═══════════════════════════════════════════════════════════════════════════════

export const getAllTestimonials = () => api('getAllTestimonials')

export async function saveTestimonial(testimonial) {
  const now    = new Date().toISOString()
  const record = { ...testimonial, updatedAt: now }
  if (!record.id)        record.id        = uid()
  if (!record.createdAt) record.createdAt = now
  return api('saveTestimonial', { testimonial: record }, await adminToken())
}

export async function deleteTestimonial(id) {
  return api('deleteTestimonial', { id }, await adminToken())
}

// ═══════════════════════════════════════════════════════════════════════════════
// Content Sections CRUD  (admin-only)
// ═══════════════════════════════════════════════════════════════════════════════

export const getContentSections = (programId) =>
  adminToken().then(t => api('getContentSections', { programId }, t))

export async function saveContentSection(section) {
  const now    = new Date().toISOString()
  const record = { ...section, updatedAt: now }
  if (!record.id)        record.id        = uid()
  if (!record.createdAt) record.createdAt = now
  return api('saveContentSection', { section: record }, await adminToken())
}

export async function deleteContentSection(programId, id) {
  return api('deleteContentSection', { programId, id }, await adminToken())
}

// ═══════════════════════════════════════════════════════════════════════════════
// Content Items CRUD  (admin-only)
// ═══════════════════════════════════════════════════════════════════════════════

export const getContentItems = (programId) =>
  adminToken().then(t => api('getContentItems', { programId }, t))

export async function saveContentItem(item) {
  const now    = new Date().toISOString()
  const record = { ...item, updatedAt: now }
  if (!record.id)        record.id        = uid()
  if (!record.createdAt) record.createdAt = now
  return api('saveContentItem', { item: record }, await adminToken())
}

export async function deleteContentItem(id) {
  return api('deleteContentItem', { id }, await adminToken())
}

// ═══════════════════════════════════════════════════════════════════════════════
// Customer portal  (requires a valid customer JWT passed in explicitly)
// ═══════════════════════════════════════════════════════════════════════════════

export const getMyEnrollments = (token) =>
  api('getMyEnrollments', {}, token)

export const getPortalContent = (programId, token) =>
  api('getPortalContent', { programId }, token)

export const getMyProgress = (programId, token) =>
  api('getMyProgress', { programId }, token)

export const markItemComplete = (programId, itemId, token) =>
  api('markItemComplete', { programId, itemId }, token)

export const getEnrolledUsersProgress = () =>
  adminToken().then(t => api('getEnrolledUsersProgress', {}, t))

// ═══════════════════════════════════════════════════════════════════════════════
// Settings  (public reads, admin writes)
// ═══════════════════════════════════════════════════════════════════════════════

export const getSetting = (key) => api('getSetting', { key })

export const saveSetting = (key, value) =>
  adminToken().then(t => api('saveSetting', { key, value }, t))

// ═══════════════════════════════════════════════════════════════════════════════
// Lesson discussion / Q&A
// ═══════════════════════════════════════════════════════════════════════════════

export const getLessonComments = (programId, itemId, token) =>
  api('getLessonComments', { programId, itemId }, token)

export const addLessonComment = (payload, token) =>
  api('addLessonComment', payload, token)

export const deleteLessonComment = (id, token, asAdmin = false) =>
  api('deleteLessonComment', { id, asAdmin }, token)

// Admin Q&A console
export const getAllLessonComments = () =>
  adminToken().then(t => api('getAllLessonComments', {}, t))

export const addAdminLessonComment = (payload) =>
  adminToken().then(t => api('addLessonComment', { ...payload, asAdmin: true }, t))

export const deleteLessonCommentAdmin = (id) =>
  adminToken().then(t => api('deleteLessonComment', { id, asAdmin: true }, t))

// ═══════════════════════════════════════════════════════════════════════════════
// Utility helpers (unchanged — no DB calls)
// ═══════════════════════════════════════════════════════════════════════════════

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

export function getTimeLeft(targetDateStr) {
  if (!targetDateStr) return null
  const diff = new Date(targetDateStr) - new Date()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, past: true }
  return {
    days:    Math.floor(diff / 86400000),
    hours:   Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000)  / 60000),
    seconds: Math.floor((diff % 60000)    / 1000),
    past:    false,
  }
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return dateStr }
}

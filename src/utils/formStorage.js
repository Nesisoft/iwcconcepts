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
// Courses CRUD  (public reads, admin writes)
// ═══════════════════════════════════════════════════════════════════════════════

export const getAllCourses  = ()   => api('getAllCourses')
export const getCourseById  = (id) => api('getCourseById', { id })

export async function saveCourse(course) {
  const now    = new Date().toISOString()
  const record = { ...course, updatedAt: now }
  if (!record.id)        record.id        = uid()
  if (!record.createdAt) record.createdAt = now
  return api('saveCourse', { course: record }, await adminToken())
}

export async function deleteCourse(id) {
  return api('deleteCourse', { id }, await adminToken())
}

// ── Events ─────────────────────────────────────────────────────────────────────
// Events are stored in the same `courses` table (courseType: 'event') so the
// backend stays unchanged — these wrappers just give the Events Manager a clean,
// separate API. Courses-only and events-only views filter the shared list.

export const getAllEvents = () =>
  getAllCourses().then(list => (list || []).filter(c => (c.courseType || 'course') === 'event'))

export const getCoursesOnly = () =>
  getAllCourses().then(list => (list || []).filter(c => (c.courseType || 'course') !== 'event'))

export async function saveEvent(event) {
  // Force the discriminator so an event can never be mistaken for a course.
  return saveCourse({ ...event, courseType: 'event' })
}

export async function deleteEvent(id) {
  return deleteCourse(id)
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
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  return api('addEnrollment', { enrollment: record, baseUrl })
}

export async function getEnrollmentsByCourse(courseId) {
  return api('getEnrollmentsByCourse', { courseId }, await adminToken())
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

export const getContentSections = (courseId) =>
  adminToken().then(t => api('getContentSections', { courseId }, t))

export async function saveContentSection(section) {
  const now    = new Date().toISOString()
  const record = { ...section, updatedAt: now }
  if (!record.id)        record.id        = uid()
  if (!record.createdAt) record.createdAt = now
  return api('saveContentSection', { section: record }, await adminToken())
}

export async function deleteContentSection(courseId, id) {
  return api('deleteContentSection', { courseId, id }, await adminToken())
}

// ═══════════════════════════════════════════════════════════════════════════════
// Content Items CRUD  (admin-only)
// ═══════════════════════════════════════════════════════════════════════════════

export const getContentItems = (courseId) =>
  adminToken().then(t => api('getContentItems', { courseId }, t))

// A lesson can hold several ordered content blocks (video / text / file) so a
// single lesson can mix, e.g. a video, some rich text, and a downloadable file.
// Older lessons were stored as one `type` plus flat fields; normalize those to a
// one-block array so the admin editor and learner portal can treat every lesson
// uniformly — no database migration required.
export function lessonBlocks(item) {
  if (!item) return []
  if (Array.isArray(item.blocks) && item.blocks.length) return item.blocks
  const type = item.type || (item.videoUrl ? 'video' : item.fileUrl ? 'file' : 'text')
  return [{
    id:       `${item.id || 'b'}_legacy`,
    type,
    videoUrl: item.videoUrl || '',
    body:     item.body     || '',
    fileUrl:  item.fileUrl  || '',
    fileName: item.fileName || '',
  }]
}

export async function saveContentItem(item) {
  const now    = new Date().toISOString()
  const record = { ...item, updatedAt: now }
  if (!record.id)        record.id        = uid()
  if (!record.createdAt) record.createdAt = now
  // Persist the multi-block shape and drop the legacy single-type fields so the
  // stored record stays clean once a lesson has been edited.
  if (Array.isArray(record.blocks)) {
    delete record.type
    delete record.videoUrl
    delete record.body
    delete record.fileUrl
    delete record.fileName
  }
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

export const getPortalContent = (courseId, token) =>
  api('getPortalContent', { courseId }, token)

export const getMyProgress = (courseId, token) =>
  api('getMyProgress', { courseId }, token)

export const markItemComplete = (courseId, itemId, token) =>
  api('markItemComplete', { courseId, itemId, baseUrl: typeof window !== 'undefined' ? window.location.origin : '' }, token)

export const getEnrolledUsersProgress = () =>
  adminToken().then(t => api('getEnrolledUsersProgress', {}, t))

// ═══════════════════════════════════════════════════════════════════════════════
// Settings  (public reads, admin writes)
// ═══════════════════════════════════════════════════════════════════════════════

export const getSetting = (key) => api('getSetting', { key })

export const saveSetting = (key, value) =>
  adminToken().then(t => api('saveSetting', { key, value }, t))

// Email — admin send-test (server holds the provider key; never exposed here)
export const sendTestEmail = (to, baseUrl) =>
  adminToken().then(t => api('sendTestEmail', { to, baseUrl }, t))

// ═══════════════════════════════════════════════════════════════════════════════
// Lesson discussion / Q&A
// ═══════════════════════════════════════════════════════════════════════════════

export const getLessonComments = (courseId, itemId, token) =>
  api('getLessonComments', { courseId, itemId }, token)

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
// Membership — plans live in settings ('membershipPlans'), members in their own
// table. Rank = position in the plans array (higher index = higher tier).
// ═══════════════════════════════════════════════════════════════════════════════

export const getMembershipPlans = () =>
  api('getSetting', { key: 'membershipPlans' }).then(d => d?.plans || [])

export const saveMembershipPlans = (plans) =>
  adminToken().then(t => api('saveSetting', { key: 'membershipPlans', value: { plans } }, t))

export const getMembershipConfig = () =>
  api('getSetting', { key: 'membershipConfig' }).then(d => d || {})

export const saveMembershipConfig = (config) =>
  adminToken().then(t => api('saveSetting', { key: 'membershipConfig', value: config }, t))

// Public — called from the /join flow after payment (server validates the plan
// and dedupes on paymentRef).
export async function addMember(member) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  return api('addMember', { member, baseUrl })
}

export const getMyMembership = (token) => api('getMyMembership', {}, token)

export const getMembers   = ()  => adminToken().then(t => api('getMembers', {}, t))
export const saveMemberAdmin = (member) => adminToken().then(t => api('saveMember', { member }, t))
export const deleteMemberAdmin = (email) => adminToken().then(t => api('deleteMember', { email }, t))

// ═══════════════════════════════════════════════════════════════════════════════
// Events & notifications (customer portal)
// ═══════════════════════════════════════════════════════════════════════════════

export const getMyEvents = (token) => api('getMyEvents', {}, token)

export const getMyNotifications = (token) => api('getMyNotifications', {}, token)

export const markNotificationsRead = (ids, token) =>
  api('markNotificationsRead', { ids }, token)

// Admin: announce an event (in-portal notification + emails to its audience)
export const notifyEventAudience = (eventId, kind = 'created') =>
  adminToken().then(t => api('notifyEventAudience', {
    eventId, kind,
    baseUrl: typeof window !== 'undefined' ? window.location.origin : '',
  }, t))

// ═══════════════════════════════════════════════════════════════════════════════
// Contact-us messages  (public insert, admin read)
// ═══════════════════════════════════════════════════════════════════════════════

export const addContactMessage = (message) => api('addContactMessage', { message })

export const getContactMessages = () =>
  adminToken().then(t => api('getContactMessages', {}, t))

export const deleteContactMessage = (id) =>
  adminToken().then(t => api('deleteContactMessage', { id }, t))

// ═══════════════════════════════════════════════════════════════════════════════
// Admin users / invites  (admin only)
// ═══════════════════════════════════════════════════════════════════════════════

export const getAdminUsers = () =>
  adminToken().then(t => api('getAdminUsers', {}, t))

export const inviteAdmin = (email, name) =>
  adminToken().then(t => api('inviteAdmin', { email, name }, t))

// Is the signed-in admin allowed in? → { configured, isAdmin, bootstrap }
export const amIAdmin = () =>
  adminToken().then(t => api('amIAdmin', {}, t))

// Claim admin access (locks down /admin to the allowlist, with you included).
export const claimAdmin = (name) =>
  adminToken().then(t => api('claimAdmin', { name }, t))

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

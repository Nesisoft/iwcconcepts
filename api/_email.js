/**
 * api/_email.js — shared server-side email helper (NOT an HTTP route).
 * Files prefixed with "_" are ignored by Vercel's routing.
 *
 * Sends transactional email via Resend when RESEND_API_KEY is set.
 * When the key is missing it no-ops gracefully (logs and returns { skipped:true })
 * so the rest of the app keeps working without email configured.
 *
 * Env:
 *   RESEND_API_KEY   — your Resend API key (https://resend.com)
 *   EMAIL_FROM       — optional default "Name <you@domain.com>" (verified sender)
 *   PUBLIC_BASE_URL  — optional site origin used to build links in templates
 */

export const DEFAULT_EMAIL_SETTINGS = {
  fromName:  'IWC Concepts',
  fromEmail: '',                 // must be a Resend-verified address
  replyTo:   'info@iwcconcepts.com',
  welcomeEnabled:    true,
  completionEnabled: true,
  reminderEnabled:   false,
  reminderDays:      5,
  welcomeSubject:    'Welcome to {{course}} 🎉',
  welcomeBody:
    'Hi {{name}},\n\n' +
    'Welcome aboard! You\'re now enrolled in "{{course}}".\n\n' +
    'You can access your lessons anytime from your learning portal:\n{{portalUrl}}\n\n' +
    'We\'re excited to have you. Let\'s grow with purpose!\n\n— IWC Concepts',
  completionSubject: 'Congratulations on completing {{course}}! 🏆',
  completionBody:
    'Hi {{name}},\n\n' +
    'You did it — you\'ve completed "{{course}}". 🎉\n\n' +
    '{{certificateLine}}' +
    'Keep up the great work, and explore more courses anytime:\n{{coursesUrl}}\n\n— IWC Concepts',
  reminderSubject:   'Pick up where you left off in {{course}}',
  reminderBody:
    'Hi {{name}},\n\n' +
    'You started "{{course}}" but haven\'t been back in a while. ' +
    'Your next lesson is waiting — keep your momentum going!\n\n{{portalUrl}}\n\n— IWC Concepts',
}

// Replace {{placeholders}} in a template string.
export function renderTemplate(tpl, vars = {}) {
  return String(tpl || '').replace(/\{\{(\w+)\}\}/g, (_, k) =>
    vars[k] != null ? String(vars[k]) : ''
  )
}

// Wrap a plain-text body in a simple branded HTML shell.
export function bodyToHtml(text) {
  const safe = String(text || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  // Linkify bare URLs and convert newlines to <br>
  const linked = safe.replace(/(https?:\/\/[^\s<]+)/g,
    '<a href="$1" style="color:#6c3fc5;font-weight:600">$1</a>')
  const html = linked.replace(/\n/g, '<br>')
  return `<!doctype html><html><body style="margin:0;background:#f4f4f7;padding:24px;font-family:Inter,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #ececf2">
    <div style="background:linear-gradient(135deg,#0f0a1a,#1e0f3a);padding:22px 28px">
      <span style="display:inline-block;width:34px;height:34px;border-radius:8px;background:linear-gradient(135deg,#C9A84C,#e8c060);color:#1A1A2E;font-weight:900;text-align:center;line-height:34px;font-size:14px;vertical-align:middle">IW</span>
      <span style="color:#fff;font-weight:800;font-size:15px;letter-spacing:.5px;margin-left:10px;vertical-align:middle">IWC CONCEPTS</span>
    </div>
    <div style="padding:28px;color:#374151;font-size:15px;line-height:1.7">${html}</div>
    <div style="padding:16px 28px;border-top:1px solid #f1f1f4;color:#9ca3af;font-size:12px;text-align:center">
      © ${new Date().getFullYear()} IWC Concepts · Faith · Business · Impact
    </div>
  </div></body></html>`
}

/**
 * Send one email. Returns { ok } / { skipped } / throws on hard provider error.
 * `settings` is the merged email settings object (from the settings table).
 */
export async function sendMail({ to, subject, text, html, settings = {} }) {
  const key = process.env.RESEND_API_KEY
  const s   = { ...DEFAULT_EMAIL_SETTINGS, ...settings }

  const fromEmail = s.fromEmail || process.env.EMAIL_FROM_ADDRESS
  const from = process.env.EMAIL_FROM ||
    (fromEmail ? `${s.fromName} <${fromEmail}>` : null)

  if (!key || !from) {
    console.warn('[email] skipped — RESEND_API_KEY or sender not configured', { to, subject })
    return { skipped: true, reason: !key ? 'no_api_key' : 'no_sender' }
  }
  if (!to) return { skipped: true, reason: 'no_recipient' }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html: html || bodyToHtml(text),
      text: text || undefined,
      reply_to: s.replyTo || undefined,
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText)
    throw new Error(`Email provider error (${res.status}): ${detail}`)
  }
  return { ok: true }
}

// Convenience: build the standard set of template variables.
export function emailVars({ name, course, baseUrl, certificateUrl }) {
  const origin = baseUrl || process.env.PUBLIC_BASE_URL || ''
  return {
    name:   name || 'there',
    course: course || 'your course',
    portalUrl:  origin ? `${origin}/#/portal` : 'your learning portal',
    coursesUrl: origin ? `${origin}/#/courses` : 'our courses page',
    certificateUrl: certificateUrl || '',
    certificateLine: certificateUrl
      ? `Your certificate is ready — view and download it here:\n${certificateUrl}\n\n`
      : '',
  }
}

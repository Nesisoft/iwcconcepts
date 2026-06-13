/**
 * access.js — the single source of truth for "who can access what".
 *
 * Background: a course/event historically carried TWO overlapping signals —
 * the newer `accessMode` ('open' | 'plan' | 'legacy') and the older
 * `type` ('free' | 'paid'). Different screens re-derived access slightly
 * differently, which is the root of the "double mind" Francis described.
 *
 * This module normalizes every course (new or legacy) into ONE of three
 * first-class access modes and is imported by the catalogue, the portal,
 * the courses manager, and the access-audit screen so they all agree.
 *
 *   open        → free for everyone (a free taster / lead magnet)
 *   plan        → included with a membership tier and every tier above it
 *   standalone  → a one-time paid item that is NOT part of membership
 *
 * Events are gated by an `audience` object rather than by accessMode, so they
 * are handled separately (see audienceSummary / auditItem).
 *
 * IMPORTANT: this mirrors the server's access ladder in api/db.js
 * (getPortalContent). It does not replace it — the server stays authoritative.
 * Keeping the two in agreement is what removes the confusion.
 */

export const ACCESS = {
  OPEN:       'open',
  PLAN:       'plan',
  STANDALONE: 'standalone',
}

export const ACCESS_LABELS = {
  open:       'Open (free)',
  plan:       'Membership',
  standalone: 'One-time price',
}

/**
 * Normalize any course — including legacy records — to one of:
 *   'open' | 'plan' | 'standalone'
 *
 * Legacy mapping (no explicit accessMode, or the placeholder 'legacy'):
 *   type === 'paid'  → standalone (a one-off paid course)
 *   otherwise        → open       (a free course)
 */
export function accessModeOf(course) {
  if (!course) return ACCESS.OPEN
  switch (course.accessMode) {
    case ACCESS.PLAN:       return ACCESS.PLAN
    case ACCESS.OPEN:       return ACCESS.OPEN
    case ACCESS.STANDALONE: return ACCESS.STANDALONE
    // 'legacy' or undefined → derive from the old free|paid flag
    default:                return course.type === 'paid' ? ACCESS.STANDALONE : ACCESS.OPEN
  }
}

export const isOpenAccess       = (c) => accessModeOf(c) === ACCESS.OPEN
export const isPlanAccess       = (c) => accessModeOf(c) === ACCESS.PLAN
export const isStandaloneAccess = (c) => accessModeOf(c) === ACCESS.STANDALONE

/** True when access was set explicitly (not inferred from the legacy type). */
export const isExplicit = (c) => [ACCESS.OPEN, ACCESS.PLAN, ACCESS.STANDALONE].includes(c?.accessMode)

/** Does this item expose a learning portal (lessons), vs registration only? */
export const hasPortal = (c) => c?.hasPortalAccess === true || c?.hasPortalAccess === 'true'

/** Is this record an event (audience-gated) rather than a course? */
export const isEvent = (c) => (c?.courseType || 'course') === 'event'

/** The plan required to unlock a membership-gated course (or null). */
export function requiredPlan(course, plans = []) {
  if (accessModeOf(course) !== ACCESS.PLAN) return null
  return plans.find(p => p.id === course.accessPlanId) || null
}

/**
 * A short human label for the access path, e.g.
 *   "Open (free)" · "Growth+ members" · "One-time · GHS 250"
 */
export function accessLabel(course, plans = []) {
  const mode = accessModeOf(course)
  if (mode === ACCESS.PLAN) {
    const plan = requiredPlan(course, plans)
    return plan ? `${plan.name}+ members` : 'Membership (no plan set)'
  }
  if (mode === ACCESS.STANDALONE) {
    const price = Number(course?.price || 0)
    return price > 0 ? `One-time · ${course.currency || 'GHS'} ${price.toLocaleString()}` : 'One-time price'
  }
  return 'Open (free)'
}

/**
 * The single call-to-action a public course card should show.
 * One item → one CTA (never "Join" and "Register" at once).
 */
export function catalogCTA(course, plans = []) {
  const mode = accessModeOf(course)
  if (mode === ACCESS.PLAN)       return { label: 'Join to Access', target: '/join', kind: 'plan' }
  if (mode === ACCESS.STANDALONE) return { label: 'Register',       target: `/onboard?courseId=${course.id}`, kind: 'standalone' }
  return { label: 'Join Free', target: `/onboard?courseId=${course.id}`, kind: 'open' }
}

/** A plain-language summary of an event's audience. */
export function audienceSummary(event, plans = []) {
  const a = event?.audience || { type: 'public' }
  if ((a.type || 'public') !== 'restricted') return 'Public — everyone'
  const names = (a.planIds || []).map(id => plans.find(p => p.id === id)?.name || '«deleted plan»')
  const emailCount = (a.emails || []).filter(Boolean).length
  const parts = []
  if (names.length) parts.push(names.join(', '))
  if (emailCount) parts.push(`${emailCount} invited ${emailCount === 1 ? 'person' : 'people'}`)
  return parts.length ? `Restricted — ${parts.join(' + ')}` : 'Restricted — nobody set'
}

/**
 * Audit a single course/event and return any conflicts/ambiguities.
 * severity: 'error' (broken — someone is locked out or charged wrongly),
 *           'warn'  (ambiguous / will confuse), 'info' (tidy-up nudge).
 *
 * Returns { mode, label, explicit, issues: [{ severity, message }] }.
 */
export function auditItem(item, plans = []) {
  const issues = []
  const add = (severity, message) => issues.push({ severity, message })

  if (isEvent(item)) {
    const a = item.audience || { type: 'public' }
    const restricted = (a.type || 'public') === 'restricted'
    const planIds = (a.planIds || [])
    const emails  = (a.emails || []).filter(Boolean)
    if (restricted && planIds.length === 0 && emails.length === 0) {
      add('error', 'Restricted event with no plans and no invitees — nobody can see it.')
    }
    const missingPlans = planIds.filter(id => !plans.find(p => p.id === id))
    if (missingPlans.length) add('warn', `Audience references ${missingPlans.length} plan(s) that no longer exist.`)
    if (accessModeOf(item) === ACCESS.STANDALONE && !(Number(item.price) > 0)) {
      add('warn', 'Paid event has no ticket price set.')
    }
    const ev = item.eventAccess || {}
    const evmode = ev.mode || 'online'
    if (evmode !== 'in_person' && !ev.link) add('warn', 'Online event has no meeting link set.')
    if (evmode !== 'online' && !ev.address && !item.venue) add('warn', 'In-person event has no address/venue set.')
    return { mode: 'event', label: `${eventAccessLabel(item, plans)} · ${audienceSummary(item, plans)}`, explicit: true, issues }
  }

  const mode = accessModeOf(item)
  const label = accessLabel(item, plans)

  if (!isExplicit(item)) {
    add('info', 'Access is implicit (inferred from the old free/paid flag). Open the course and re-save to set it explicitly.')
  }

  // The classic "two gates on one item" — membership AND a paid flag.
  if (item.accessMode === ACCESS.PLAN && item.type === 'paid') {
    add('warn', 'Two gates: membership-gated but still flagged "paid". Set the course type away from paid (or switch to One-time) so members are not asked to pay.')
  }
  if (item.accessMode === ACCESS.OPEN && item.type === 'paid') {
    add('warn', 'Marked Open (free) but still flagged "paid" — conflicting signals.')
  }

  if (mode === ACCESS.PLAN) {
    if (!item.accessPlanId) {
      add('error', 'Membership-gated but no plan is selected — nobody can unlock it via membership.')
    } else if (!plans.find(p => p.id === item.accessPlanId)) {
      add('error', 'Required membership plan no longer exists — re-pick a plan.')
    }
  }

  if (mode === ACCESS.STANDALONE) {
    if (!(Number(item.price) > 0)) add('warn', 'One-time (paid) course has no price set.')
    if (!item.paystackPublicKey)   add('warn', 'One-time (paid) course has no Paystack public key — payment will fail.')
  }

  return { mode, label, explicit: isExplicit(item), issues }
}

/** Highest severity across an issue list, or 'ok'. */
export function worstSeverity(issues = []) {
  if (issues.some(i => i.severity === 'error')) return 'error'
  if (issues.some(i => i.severity === 'warn'))  return 'warn'
  if (issues.some(i => i.severity === 'info'))  return 'info'
  return 'ok'
}

// ── Events ──────────────────────────────────────────────────────────────────────
// Events reuse the same three access modes as courses, mapped to event language:
//   open       → Free to attend (publicly visible)
//   standalone → Paid ticket    (publicly visible; one-time payment — enforced later)
//   plan       → Membership     (a plan tier + every tier above it can see it)
// Events keep the existing `audience` object as their visibility engine, so the
// server (getMyEvents / audienceMatches / notifyEventAudience) is untouched. These
// helpers translate the chosen mode into that audience shape.

export const EVENT_ACCESS_LABELS = {
  open:       'Free to attend',
  standalone: 'Paid ticket',
  plan:       'Membership',
}

/** Plan ids at the selected plan's rank or above (rank = index; higher = senior). */
export function plansAtOrAbove(planId, plans = []) {
  const i = plans.findIndex(p => p.id === planId)
  if (i === -1) return []
  return plans.slice(i).map(p => p.id)
}

/**
 * Build the `audience` object to persist for an event, from the chosen access
 * mode. Email invites are always preserved as an additive allow-list.
 *   free / paid  → public (anyone can see it; paid attendance enforced at checkout)
 *   membership   → restricted to the chosen plan + all higher tiers (+ invites)
 */
export function eventAudienceFor(mode, planId, plans = [], emails = []) {
  const invites = (emails || []).map(e => String(e).trim()).filter(Boolean)
  if (mode === ACCESS.PLAN) {
    return { type: 'restricted', planIds: plansAtOrAbove(planId, plans), emails: invites }
  }
  return { type: 'public', planIds: [], emails: invites }
}

/** A short human label for an event's access path. */
export function eventAccessLabel(event, plans = []) {
  const mode = accessModeOf(event)
  if (mode === ACCESS.PLAN) {
    const plan = requiredPlan(event, plans)
    return plan ? `${plan.name}+ members` : 'Membership (no plan set)'
  }
  if (mode === ACCESS.STANDALONE) {
    const price = Number(event?.price || 0)
    return price > 0 ? `Paid · ${event.currency || 'GHS'} ${price.toLocaleString()}` : 'Paid ticket'
  }
  return 'Free to attend'
}

// ── Promo codes (authored now; redemption wired in the ticketing follow-up) ──────
// Shape: { code: 'EARLYBIRD', kind: 'free' | 'percent', value: 25 }  (value = % when percent)

export function normalizePromoCode(raw) {
  return {
    code:  String(raw?.code || '').trim().toUpperCase(),
    kind:  raw?.kind === 'free' ? 'free' : 'percent',
    value: raw?.kind === 'free' ? 0 : Math.max(1, Math.min(100, Number(raw?.value) || 0)),
  }
}

/** Find a usable promo code on an event (case-insensitive). Returns the code or null. */
export function findPromoCode(event, input) {
  const want = String(input || '').trim().toUpperCase()
  if (!want) return null
  return (event?.promoCodes || []).find(p => String(p.code || '').trim().toUpperCase() === want) || null
}

/** Apply a promo code to a price → the amount due (in the same currency units). */
export function priceAfterPromo(price, promo) {
  const base = Number(price) || 0
  if (!promo) return base
  if (promo.kind === 'free') return 0
  const pct = Math.max(0, Math.min(100, Number(promo.value) || 0))
  return Math.round(base * (1 - pct / 100))
}

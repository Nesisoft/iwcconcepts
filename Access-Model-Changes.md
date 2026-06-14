# Access Model — Changes Applied

*Decision: **Membership spine** · Scope: **Audit + clean up the model**. No backend or access-control logic changed; existing members and past enrollments keep their access.*

> ## Update — Membership-only courses (committed model)
>
> The platform owner has now committed to a **strict membership** model for courses, and a clean three-part mental model:
>
> - **Membership = the door.** People buy a *package* (name · price · duration) and fill one registration form at `/join`. Higher tiers include everything below. Membership expires after its duration → access is cut off until they **renew/upgrade**.
> - **Courses = the library.** Courses are **not** sold or registered individually — each is tied to a plan tier and unlocked by members at that tier or above. No per-course price, form, or "open/free" course. The Courses Manager only offers a membership tier; the public catalogue, homepage, and onboarding always show **"Join to Access" → `/join`**.
> - **Events = standalone happenings.** Events keep their own registration (Free / Paid ticket / Members-only) because non-members can attend.
>
> **Front-end enforced; backend ladder unchanged** so existing members and grandfathered enrollments keep access. Old `open`/`standalone` *courses* still resolve on the server, but the UI now treats every course as membership-gated — re-save legacy courses to a tier in the Courses Manager to finish migrating them (the Access Audit shows which still need it). Events are unaffected.

---

## What changed and why

The "double mind" had two real causes in the code (the public catalogue, member portal, and admin already did most of the right thing):

1. **`legacy` was a dumping ground** — choosing "One-time price" revealed the old `free | paid` toggle underneath, so there were *two* ways to make a free course and *no* first-class mode for a paid one-off.
2. **Each screen re-derived access slightly differently**, so the same course could be classified inconsistently.

The fix gives access decisions **one source of truth** and makes the three paths first-class everywhere: **Open** (free) · **Membership** (plan + above) · **One-time** (standalone paid).

### Files

| File | Change |
|---|---|
| `src/utils/access.js` | **New.** Single source of truth: `accessModeOf()` normalizes any course (incl. legacy) to `open` / `plan` / `standalone`, plus label/CTA/audit helpers. Mirrors the server ladder in `api/db.js`. |
| `src/pages/AccessAudit.jsx` | **New admin screen** (`/access-audit`). Lists every course & event with the *one* path it uses and flags conflicts: double-gated, missing/implicit accessMode, plan with no plan selected, paid with no price/Paystack key, restricted event nobody can see. Read-only — changes nothing. |
| `src/App.jsx` | Added the `/access-audit` admin route. |
| `src/pages/Dashboard.jsx` | Added the **Access Audit** tool card. |
| `src/pages/CoursesManager.jsx` | Access selector is now **Open / Membership / One-time** (`standalone`). Removed the nested free/paid toggle — picking a path sets `type` automatically (`standalone→paid`, else `free`), so an item can't be gated two ways at once. Clarified the portal-access toggle. |
| `src/pages/Courses.jsx` | Catalogue filters now **All / Free / Membership / One-time**; CTAs/badges derive from the shared helper. |
| `src/pages/Portal.jsx` | The "More Courses" bucket now also recognises the new `standalone` value (legacy logic preserved). |
| `src/pages/LandingPage.jsx` | Homepage carousel + course cards now show the correct CTA for membership courses ("Join to Access" → `/join`). |

**Not changed:** `api/db.js` (the authoritative access ladder), `CourseOnboarding.jsx` (payment), events' audience system, and the legacy `type` field — all kept for grandfathering, exactly as the recommendation's "what NOT to change yet" advised.

## Why it's safe (grandfathering)

- The server's OR access ladder is untouched, so current members and anyone with a past enrollment keep access.
- `accessModeOf()` reads old records correctly: `legacy/none + paid → standalone`, `legacy/none + free → open`. Nothing needs migrating.
- A course only gets an explicit `accessMode` when you **re-save it** in the Courses Manager. The Access Audit shows which courses are still "implicit" so you can make them explicit at your own pace.

## How to verify before deploying

1. `npm run build` — confirm it compiles (the sandbox here couldn't run it; an independent code review found no blockers).
2. Open **Dashboard → Access Audit**. Expect every course/event listed with one path; fix anything flagged red/amber.
3. Spot-check one of each in an incognito window: an **Open** course → "Join Free"; a **Membership** course → "Join to Access" → `/join`; a **One-time** course → "Register" → payment.
4. As an existing member, confirm the portal still shows "Included in your plan" and your courses open normally.

---

# Phase 4A — Events separated from courses

*Done in this round. Events now have their own management home and access model; the ticketing/promo **redemption** engine is the deferred Phase 4B (see below).*

### What changed

| File | Change |
|---|---|
| `src/pages/EventsManager.jsx` | **New admin screen** (`/events-admin`) for events only — details, date, venue, image, tags; an access model (**Free / Paid ticket / Membership**); promo-code authoring; online/in-person **join details**; RSVP form link; audience **announce**; publish/status. |
| `src/pages/CoursesManager.jsx` | Now **courses only** — reads `getCoursesOnly()`, the Course/Event toggle and the whole event authoring block are removed. |
| `src/utils/formStorage.js` | `getAllEvents` / `getCoursesOnly` / `saveEvent` / `deleteEvent` wrappers (filter the shared `courses` table — **no migration**). |
| `src/utils/access.js` | Event helpers: `eventAudienceFor` (free/paid → public, membership → plan rank **and above** + invites), `plansAtOrAbove`, `eventAccessLabel`, and promo-code helpers (`normalizePromoCode`, `findPromoCode`, `priceAfterPromo`). Audit now reports each event's access path. |
| `src/App.jsx`, `src/pages/Dashboard.jsx` | New `/events-admin` route + Events Manager dashboard card. |

### How it stays safe

Events still live in the `courses` table (`courseType: 'event'`) — **no data migration**. The Events Manager writes the existing `audience` shape, so the untouched backend (`getMyEvents`, `audienceMatches`, `notifyEventAudience`) keeps gating visibility exactly as before. Public pages, the portal, and the audit still read the full course list, so events stay visible everywhere they were. Your first answer is honored: a membership event is visible to the chosen plan **and every higher tier**; email invites are preserved as an additive allow-list.

---

# Phase 4B — Event ticketing + promo codes (built)

*Checkout and promo redemption are now wired, reusing the existing Paystack flow. **Must be payment-tested before going live** (the sandbox here can't run a build or a test charge).*

### What changed

| File | Change |
|---|---|
| `src/pages/CourseOnboarding.jsx` | Paid **events** (standalone) now flow through the existing Paystack checkout. Added a **promo / invite code** box on the payment screen: a `free` code skips Paystack entirely and registers for free; a `percent` code reduces the charged amount. The charged amount + promo code are stashed and recorded on the enrollment. |
| `api/db.js` (`getMyEvents`) | **Additive**: also returns events the user holds a ticket (enrollment) for, and for **paid** events withholds the join link/passcode until the user has a ticket. New fields: `accessMode`, `price`, `currency`, `needsTicket`, `hasTicket`. Free/membership/legacy events are byte-for-byte unchanged. |
| `src/pages/Portal.jsx` | Event card shows **"Get Ticket — GHS X"** for paid events without a ticket, **"✓ Ticket confirmed"** once held, and reveals join details only when the backend sends them. The free RSVP button is hidden for paid-but-unticketed events. |
| `src/pages/Courses.jsx`, `src/pages/LandingPage.jsx` | Public CTAs route paid items to `/onboard` even without a registration form (the ticket *is* the registration). |

### How payment works (and how it stays safe)

A paid event reuses the course payment path exactly: `/api/paystack-init` (server holds the secret key) → Paystack hosted checkout → return handler creates the enrollment. A `free` promo never calls Paystack (it would reject a zero amount), so it registers directly. The course flow is unchanged — with no promo, the amount sent equals the old discounted price.

---

# Phase 4C — Payment hardening + ticket emails (built)

*Two of the three follow-ups are now done. **Must be payment-tested before going live.***

### What changed

| File | Change |
|---|---|
| `api/paystack-init.js` | The charge is now **computed server-side** from the authoritative price — course/event `price × (1 − discount) +` validated promo, or the membership plan price — keyed off `metadata` (`courseId` vs `planId`/`type`). A tampered client `amount` no longer changes what's charged. If the item can't be looked up (DB unset/unreachable) it **falls back to the client amount** so checkout still works. Verified to match the client's displayed price exactly (e.g. 200 − 25% → 150, then 10% promo → 135 on both sides) and to leave membership purchases unchanged. |
| `api/db.js` (`addEnrollment`) | Event registrations now send a **transactional ticket email** with date, venue/online join link, passcode, and notes. The sensitive online link/passcode is included only when the event is **free** or there's **payment/promo evidence** (`paymentRef` or a valid code) — so the public endpoint can't email a paid event's link to someone with no proof of purchase. The whole email step is wrapped so it can never fail the enrollment that was just saved. |

### Phase 4C-3 — forged-ticket gap closed (built)

`addEnrollment` is a public, unauthenticated endpoint. Previously a scripted client could POST a forged enrollment for a paid event and mint a zero-cost ticket. **Now closed:**

- `api/db.js` adds `verifyPaystackPayment(reference)` and, before accepting an enrollment for a **priced standalone event**, requires either a **free-entry (`kind: 'free'`) promo code** or a **Paystack reference that verifies as `success`** (server-side `GET /transaction/verify/:ref`, secret key never exposed). A **percentage** promo code is *not* sufficient on its own — it only discounts the price, so a percent-coded registration must still carry a verified payment reference (otherwise a discount code could be used to mint a free ticket).
- **Safe-by-design** (verified by independent review): it rejects only a *definitive* bad/missing reference (`failed`/`abandoned`/`reversed`/not-found, or no reference and no promo). On any uncertainty — bad/missing key, 401/403/5xx, network error, or a still-settling `pending`/`ongoing` status — it **allows** the registration, so a genuine payer is never blocked by an outage. Slow-settling mobile-money/bank charges pass through.
- **Scope:** only priced standalone *events* are gated. Free events, membership events, price-0 events, and all *courses* are untouched and behave exactly as before. The enrollment INSERT still happens only after the gate, and the email step still can't fail a saved enrollment.

> Residual (rare): if `PAYSTACK_SECRET_KEY` is unset in the API environment, references can't be verified, so a *reference-bearing* forge could slip through (a no-reference forge is still rejected). Keep the key set — it's already required for checkout.

### Still open (smaller)

- **Membership events + promo for outsiders.** Promo codes currently apply to **paid** events. Letting a non-eligible person into a *membership* event via a code needs an email/identity capture on the membership wall (the backend already returns events you're enrolled in, so it's mostly front-end).

## Other optional next steps

- Make `AnalyticsAdmin` count revenue by access mode (today a priced *plan* course shows "—", since plan courses don't take per-course payment).
- A unified "who can access this, and why" admin view that also reads `members` + `enrollments` (the audit currently reads courses/plans).
- (If ever wanted) move events to a dedicated `events` database table — needs a migration; not required for the separation above.

## Other optional next steps

- Make `AnalyticsAdmin` count revenue by access mode (today a priced *plan* course shows "—", since plan courses don't take per-course payment).
- A unified "who can access this, and why" admin view that also reads `members` + `enrollments` (the audit currently reads courses/plans).
- (If ever wanted) move events to a dedicated `events` database table — needs a migration; not required for the separation above.

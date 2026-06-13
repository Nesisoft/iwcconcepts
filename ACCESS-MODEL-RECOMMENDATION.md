# IWC Concepts — Access Model Recommendation

*Membership vs. course registration: why it feels confusing, and how to resolve it.*
Prepared for Francis · advisory only (no access-control code was changed).

---

## 1. The short version

Your platform currently offers **three overlapping ways** for someone to get access, and they compete with each other. That's the "double mind" you're feeling. The fix is not to remove a feature — it's to give each piece **one clear job** and make sure **no single course or event is ever gated two different ways at once**.

My recommendation: **make membership the spine of the platform, and treat individual registration as an on-ramp** for two specific cases (free tasters and genuinely standalone paid workshops). Everything else flows through membership tiers.

---

## 2. What you have today

Reading the current code, access is decided by a few fields on each course/event and by a member's plan:

- **Membership / Plans** — a `members` record carries a `planId` and a rank (position in the plans list). Higher tiers inherit everything below them. Access can expire (`expiresAt`). Paid via Paystack as a membership purchase.
- **Per-course registration (enrollments)** — an `enrollments` record grants access to **one** course. Used for free "open" courses and for the older "paid single course" flow. Paid via Paystack as a per-course charge.
- **Events** — stored alongside courses (`courseType: 'event'`) but gated by an **audience** (public, or restricted to chosen plans / invited emails) rather than by enrollment.

The portal's access check is essentially an **OR ladder**: a user can open a course if it's *open*, **or** they have an *enrollment*, **or** their *membership tier is high enough*. Each course also still carries a legacy `type: free | paid` alongside the newer `accessMode: open | plan | legacy`.

### Where the confusion comes from

- **Two gates on one item.** A course can be membership-gated *and* still carry the legacy paid-registration path, so users (and you) can't tell which one applies.
- **Two parallel "sign-up" journeys.** "Become a member" and "Register for this course" both lead to Paystack but create different records (`members` vs `enrollments`), with no single admin view of "who has access to X, and why."
- **Legacy + new fields coexist.** `type: paid` and `accessMode` can disagree; rank-based inheritance only applies to `accessMode: 'plan'`, not to legacy paid courses.
- **Events behave differently from courses** (audience-gated, no real per-event "registration"), so the mental model shifts depending on what you're looking at.

---

## 3. Recommended model: "Membership is the spine"

Give every course and event **exactly one** access path, chosen from three clear options. Never combine them on the same item.

| If the item is… | Set access to | Who gets in | Payment | Typical use |
|---|---|---|---|---|
| A free taster / lead magnet | **Open** | Anyone (optionally with portal access) | None | Build the list, show value |
| Part of your core offering | **Membership (plan)** | Members at the required tier **and above** | Through their membership | The bulk of your courses & member events |
| A one-off paid workshop/event that is *not* part of membership | **Standalone (one-time)** | Anyone who pays once | Per-item Paystack | Special masterclasses, ticketed events |

The principle: **one item → one path.** A member never sees "pay for this course" for something their plan already includes; a non-member never sees a membership wall on a genuinely standalone paid workshop.

### Why membership as the spine (vs. the alternatives)

Your data model already *leans* this way — plans have ranks, inheritance, and expiry, while per-course registration is described in the code as "legacy / grandfathered." Leaning in means less rework. It also gives you recurring revenue and one place to reason about "what can this person see."

The two alternatives are valid if your business is different:

- **Course-first (à la carte)** suits you better if most buyers want one course and rarely return. Then memberships become an optional "bundle" and you'd de-emphasize tiers.
- **Pure membership** (retire individual registration entirely) is the simplest mental model, but you lose the free-taster on-ramp and one-off ticket sales.

If you tell me which of these matches your actual goal, I'll tailor the migration. The plan below assumes the recommended "membership spine."

---

## 4. UI / UX changes that remove the confusion

These matter as much as the data model:

1. **One call-to-action per card.** Show *either* "Join to access" (plan) *or* "Register" (open/standalone) — never both. The card already knows its `accessMode`; drive the CTA purely off that.
2. **Separate the two stories on the public site.** A "Membership" section (what you get, the tiers) and a separate "Courses & Events" catalogue. Make it obvious that membership is the main door and individual items are the exceptions.
3. **In the portal, label *why* a course is available** ("Included with your plan" / "You registered for this" / "Free course") so members understand what their membership is doing for them.
4. **One admin "access" view.** A single screen showing, per course/event, who can see it and through which path (membership tier, enrollment, or open). Today that data is split across `members` and `enrollments`.

---

## 5. Migration plan (low-risk, phased — no big bang)

You can stop after any phase; each one stands on its own.

**Phase 0 — Audit (no code).** List every course/event and write next to each the *one* path it should use going forward. This alone surfaces most of the confusion.

**Phase 1 — Make access explicit (data only).** Set `accessMode` deliberately on every course (`open` / `plan` / standalone). Stop relying on the legacy `type: free|paid` to imply access. Keep the existing OR ladder so current members and past enrollments are **grandfathered** — nobody loses access.

**Phase 2 — UI clarity.** Implement the one-CTA-per-card rule and the public-site split (Section 4, items 1–2). This is where users stop feeling the "double mind," and it's mostly front-end.

**Phase 3 — Consolidate (optional).** Introduce a first-class "standalone paid" access mode so paid one-offs aren't riding the `legacy` path. Retire the `type` field once every course has an explicit `accessMode`. Build the unified admin access view.

**Phase 4 — Unify events (optional).** Let events use the same three access modes as courses (open / plan / standalone) instead of a separate audience system, so the model is identical everywhere.

### Guardrails during migration
- Keep the OR access ladder until Phase 3 so existing members/enrollments keep working.
- Don't break **already-shared registration links** — leave old enrollment routes working even after new items use membership.
- Treat expired memberships explicitly (the code already checks `expiresAt`); decide what an expired member sees.

---

## 6. What NOT to change yet

Per your direction, no access-control code was touched in this round. I'd also hold off on deleting the `enrollments` path or the legacy fields until Phases 1–2 are done and you've confirmed the new model in production — those are the safety net that keeps current users from being locked out.

---

## 7. Decision I need from you

Confirm the business intent and I'll turn the relevant phase into concrete code:

- **Membership spine** (my recommendation) — proceed with the plan above.
- **Course-first (à la carte)** — I'll rework toward individual purchases with optional bundles.
- **Pure membership** — I'll retire individual registration entirely.

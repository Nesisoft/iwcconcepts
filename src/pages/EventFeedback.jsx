// EventFeedback re-uses EventRegistration with isFeedback=true (detected from hash path)
// This file just re-exports it — the registration page auto-detects /feedback in the URL
export { default } from './EventRegistration'

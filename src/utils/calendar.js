/**
 * calendar.js — "Add to Calendar" helpers (no backend needed)
 *
 * Builds a Google Calendar link and a downloadable .ics file from an event
 * object ({ title, tagline, startDate, endDate, venue, eventAccess }).
 */

function toCalDate(d) {
  // → YYYYMMDDTHHMMSSZ (UTC)
  return new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function stripHtml(html = '') {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return (tmp.textContent || tmp.innerText || '').trim()
}

function eventTimes(ev) {
  const start = ev.startDate ? new Date(ev.startDate) : new Date()
  const end   = ev.endDate ? new Date(ev.endDate) : new Date(start.getTime() + 2 * 3600000) // default 2h
  return { start, end }
}

function eventLocation(ev) {
  const a = ev.eventAccess || {}
  if ((a.mode || 'online') === 'in_person') return a.address || ev.venue || ''
  return a.link || ev.venue || 'Online'
}

function eventDescription(ev) {
  const a = ev.eventAccess || {}
  const lines = [stripHtml(ev.tagline || '')]
  if ((a.mode || 'online') !== 'in_person') {
    if (a.platform) lines.push(`Platform: ${a.platform}`)
    if (a.link)     lines.push(`Join link: ${a.link}`)
    if (a.passcode) lines.push(`Passcode: ${a.passcode}`)
  }
  if (a.notes) lines.push(a.notes)
  return lines.filter(Boolean).join('\n')
}

export function googleCalendarUrl(ev) {
  const { start, end } = eventTimes(ev)
  const params = new URLSearchParams({
    action:   'TEMPLATE',
    text:     ev.title || 'Event',
    dates:    `${toCalDate(start)}/${toCalDate(end)}`,
    details:  eventDescription(ev),
    location: eventLocation(ev),
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function downloadICS(ev) {
  const { start, end } = eventTimes(ev)
  const esc = s => String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//IWC Concepts//Events//EN',
    'BEGIN:VEVENT',
    `UID:${ev.id || Date.now()}@iwcconcepts`,
    `DTSTAMP:${toCalDate(new Date())}`,
    `DTSTART:${toCalDate(start)}`,
    `DTEND:${toCalDate(end)}`,
    `SUMMARY:${esc(ev.title)}`,
    `DESCRIPTION:${esc(eventDescription(ev))}`,
    `LOCATION:${esc(eventLocation(ev))}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.download = `${(ev.title || 'event').replace(/\s+/g, '_')}.ics`
  a.href = url
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
